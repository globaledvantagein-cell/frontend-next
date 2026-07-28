// PostHog client-side initialization (Next.js 15.3+ instrumentation-client).
// This runs once when the client bundle loads, before any component renders.
// After this, `posthog` can be imported and used directly anywhere.
//
// person_profiles: 'identified_only' keeps anonymous pageviews anonymous (no
// person profile) until we explicitly call posthog.identify() on login — this
// saves on PostHog billing.

import posthog from 'posthog-js';

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

// Skip init silently when the token is absent (e.g. local dev without a key) —
// posthog.capture() then no-ops behind the guard in utils/analytics.ts.
if (token) {
  posthog.init(token, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    session_recording: { recordHeaders: false, recordBody: false },
    opt_in_site_apps: true,
  });
}
