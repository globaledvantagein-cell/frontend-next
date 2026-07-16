'use client';

import { Link } from '@/compat/router';
import { Linkedin, Twitter, MessageCircle } from 'lucide-react';

const linkStyle: React.CSSProperties = {
  fontSize: '0.76rem', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.18s',
};
const sep: React.CSSProperties = { color: 'var(--border-strong)', fontSize: '0.7rem', userSelect: 'none' };

// Placeholder URLs — replace with the real handles.
const SOCIALS: ReadonlyArray<{ label: string; href: string; Icon: typeof Linkedin }> = [
  { label: 'LinkedIn', href: 'https://linkedin.com/company/english-jobs-germany', Icon: Linkedin },
  { label: 'X',        href: 'https://x.com/englishjobsde',                        Icon: Twitter },
  { label: 'WhatsApp', href: 'https://whatsapp.com/channel/englishjobsgermany',    Icon: MessageCircle },
];

// Only transform + color transition — never `all`. Icons are a low-frequency
// hover target, so a small lift is fine; gated behind a fine pointer so touch
// devices don't fire it on tap.
const socialStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  display: 'inline-flex',
  padding: 4,
  borderRadius: 6,
  transition: 'color 160ms cubic-bezier(0.23, 1, 0.32, 1)',
};

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', marginTop: 'auto', padding: '10px 24px' }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
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
              style={socialStyle}
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
    </footer>
  );
}