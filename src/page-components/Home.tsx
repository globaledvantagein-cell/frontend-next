'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import { Link } from '@/compat/router';
import { ArrowRight } from 'lucide-react';
import HomeJobCard from '../components/HomeJobCard';
import CompanyCard from '../components/DirectoryCard';
import type { IJob, ICompany } from '../types';
import { Button, Container } from '../components/ui';
import { BRAND } from '../theme/brand';
import { CONTENT } from '../theme/content';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../utils/jobApi';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '../utils/categorize';

const TICKER = CONTENT.home.ticker;

// Internal link paths to the server-rendered SEO landing pages. Only the major
// cities are listed here — each /city/* page cross-links to every other city,
// so Google reaches the long tail from any one of them (and from /sitemap.xml)
// without turning the homepage into a link dump.
//
// Slugs MUST match CANONICAL_CITIES in the backend's src/seo/cities.js.
const SEO_CITIES: ReadonlyArray<readonly [string, string]> = [
  ['berlin',     'Berlin'],
  ['munich',     'Munich'],
  ['hamburg',    'Hamburg'],
  ['frankfurt',  'Frankfurt'],
  ['cologne',    'Cologne'],
  ['stuttgart',  'Stuttgart'],
  ['dusseldorf', 'Düsseldorf'],
  ['leipzig',    'Leipzig'],
  ['dresden',    'Dresden'],
  ['hanover',    'Hanover'],
  ['nuremberg',  'Nuremberg'],
  ['bonn',       'Bonn'],
];

const SEO_LINK: CSSProperties = {
  fontSize: '0.84rem',
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  border: '1px solid var(--border)',
  borderRadius: 999,
  padding: '5px 12px',
  background: 'var(--bg-surface)',
};

// auto-fill + minmax gives 3 columns on desktop and collapses to 2/1 on
// narrower screens without needing a media query.
const JOB_GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
  gap: 12,
};

