'use client';

import { useState, useEffect, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from '@/compat/router';
import { Check, Search, ShieldCheck, Sparkles, Globe, ArrowRight } from 'lucide-react';
import type { IJob, ICompany } from '../types';
import { useAuth } from '../context/AuthContext';
import HomeSeoCard from '../components/seo/HomeSeoCard';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '../utils/categorize';
import { careerCategoryLabel } from '../data/careerGuide';

// ── Static SEO data ──────────────────────────────────────────────────────────
// "Popular roles" chips: the taxonomy has only 6 job categories (none named
// Marketing/Design/Operations), so role chips that map to a category link to
// /category/[slug]; the rest link to /jobs?search= so none 404.
const POPULAR_ROLES: ReadonlyArray<readonly [string, string]> = [
  ['Software Engineer', '/category/software'],
  ['Product Manager', '/category/product_tech'],
  ['Data & AI', '/category/data'],
  ['Marketing', '/jobs?search=marketing'],
  ['Design', '/jobs?search=design'],
  ['Operations', '/jobs?search=operations'],
];

const TOP_CITIES: ReadonlyArray<readonly [string, string]> = [
  ['berlin', 'Berlin'], ['munich', 'Munich'], ['hamburg', 'Hamburg'],
  ['frankfurt', 'Frankfurt'], ['stuttgart', 'Stuttgart'], ['cologne', 'Cologne'],
];

const GRID_CITIES: ReadonlyArray<readonly [string, string]> = [
  ['berlin', 'Berlin'], ['munich', 'Munich'], ['hamburg', 'Hamburg'], ['frankfurt', 'Frankfurt'],
  ['stuttgart', 'Stuttgart'], ['cologne', 'Cologne'], ['dusseldorf', 'Düsseldorf'], ['leipzig', 'Leipzig'],
  ['dresden', 'Dresden'], ['hanover', 'Hanover'], ['nuremberg', 'Nuremberg'], ['bonn', 'Bonn'],
];

const DIFFERENTIATORS = [
  { Icon: ShieldCheck, title: 'No German Required', desc: 'Every listing verified — the job description is in English and German is not a requirement.' },
  { Icon: Sparkles, title: 'AI-Filtered & Human-Reviewed', desc: 'We scan 500+ company career pages daily. Every listing is verified by AI and reviewed by a human before it goes live.' },
  { Icon: Globe, title: 'Visa & Relocation Info', desc: 'We extract visa sponsorship and relocation support details from every job description, so you know before you apply.' },
];

// ── Layout constants ─────────────────────────────────────────────────────────
// Narrower 1100px measure feels more focused (Linear/Stripe); 64/40 section rhythm.
const PAGE: CSSProperties = {
  maxWidth: 1100, margin: '0 auto',
  paddingLeft: 'clamp(20px, 5vw, 32px)', paddingRight: 'clamp(20px, 5vw, 32px)',
};
const SECTION_PAD = 'clamp(40px, 6vw, 64px)';

const chipStyle: CSSProperties = {
  fontSize: '0.8rem', padding: '5px 14px', borderRadius: 20,
  border: '1px solid var(--border)', color: 'var(--text-primary)',
  background: 'transparent', textDecoration: 'none', whiteSpace: 'nowrap',
};
const viewAllLink: CSSProperties = {
  color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500,
  display: 'inline-flex', alignItems: 'center', gap: 5,
};
const gridLinkStyle: CSSProperties = {
  fontSize: '0.85rem', color: 'var(--text-secondary)', textDecoration: 'none',
  display: 'inline-block', lineHeight: 2,
};

// Section heading with a short brand-blue underline accent bar.
function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{children}</h2>
      <div style={{ width: 40, height: 3, background: 'var(--primary)', borderRadius: 2, marginTop: 8 }} />
    </div>
  );
}

// Soft, per-category pill colors for career-guide cards.
function careerPillColors(cat: string): { bg: string; fg: string } {
  switch (cat) {
    case 'visas-immigration':
    case 'finding-jobs':
      return { bg: 'var(--info-soft)', fg: 'var(--info)' };
    case 'salaries-careers':
    case 'students-graduates':
      return { bg: 'var(--success-soft)', fg: 'var(--success)' };
    case 'living-in-germany':
      return { bg: 'var(--warning-soft)', fg: 'var(--warning)' };
    default:
      return { bg: 'var(--acid-soft)', fg: 'var(--acid)' };
  }
}

