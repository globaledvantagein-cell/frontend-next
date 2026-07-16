// Server-side data fetching for RSC/SSR pages. Talks directly to the Express
// backend (server-to-server) using API_ORIGIN. NEVER import this into a client
// component — it has no auth token and is meant for public SEO data only.

import type { IJob } from '@/types';

const API_ORIGIN = process.env.API_ORIGIN || 'http://localhost:3000';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://englishjobsgermany.com';

interface JobsListResponse {
  jobs: IJob[];
  totalJobs: number;
}

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_ORIGIN}${path}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** GET /api/jobs — returns { jobs, totalJobs }. */
export async function fetchJobs(params: {
  search?: string;
  category?: string;
  limit?: number;
  page?: number;
}): Promise<JobsListResponse> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.category) qs.set('category', params.category);
  qs.set('limit', String(params.limit ?? 100));
  if (params.page) qs.set('page', String(params.page));
  const data = await getJson<JobsListResponse>(`/api/jobs?${qs.toString()}`);
  return data ?? { jobs: [], totalJobs: 0 };
}

/** GET /api/jobs/public-bait — array of 9 newest teaser jobs. */
export async function fetchBaitJobs(): Promise<IJob[]> {
  const data = await getJson<IJob[]>('/api/jobs/public-bait');
  return Array.isArray(data) ? data : [];
}

/** GET /api/jobs/directory — company directory stats. */
export async function fetchDirectory(): Promise<Record<string, unknown>[]> {
  const data = await getJson<Record<string, unknown>[]>('/api/jobs/directory');
  return Array.isArray(data) ? data : [];
}

/** GET /api/jobs/:id/full — full job (or gated teaser). Anonymous server request. */
export async function fetchJobFull(
  id: string,
): Promise<{ gated: boolean; job?: IJob; teaser?: IJob } | null> {
  return getJson(`/api/jobs/${encodeURIComponent(id)}/full`);
}

// ── Career guide ───────────────────────────────────────────────────────────
// The only JSON source for articles is the admin endpoint (auth-gated). If a
// service token is available we send it; otherwise these degrade to empty and
// the pages render their empty state. Content still exists server-rendered by
// Express at /career-guide; this replica powers the App Router equivalents.

export interface CareerArticle {
  _id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  description: string;
  author?: string;
  tags?: string[];
  status: 'draft' | 'published';
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

async function fetchAdminArticles(): Promise<CareerArticle[]> {
  const token = process.env.CAREER_GUIDE_SERVICE_TOKEN;
  try {
    const res = await fetch(`${API_ORIGIN}/api/admin/career-guide`, {
      cache: 'no-store',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { success?: boolean; articles?: CareerArticle[] };
    return Array.isArray(data.articles) ? data.articles : [];
  } catch {
    return [];
  }
}

export async function fetchPublishedArticles(): Promise<CareerArticle[]> {
  const all = await fetchAdminArticles();
  return all.filter((a) => a.status === 'published');
}

export async function fetchArticlesByCategory(category: string): Promise<CareerArticle[]> {
  return (await fetchPublishedArticles()).filter((a) => a.category === category);
}

export async function fetchArticleBySlug(slug: string): Promise<CareerArticle | null> {
  return (await fetchPublishedArticles()).find((a) => a.slug === slug) ?? null;
}
