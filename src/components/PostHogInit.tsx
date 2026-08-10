'use client';

// PostHog client-side initialization — runs in an effect, i.e. AFTER React has
// hydrated. It used to live in instrumentation-client.ts, which executes when
// the client bundle loads (pre-hydration): posthog.init() injects its
// array.js / site-app <script> tags into the DOM immediately, and those nodes
// landed in front of the JSON-LD <script>s at the top of <body>, so React
// paired the wrong nodes during hydration and warned on every page load.
//
// GDPR: PostHog starts opted-OUT with in-memory persistence — no events are
// sent and no cookies are written until the visitor accepts via the consent
// banner (components/CookieConsent.tsx). A stored "accepted" choice from a
// previous visit is applied immediately; a stored "rejected" keeps it off.
//
// person_profiles: 'identified_only' keeps anonymous pageviews anonymous (no
// person profile) until we explicitly call posthog.identify() on login.

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { getConsent } from '../utils/consent';

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

let initialized = false;

export default function PostHogInit() {
  useEffect(() => {
    // Skip silently when the token is absent (e.g. local dev without a key) —
    // posthog.capture() then no-ops behind the guard in utils/analytics.ts.
    if (initialized || !token) return;
    initialized = true;

    const accepted = getConsent()?.choice === 'accepted';

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
  }, []);

  return null;
}