export default function Home() {
  const { isAuthenticated, token } = useAuth();
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    document.title = `${BRAND.fullName} | ${BRAND.tagline}`;
    (async () => {
      try {
        const [jd, dd] = await Promise.all([
          // /public-bait returns the 9 newest active jobs, already teaser-safe.
          apiGet<IJob[]>('/api/jobs/public-bait', { noAuth: true }),
          apiGet<ICompany[]>('/api/jobs/directory', { noAuth: true }),
        ]);
        setJobs(Array.isArray(jd) ? jd : []);
        if (Array.isArray(dd)) setCompanies(dd.slice(0, 8));
      } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  // Check subscription status for logged-in users
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    apiGet<any>('/api/auth/me')
      .then(profile => { if (profile.isSubscribed) setIsSubscribed(true); })
      .catch(() => {});
  }, [isAuthenticated, token]);


  const previewJobs = jobs.slice(0, 9);

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
        <div className="orb" style={{ width: 500, height: 500, top: -200, left: '50%', transform: 'translateX(-50%)', background: 'var(--primary-soft)' }} />
        <Container style={{ position: 'relative', zIndex: 1, paddingTop: 96, paddingBottom: 80, textAlign: 'center' }}>
          <h1 className="anim-up" style={{ animationDelay: '0.07s', fontSize: 'clamp(2.4rem,6.5vw,4.5rem)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 24 }}>
            {CONTENT.home.hero.heading}<br /><span className="font-sketch" style={{ color: 'var(--primary)', fontSize: '1.1em' }}>{CONTENT.home.hero.headingAccent}</span>
          </h1>
          {/* Hero subtitle split into two lines with visual separation */}
          <div className="anim-up" style={{ animationDelay: '0.14s', margin: '0 auto 32px', maxWidth: 600, textAlign: 'center' }}>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: 10 }}>
              {CONTENT.home.hero.subtitleLine1}
            </div>
            <div style={{ width: 40, height: 1.5, background: 'rgba(31,111,235,0.3)', borderRadius: 2, margin: '14px auto' }} />
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic', opacity: 0.7 }}>
              {CONTENT.home.hero.subtitleLine2}
            </div>
          </div>
          <div className="anim-up hero-cta-group" style={{ animationDelay: '0.2s', display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/jobs"><Button size="lg">Browse Jobs <ArrowRight size={15} /></Button></Link>
            {!isSubscribed && (
              <Link to="/signup"><Button variant="ghost" size="lg">{CONTENT.home.hero.secondaryCta}</Button></Link>
            )}
          </div>
        </Container>
        <div className="ticker-wrap" style={{ position: 'relative', overflow: 'hidden', borderTop: '1.25px solid var(--border)', borderBottom: '1.25px solid var(--border)', padding: '13px 0', background: 'var(--surface-solid)', zIndex: 1 }}>
          <div className="ticker-track" style={{ display: 'inline-flex', whiteSpace: 'nowrap' }}>
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 28, paddingRight: 40 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--subtle-ink)', letterSpacing: '0.02em' }}>{t}</span>
                <span style={{ color: 'var(--primary)', fontSize: '0.55rem' }}>✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── LATEST JOBS — 9 newest, straight below the hero ──────────── */}
      <section style={{ padding: '72px 0', background: 'var(--surface-solid)', borderBottom: '1.25px solid var(--border)' }}>
        <Container size="lg">
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 24 }}>
            {CONTENT.home.latest.heading}
          </h2>
          {loading ? (
            <div style={JOB_GRID}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                <div key={i} className="skeleton" style={{ height: 118, borderRadius: 12 }} />
              ))}
            </div>
          ) : (
            <div className="stagger" style={JOB_GRID}>
              {previewJobs.map(job => <HomeJobCard key={job._id} job={job} />)}
            </div>
          )}
          <div style={{ marginTop: 28, textAlign: 'center' }}>
            <Link
              to="/jobs"
              style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
              onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
            >
              Browse all jobs <ArrowRight size={13} />
            </Link>
          </div>
        </Container>
      </section>

      {/* ── HOW WE FIND ENGLISH-SPEAKING JOBS — EDITORIAL NUMBERED ROWS ──────────────── */}
      <section style={{ padding: '80px 0', background: 'var(--paper)' }}>
        <Container>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.3rem,2.5vw,1.8rem)', fontWeight: 700, textAlign: 'center', color: 'var(--text-primary)', marginBottom: 10 }}>{CONTENT.home.whySection.heading}</h2>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: 480, margin: '0 auto 40px' }}>{CONTENT.home.whySection.subtitle}</div>
          <div style={{ maxWidth: 680, margin: '0 auto', borderTop: '1px solid var(--border)' }}>
            {CONTENT.home.why.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 32, padding: '28px 0', borderBottom: '1px solid var(--border)' }}>
                {/* Number */}
                <div style={{ width: 80, flexShrink: 0, fontFamily: 'Playfair Display,serif', fontWeight: 700, fontSize: 'clamp(2rem,4vw,3rem)', color: 'rgba(59,130,246,0.15)', lineHeight: 1, textAlign: 'left' }}>{`0${i + 1}`}</div>
                {/* Title + Description */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{step.title}</div>
                  <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── COMPANIES ────────────────────────────────── */}
      <section style={{ padding: '80px 0 64px', background: 'var(--surface-solid)', borderTop: '1.25px solid var(--border)' }}>
        <Container>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36, flexWrap: 'wrap', gap: 14 }}>
            <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--ink)' }}>
              {CONTENT.home.companies.heading} <span style={{ color: 'var(--primary)' }}>{CONTENT.home.companies.headingAccent}</span>
            </h2>
            <Link to="/directory"><Button variant="ghost">{CONTENT.home.companies.fullDirectoryCta} <ArrowRight size={13} /></Button></Link>
          </div>
        </Container>

        {/* Auto-scrolling ticker — bleeds full section width */}
        <div className="company-ticker-wrap">
          <div className="company-ticker-track">
            {[...companies, ...companies].map((c, i) => (
              <div key={`${c.companyName}-${i}`} style={{ width: 260, flexShrink: 0 }}>
                <CompanyCard company={c} hideLocation />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEO INTERNAL LINKS ───────────────────────────────
          Next.js <Link> — /city/* and /category/* are first-class App Router
          pages now, so these navigate instantly (no full page reload). */}
      <section style={{ padding: '56px 0 64px', background: 'var(--paper)', borderTop: '1.25px solid var(--border)' }}>
        <Container>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
              Jobs by City
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SEO_CITIES.map(([slug, label]) => (
                <Link key={slug} to={`/city/${slug}`} style={SEO_LINK}>
                  English jobs in {label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
              Jobs by Category
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORY_ORDER.map(cat => (
                <Link key={cat} to={`/category/${cat}`} style={SEO_LINK}>
                  {CATEGORY_LABELS[cat]}
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}