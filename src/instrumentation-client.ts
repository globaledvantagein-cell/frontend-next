// PostHog client-side initialization (Next.js 15.3+ instrumentation-client).
// This runs once when the client bundle loads, before any component renders.
// After this, `posthog` can be imported and used directly anywhere.
//
// GDPR: PostHog starts opted-OUT with in-memory persistence — no events are
// sent and no cookies are written until the visitor accepts via the consent
// banner (components/CookieConsent.tsx). If a stored "accepted" choice exists
// from a previous visit, it is applied immediately so tracking resumes
// without re-asking. A stored "rejected" choice keeps everything off.
//
// NOTE: this file is a separate Turbopack entry point — it must NOT import
// app modules (e.g. utils/consent.ts); sharing a module across the two
// bundles breaks with "module factory is not available". The tiny consent
// read below is duplicated on purpose. Keep STORAGE KEY + VERSION in sync
// with src/utils/consent.ts.
//
// person_profiles: 'identified_only' keeps anonymous pageviews anonymous (no
// person profile) until we explicitly call posthog.identify() on login — this
// saves on PostHog billing.

import posthog from 'posthog-js';

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

// Mirror of utils/consent.ts (deliberately not imported — see NOTE above).
const CONSENT_STORAGE_KEY = 'ejg_cookie_consent';
const CONSENT_VERSION = 1;

function hasStoredAcceptance(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed?.version === CONSENT_VERSION && parsed?.choice === 'accepted';
  } catch {
    return false;
  }
}

// Skip init silently when the token is absent (e.g. local dev without a key) —
// posthog.capture() then no-ops behind the guard in utils/analytics.ts.
if (token) {
  const accepted = hasStoredAcceptance();

  posthog.init(token, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    session_recording: { recordHeaders: false, recordBody: false },
    opt_in_site_apps: true,
    // Consent gate: opted out + cookieless until the visitor accepts.
    opt_out_capturing_by_default: !accepted,
    persistence: accepted ? 'localStorage+cookie' : 'memory',
  });

  if (accepted) {
    try { posthog.opt_in_capturing(); } catch { /* ignore */ }
  }
}