function clearbitLogo(domain?: string): string | null {
  const s = (domain || '').trim();
  if (!s) return null;
  let host: string;
  try { host = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`).hostname; }
  catch { host = s.replace(/^https?:\/\//i, '').split('/')[0]; }
  return host ? `https://logo.clearbit.com/${host}?size=128` : null;
}

interface HomeArticle { title: string; slug: string; category: string; readingMinutes: number; }

interface HomeProps {
  initialJobs?: IJob[];
  initialCompanies?: ICompany[];
  companyCount?: number;
  articles?: HomeArticle[];
  totalJobCount?: number;
}

export default function Home({
  initialJobs = [], initialCompanies = [], companyCount = 0, articles = [], totalJobCount = 0,
}: HomeProps) {
  const { isAuthenticated, isPremium, usage } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  const authed = hydrated && isAuthenticated;
  const premium = hydrated && isPremium;

  const jobs = initialJobs.slice(0, 9);
  const companies = initialCompanies.slice(0, 12);

  const roundedJobs = totalJobCount ? Math.floor(totalJobCount / 100) * 100 : 2600;
  const jobsPlus = `${roundedJobs.toLocaleString()}+`;
  const roundedCompanies = companyCount ? Math.floor(companyCount / 50) * 50 : 300;
  const companiesPlus = `${roundedCompanies.toLocaleString()}+`;

  const jobsHeading = premium ? 'Your matches' : authed ? 'Recommended for you' : 'Latest English-speaking jobs';

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/jobs?search=${encodeURIComponent(q)}` : '/jobs');
  };

  return (
    <div>
      {/* ── SECTION 1: HERO ──────────────────────────────────────────────── */}
      <section className="home-hero" style={{ borderBottom: '1px solid var(--border)' }}>
        <div style={{ ...PAGE, padding: 'clamp(48px, 7vw, 100px) clamp(20px, 5vw, 32px) 44px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'inherit', margin: 0, lineHeight: 1.12, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--primary)', fontSize: 'clamp(2.2rem, 5.5vw, 3.5rem)', fontWeight: 800 }}>English Speaking</span>{' '}
            <span style={{ fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)', fontWeight: 700 }}>Jobs in Germany</span>
          </h1>

          <p style={{ fontSize: '1.05rem', fontWeight: 400, color: 'var(--text-secondary)', margin: '16px auto 0', maxWidth: 640 }}>
            {jobsPlus} verified roles where German is not required
          </p>

          <form onSubmit={onSearch} className="home-search" style={{ display: 'flex', maxWidth: 560, margin: '26px auto 0' }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Job title, skill, or company..."
              aria-label="Search jobs"
              style={{
                flex: 1, minWidth: 0, height: 50, paddingLeft: 16, paddingRight: 12, fontSize: '1rem',
                fontFamily: 'inherit', color: 'var(--text-primary)', background: 'var(--bg-surface-2)',
                border: '1.5px solid var(--border)', borderRight: 'none',
                borderRadius: '14px 0 0 14px', outline: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--acid)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--acid-soft)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            <button
              type="submit"
              style={{
                height: 50, padding: '0 24px', flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'var(--acid)', color: '#fff', border: 'none',
                borderRadius: '0 14px 14px 0', fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
                transition: 'filter 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.93)'; }}
              onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
            >
              <Search size={18} /> Find jobs
            </button>
          </form>

          {/* Trust badges — separated by a thin top rule aligned to the search bar. */}
          <div style={{ maxWidth: 560, margin: '20px auto 0', paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}>
            {['AI-verified', 'Human-reviewed', 'Updated daily'].map(t => (
              <span key={t} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: '0.78rem', color: 'var(--text-secondary)',
                background: 'var(--bg-surface-2)', borderRadius: 20, padding: '4px 12px',
              }}>
                <Check size={12} style={{ color: 'var(--acid)' }} /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 2: DISCOVERY CHIPS ───────────────────────────────────── */}
      <div style={{ ...PAGE, paddingTop: 24, paddingBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Popular roles:</span>
          {POPULAR_ROLES.map(([label, href]) => (
            <Link key={label} to={href} className="discovery-chip" style={chipStyle}>{label}</Link>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Top cities:</span>
          {TOP_CITIES.map(([slug, label]) => (
            <Link key={slug} to={`/city/${slug}`} className="discovery-chip" style={chipStyle}>{label}</Link>
          ))}
        </div>
      </div>

      {/* ── SECTION 3: LATEST JOBS (server-rendered, crawlable) ──────────── */}
      <div style={{ ...PAGE, paddingTop: 8, paddingBottom: SECTION_PAD }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <SectionHeading>{jobsHeading}</SectionHeading>
          {authed && !premium && usage && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {usage.jdViewsUsed}/{usage.jdViewsLimit ?? 20} JD views this week
            </span>
          )}
        </div>

        {/* Smart Match — a gentle inline notification, not a banner (Issue 9). */}
        {premium && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--acid-soft)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
            <Sparkles size={14} style={{ color: 'var(--acid)', flexShrink: 0 }} />
            Smart Match scored {jobsPlus} jobs to your profile
            <Link to="/today-matches" style={{ ...viewAllLink, fontSize: '0.82rem', marginLeft: 6 }} className="home-viewall">
              View <ArrowRight size={12} className="home-viewall__arrow" />
            </Link>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {jobs.map(job => <HomeSeoCard key={job._id} job={job} />)}
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link to="/jobs" className="home-viewall" style={viewAllLink}>
            View all {jobsPlus} jobs <ArrowRight size={13} className="home-viewall__arrow" />
          </Link>
        </div>
      </div>

      {/* ── SECTION 4: WHAT MAKES US DIFFERENT (full-width tinted band) ──── */}
      <section style={{ background: 'var(--bg-surface-2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ ...PAGE, paddingTop: SECTION_PAD, paddingBottom: SECTION_PAD }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {DIFFERENTIATORS.map(({ Icon, title, desc }) => (
              <div key={title} className="home-elev" style={{ position: 'relative', background: 'var(--bg-surface)', borderRadius: 10, padding: '24px 24px 24px 20px' }}>
                <span style={{ position: 'absolute', left: 0, top: 24, width: 3, height: 40, background: 'var(--acid)', borderRadius: '0 3px 3px 0' }} />
                <span style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--acid-soft)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={22} style={{ color: 'var(--acid)' }} />
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', margin: '14px 0 6px' }}>{title}</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5: COMPANIES HIRING (logo/avatar grid) ──────────────── */}
      {companies.length > 0 && (
        <div style={{ ...PAGE, paddingTop: SECTION_PAD, paddingBottom: SECTION_PAD }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <SectionHeading>Companies hiring</SectionHeading>
            <Link to="/directory" className="home-viewall" style={viewAllLink}>
              See all {companiesPlus} companies <ArrowRight size={13} className="home-viewall__arrow" />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12 }}>
            {companies.map((c, i) => {
              const logo = clearbitLogo(c.domain);
              return (
                <Link
                  key={`${c.companyName}-${i}`}
                  to="/directory"
                  aria-label={c.companyName}
                  className="home-company"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '10px 6px', textDecoration: 'none' }}
                >
                  <span className="home-company__avatar" style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'var(--bg-surface-2)', border: '1.5px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                  }}>
                    {logo ? (
                      <img
                        src={logo}
                        alt={c.companyName}
                        style={{ width: 36, height: 36, objectFit: 'contain' }}
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {c.companyName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                    {c.companyName}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SECTION 6: CAREER GUIDE PREVIEW ─────────────────────────────── */}
      {articles.length > 0 && (
        <section style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
          <div style={{ ...PAGE, paddingTop: SECTION_PAD, paddingBottom: SECTION_PAD }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <SectionHeading>Career Guide</SectionHeading>
              <Link to="/career-guide" className="home-viewall" style={viewAllLink}>
                View all articles <ArrowRight size={13} className="home-viewall__arrow" />
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {articles.map(a => {
                const pill = careerPillColors(a.category);
                return (
                  <Link
                    key={a.slug}
                    to={`/career-guide/${a.category}/${a.slug}`}
                    className="home-elev"
                    style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--bg-surface-2)', borderRadius: 12, padding: 18, textDecoration: 'none', overflow: 'hidden' }}
                  >
                    <span style={{
                      alignSelf: 'flex-start', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                      color: pill.fg, background: pill.bg, padding: '3px 10px', borderRadius: 4,
                    }}>
                      {careerCategoryLabel(a.category)}
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{a.title}</span>
                    <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 'auto' }}>{a.readingMinutes} min read</span>
                    <span style={{ ...viewAllLink, fontSize: '0.82rem' }}>Read <ArrowRight size={12} /></span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 7: CITY & CATEGORY LINK GRID (internal-linking hub) ──── */}
      <section style={{ background: 'var(--bg-base)', borderTop: '1px solid var(--border)' }}>
        <div style={{ ...PAGE, paddingTop: SECTION_PAD, paddingBottom: SECTION_PAD }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '28px 40px' }}>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>Browse by City</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0 16px' }}>
                {GRID_CITIES.map(([slug, label]) => (
                  <Link key={slug} to={`/city/${slug}`} className="home-grid-link" style={gridLinkStyle}>{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>Browse by Category</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0 16px' }}>
                {CATEGORY_ORDER.map(cat => (
                  <Link key={cat} to={`/category/${cat}`} className="home-grid-link" style={gridLinkStyle}>{CATEGORY_LABELS[cat]}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
