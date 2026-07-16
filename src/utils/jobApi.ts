// Centralized fetch wrapper for ALL API calls.
//
// Why this exists:
//   - Every job-related request must carry the visitor fingerprint so the
//     backend can compute the composite anti-bypass identity.
//   - Authenticated requests need the Authorization header.
//   - The vid cookie is sent automatically by the browser, but we also
//     mirror it in a header for environments where credentialed CORS
//     doesn't deliver cookies cleanly.
//
// Use this for ANY call to the backend — never raw fetch().
//
// Three flavors of GET:
//   apiGet         → uncached, always hits the network. Use for live data
//                    (auth/me, anything that changes per request).
//   apiGetCached   → tries memory → localStorage → network. Use for stable
//                    GETs like jobs list, dropdowns. Cache TTL configurable.

import { getFingerprint } from './fingerprint';
import { getVisitorId } from './visitorId';
import { memoryGet, memorySet, localGet, localSet } from './cache/index';

// Single source of truth — must match the key used by AuthContext.
export const STORAGE_KEY_TOKEN = 'ejg_token';
export const STORAGE_KEY_USER = 'ejg_user';

function authHeaders(): Record<string, string> {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const headers: Record<string, string> = {
        'x-fingerprint': getFingerprint(),
        'x-vid': getVisitorId(),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

interface RequestOpts {
    signal?: AbortSignal;
    /** Skip auth/fingerprint headers entirely (for truly public endpoints) */
    noAuth?: boolean;
}

interface CachedRequestOpts extends RequestOpts {
    /** Memory-cache TTL in ms (default 10 min). 0 disables. */
    memoryTtlMs?: number;
    /** localStorage TTL in ms (default 10 min). 0 disables. */
    localTtlMs?: number;
    /** Skip cache reads (still writes after fetch). */
    skipCache?: boolean;
}

// ─── Plain (uncached) requests ──────────────────────────────────────────

export async function apiGet<T = any>(path: string, opts: RequestOpts = {}): Promise<T> {
    const headers = opts.noAuth ? {} : authHeaders();
    const res = await fetch(path, {
        method: 'GET',
        credentials: 'include',
        headers,
        signal: opts.signal,
    });
    if (!res.ok && res.status !== 200) {
        const err = await res.json().catch(() => ({}));
        throw new ApiError(err.error || `Request failed: ${res.status}`, res.status);
    }
    return res.json();
}

export async function apiPost<T = any>(path: string, body?: unknown, opts: RequestOpts = {}): Promise<T> {
    const headers = opts.noAuth
        ? { 'Content-Type': 'application/json' }
        : { ...authHeaders(), 'Content-Type': 'application/json' };
    const res = await fetch(path, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: opts.signal,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new ApiError(err.error || `Request failed: ${res.status}`, res.status);
    }
    return res.json();
}

export async function apiPatch<T = any>(path: string, body?: unknown, opts: RequestOpts = {}): Promise<T> {
    const headers = opts.noAuth
        ? { 'Content-Type': 'application/json' }
        : { ...authHeaders(), 'Content-Type': 'application/json' };
    const res = await fetch(path, {
        method: 'PATCH',
        credentials: 'include',
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: opts.signal,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new ApiError(err.error || `Request failed: ${res.status}`, res.status);
    }
    return res.json();
}

export async function apiDelete<T = any>(path: string, opts: RequestOpts = {}): Promise<T> {
    const headers = opts.noAuth ? {} : authHeaders();
    const res = await fetch(path, {
        method: 'DELETE',
        credentials: 'include',
        headers,
        signal: opts.signal,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new ApiError(err.error || `Request failed: ${res.status}`, res.status);
    }
    return res.json();
}

// ─── Cached GET (memory → localStorage → network) ───────────────────────
//
// Cache key = full `path` string. So /api/jobs?page=1 and /api/jobs?page=2
// are stored independently — same as the backend would treat them.
//
// Lookup order:
//   1. memoryGet(path)       → instant if seen this session
//   2. localGet(path)        → fast if seen recent past, survives reload
//   3. fetch(path)           → network, then write to BOTH caches
//
// After a successful network fetch, BOTH caches are updated so subsequent
// calls (same tab or new tab) hit the fast paths.
export async function apiGetCached<T = any>(path: string, opts: CachedRequestOpts = {}): Promise<T> {

    const memoryTtl = opts.memoryTtlMs ?? 10 * 60 * 1000;
    const localTtl  = opts.localTtlMs  ?? 10 * 60 * 1000;

    // 1. Memory cache (current tab)
    if (!opts.skipCache && memoryTtl > 0) {
        const hit = memoryGet<T>(path);
        if (hit !== undefined) return hit;
    }

    // 2. localStorage cache (persistent across tabs)
    if (!opts.skipCache && localTtl > 0) {
        const hit = localGet<T>(path);
        if (hit !== undefined) {
            // Warm the memory cache so the next read this tab is even faster
            if (memoryTtl > 0) memorySet(path, hit, memoryTtl);
            return hit;
        }
    }

    // 3. Network — pass through to plain apiGet, then populate both caches
    const fresh = await apiGet<T>(path, {
        signal: opts.signal,
        noAuth: opts.noAuth,
    });

    if (memoryTtl > 0) memorySet(path, fresh, memoryTtl);
    if (localTtl > 0)  localSet(path, fresh, localTtl);

    return fresh;
}

/** Custom error type so callers can branch on status (e.g. 401 → redirect to /login). */
export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}

// Job-detail-specific shape — backend returns one of these two responses.
export type JobDetailResponse =
    | { gated: false; job: any }
    | { gated: true; teaser: any };

export async function fetchJobDetail(jobId: string, opts?: RequestOpts): Promise<JobDetailResponse> {
    return apiGet<JobDetailResponse>(`/api/jobs/${encodeURIComponent(jobId)}/full`, opts);
}

/**
 * Cached variant of fetchJobDetail — for the /jobs/:id share page.
 *
 * Authenticated users are never gated, so we cache aggressively in both
 * memory (10 min) and localStorage (5 min). Opening 10 shared links in
 * a row costs 10 network calls the first time; revisiting any is instant.
 *
 * Anonymous users may be gated after FREE_VIEW_LIMIT. We cache in memory
 * only (5 min) so the gate decision clears on page refresh (which happens
 * after the signup redirect). Re-opening the SAME job within 5 min is a
 * cache hit; opening a NEW job always hits the network so the backend can
 * track the view count.
 */
export async function fetchJobDetailCached(
    jobId: string,
    isAuthenticated: boolean,
    opts?: CachedRequestOpts,
): Promise<JobDetailResponse> {
    const path = `/api/jobs/${encodeURIComponent(jobId)}/full`;

    if (isAuthenticated) {
        return apiGetCached<JobDetailResponse>(path, {
            memoryTtlMs: 10 * 60 * 1000,
            localTtlMs:  5 * 60 * 1000,
            ...(opts || {}),
        });
    }

    // Anonymous: memory-only (localStorage would survive signup page refresh
    // and serve a stale { gated: true } response after the user signs in).
    return apiGetCached<JobDetailResponse>(path, {
        memoryTtlMs: 5 * 60 * 1000,
        localTtlMs:  0,
        ...(opts || {}),
    });
}