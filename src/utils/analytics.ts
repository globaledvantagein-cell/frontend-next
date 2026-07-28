// Thin, SSR-safe wrappers around posthog-js. PostHog is initialized once in
// instrumentation-client.ts; here we just centralize the required
// `typeof window !== 'undefined'` guard (and swallow errors) so a missing token
// or an analytics hiccup can never break the UX. Import { track } from here at
// call sites instead of calling posthog.capture directly.

import posthog from 'posthog-js';

/** Capture a custom event. No-ops on the server or if PostHog isn't initialized. */
export function track(event: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    posthog.capture(event, properties);
  } catch {
    /* analytics must never throw into product code */
  }
}

/** Associate the current session with a user id + person properties. */
export function identifyUser(userId: string, properties?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    posthog.identify(userId, properties);
  } catch {
    /* ignore */
  }
}

/** Clear the identified state (call on logout). */
export function resetAnalytics(): void {
  if (typeof window === 'undefined') return;
  try {
    posthog.reset();
  } catch {
    /* ignore */
  }
}
