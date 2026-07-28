// Cookie/analytics consent — single source of truth.
//
// GDPR model (what the big EU-facing products do):
//   - No analytics tracking happens until the visitor explicitly accepts.
//     PostHog starts opted-OUT with in-memory persistence (no cookies written).
//   - The choice is stored once per device (localStorage) and never re-asked —
//     signed-in, signed-up, or anonymous makes no difference.
//   - CONSENT_VERSION is the re-prompt switch: bump it whenever the cookie
//     policy changes and every visitor is asked again exactly once.
//   - "Only necessary" is remembered too (rejecting must be as sticky as
//     accepting — re-nagging rejectors is a GDPR violation).

import posthog from 'posthog-js';

/**
 * Bump this when the cookie policy changes to re-prompt everyone once.
 * KEEP IN SYNC with the mirrored constants in src/instrumentation-client.ts
 * (that file cannot import this one — separate Turbopack entry point).
 */
export const CONSENT_VERSION = 1;

const STORAGE_KEY = 'ejg_cookie_consent';

export type ConsentChoice = 'accepted' | 'rejected';

export interface StoredConsent {
  version: number;
  choice: ConsentChoice;
  timestamp: string;
}

/** The current stored consent, or null if never answered / version outdated. */
export function getConsent(): StoredConsent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed?.version !== CONSENT_VERSION) return null; // policy changed → re-ask
    if (parsed.choice !== 'accepted' && parsed.choice !== 'rejected') return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Persist a choice and immediately apply it to PostHog. */
export function setConsent(choice: ConsentChoice): void {
  if (typeof window === 'undefined') return;
  try {
    const stored: StoredConsent = { version: CONSENT_VERSION, choice, timestamp: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    /* storage full/blocked — still apply for this session */
  }
  applyConsent(choice);
}

/**
 * Apply a consent choice to PostHog. Safe to call when PostHog was never
 * initialized (no token) — every call is wrapped.
 */
export function applyConsent(choice: ConsentChoice): void {
  if (typeof window === 'undefined') return;
  try {
    if (choice === 'accepted') {
      // Durable persistence first so the opt-in itself is remembered by PostHog.
      posthog.set_config({ persistence: 'localStorage+cookie' });
      posthog.opt_in_capturing();
    } else {
      posthog.opt_out_capturing();
      // Keep persistence in memory so no analytics cookie is ever written.
      posthog.set_config({ persistence: 'memory' });
    }
  } catch {
    /* PostHog absent — consent is still stored for when it loads */
  }
}

/** Event name used by the footer "Cookie settings" link to reopen the banner. */
export const OPEN_COOKIE_SETTINGS_EVENT = 'ejg:open-cookie-settings';

export function openCookieSettings(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}
