'use client';

import { Link } from '@/compat/router';
import { Linkedin, Twitter, MessageCircle } from 'lucide-react';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '../utils/categorize';

const linkStyle: React.CSSProperties = {
  fontSize: '0.76rem', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.18s',
};
const sep: React.CSSProperties = { color: 'var(--border-strong)', fontSize: '0.7rem', userSelect: 'none' };

const SOCIALS: ReadonlyArray<{ label: string; href: string; Icon: typeof Linkedin }> = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/english-jobs-in-germany', Icon: Linkedin },
  { label: 'X',        href: 'https://x.com/EngJobsgermany',                              Icon: Twitter },
  { label: 'WhatsApp', href: 'https://whatsapp.com/channel/0029VbCqyMl8vd1RyrdNQw11',    Icon: MessageCircle },
];

// ── SEO link-hub columns ─────────────────────────────────────────────────────
const JOB_SEEKER_LINKS: ReadonlyArray<readonly [string, string]> = [
  ['/jobs', 'Browse Jobs'],
  ['/directory', 'Companies'],
  ['/career-guide', 'Career Guide'],
  ['/today-matches', "Today's Matches"],
  ['/smart-match', 'Smart Match'],
];

// Top 6 cities (slugs match CANONICAL_CITIES / the /city/[city] route).
const POPULAR_CITIES: ReadonlyArray<readonly [string, string]> = [
  ['berlin', 'Berlin'],
  ['munich', 'Munich'],
  ['hamburg', 'Hamburg'],
  ['frankfurt', 'Frankfurt'],
  ['stuttgart', 'Stuttgart'],
  ['cologne', 'Cologne'],
];

const columnTitle: React.CSSProperties = {
  fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
  color: 'var(--text-secondary)', marginBottom: 12,
};
const columnLink: React.CSSProperties = {
  fontSize: '0.82rem', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.16s',
};

function FooterColumn({ title, links }: { title: string; links: ReadonlyArray<readonly [string, string]> }) {
  return (
    <div>
      <p style={columnTitle}>{title}</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {links.map(([href, label]) => (
          <li key={href}>
            <Link
              to={href}
              style={columnLink}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const categoryLinks: ReadonlyArray<readonly [string, string]> = CATEGORY_ORDER.map(
    (cat) => [`/category/${cat}`, CATEGORY_LABELS[cat]] as const,
  );

  return (
    <footer style={{ borderTop: '1px solid var(--border)', marginTop: 'auto', padding: '32px 24px 12px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Link hub — three responsive columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '24px 32px',
          marginBottom: 28,
        }}>
          <FooterColumn title="For Job Seekers" links={JOB_SEEKER_LINKS} />
          <FooterColumn title="Popular Cities" links={POPULAR_CITIES.map(([slug, label]) => [`/city/${slug}`, label] as const)} />
          <FooterColumn title="Job Categories" links={categoryLinks} />
        </div>

        {/* Legal + socials */}
        <div style={{
          borderTop: '1px solid var(--border)', paddingTop: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '6px 16px',
        }}>
          <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', opacity: 0.7 }}>
            © 2026 English Jobs in Germany
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                style={{ color: 'var(--text-muted)', display: 'inline-flex', padding: 4, borderRadius: 6, transition: 'color 160ms cubic-bezier(0.23, 1, 0.32, 1)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <Icon size={15} />
              </a>
            ))}
            <span style={sep}>·</span>
            <Link to="/legal?tab=privacy" style={linkStyle}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >Privacy</Link>
            <span style={sep}>·</span>
            <Link to="/legal?tab=terms" style={linkStyle}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >Terms</Link>
            <span style={sep}>·</span>
            <a href="mailto:support@englishjobsgermany.com" style={linkStyle}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
