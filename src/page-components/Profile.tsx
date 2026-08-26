'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useNavigate } from '@/compat/router';
import { Bookmark, Check, Clock, SlidersHorizontal, User as UserIcon, LogOut, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSavedJobs } from '../context/SavedJobsContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { Button, Container, Badge, Alert } from '../components/ui';
import { UsageBar, PromoCodeForm } from '../components/UpgradeModal';
import { BRAND } from '../theme/brand';
import { apiGet, fetchSubscriptionHistory } from '../utils/jobApi';
import type { SubscriptionResponse } from '../types';
import { getCategoryLabel } from '../utils/categorize';
import IdentityCard from '../components/profile/IdentityCard';
import EmailPreferences from '../components/profile/EmailPreferences';
import JobPreferencesForm from '../components/profile/JobPreferencesForm';
import ParsedResumeProfile from '../components/profile/ParsedResumeProfile';
import type { ProfileData } from '../components/profile/profileTypes';

// 8px spacing rhythm. The active section's content stacks here; the child
// components bring their own compact cards.
const CONTENT_STACK: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 };

type TabId = 'profile' | 'preferences' | 'subscription' | 'saved' | 'history';
const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: 'profile',      label: 'Profile',             icon: <UserIcon size={15} /> },
  { id: 'preferences',  label: 'Preferences',         icon: <SlidersHorizontal size={15} /> },
  { id: 'subscription', label: 'Subscription',        icon: <Crown size={15} /> },
  { id: 'saved',        label: 'Saved Jobs',          icon: <Bookmark size={15} /> },
  { id: 'history',      label: 'Application History',  icon: <Clock size={15} /> },
];

/**
 * Sidebar / tab-bar navigation item. Active state is conveyed by background +
 * text weight; hover changes colour only. NO transform on hover — press
 * feedback (scale 0.97) comes from the global :active rule in index.css.
 */
function TabButton({
  tab, active, mobile, onClick,
}: { tab: { id: TabId; label: string; icon: ReactNode }; active: boolean; mobile: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: mobile ? '8px 12px' : '9px 10px',
        width: mobile ? 'auto' : '100%',
        flexShrink: 0,
        borderRadius: 8, border: 'none', cursor: 'pointer',
        fontFamily: 'inherit', fontSize: '0.85rem',
        fontWeight: active ? 700 : 600,
        textAlign: 'left', whiteSpace: 'nowrap',
        background: active ? 'var(--acid-soft)' : 'transparent',
        color: active ? 'var(--acid)' : 'var(--text-secondary)',
        transition: 'background-color 0.16s ease, color 0.16s ease',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--bg-surface-2)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
    >
      {tab.icon}
      {tab.label}
    </button>
  );
}

/**
 * Profile page — visible only when VITE_ENABLE_PROFILE=true.
 * Identity card + email preferences + a couple of "soon" placeholders.
 */
export default function Profile() {
  const { user, logout, isAdmin, token, isLoading: authLoading } = useAuth();
  const isMobile = !useMediaQuery('(min-width: 768px)');
  const [tab, setTab] = useState<TabId>('profile');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => { document.title = `Profile · ${BRAND.appName}`; }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setLoading(false);
      return;
    }
    apiGet<ProfileData>('/api/auth/me')
      .then(setProfile)
      .catch(err => {
        console.error('[Profile] /me fetch failed:', err);
        setLoadError('Could not load your latest preferences. Please refresh.');
      })
      .finally(() => setLoading(false));
  }, [token, authLoading]);

  if (authLoading || loading) {
    return (
      <Container style={{ padding: '40px 24px' }}>
        <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container style={{ padding: '40px 24px' }}>
        <Alert type="error">You are not signed in. Please log in to view your profile.</Alert>
      </Container>
    );
  }

  // Merge auth user (always available) with /me profile (richer fields).
  const display: ProfileData = {
    email: profile?.email || user.email,
    name: profile?.name || user.name,
    role: (profile?.role || user.role) as 'user' | 'admin',
    avatarUrl: profile?.avatarUrl ?? user.avatarUrl ?? null,
    createdAt: profile?.createdAt,
    acceptedTermsAt: profile?.acceptedTermsAt,
    isSubscribed: profile?.isSubscribed,
    desiredCategories: profile?.desiredCategories,
    lastEmailSent: profile?.lastEmailSent,
  };

  // Only the active section is mounted — progressive disclosure keeps the
  // cognitive load (and the DOM) to one section at a time. Keyed so a tab
  // switch re-triggers the opacity fade (fadeIn keyframe = opacity only, GPU),
  // preventing the content from teleporting.
  const activeContent = (
    <div key={tab} style={{ animation: 'fadeIn 0.16s ease-out' }}>
      {tab === 'profile' && (
        <div style={CONTENT_STACK}>
          <IdentityCard data={display} isAdmin={isAdmin} />
          <ParsedResumeProfile />
        </div>
      )}
      {tab === 'preferences' && (
        <div style={CONTENT_STACK}>
          {profile && <EmailPreferences profile={profile} loadError={loadError} onProfileUpdated={setProfile} />}
          <JobPreferencesForm />
        </div>
      )}
      {tab === 'subscription' && <SubscriptionSection />}
      {tab === 'saved' && <SavedJobsList />}
      {tab === 'history' && (
        <div style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Clock size={15} style={{ color: 'var(--text-muted)' }} />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Application history</h3>
            <Badge variant="neutral" style={{ fontSize: '0.62rem' }}>SOON</Badge>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>Track which roles you have applied to.</p>
        </div>
      )}
    </div>
  );

  // Identity mini — always visible for wayfinding (avatar + name + role).
  const identityMini = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      {display.avatarUrl ? (
        <img src={display.avatarUrl} alt="" referrerPolicy="no-referrer" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
          <UserIcon size={17} />
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{display.name}</span>
          {isAdmin && <Badge variant="red" style={{ fontSize: '0.55rem', padding: '1px 5px' }}>ADMIN</Badge>}
        </div>
        <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{display.email}</p>
      </div>
    </div>
  );

  const signOutLink = (
    <button
      onClick={logout}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600,
        fontFamily: 'inherit', padding: '8px 10px', textAlign: 'left',
        transition: 'color 0.16s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
    >
      <LogOut size={14} /> Sign out
    </button>
  );

  // ── Mobile: identity + sign-out header, horizontal tab bar, content below ──
  if (isMobile) {
    return (
      <div style={{ padding: '16px clamp(14px, 4vw, 20px) 40px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          {identityMini}
          {signOutLink}
        </div>
        <div
          className="thin-scroll"
          style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4, marginBottom: 16, borderBottom: '1px solid var(--border)' }}
        >
          {TABS.map(t => <TabButton key={t.id} tab={t} active={tab === t.id} mobile onClick={() => setTab(t.id)} />)}
        </div>
        {activeContent}
      </div>
    );
  }

  // ── Desktop: fixed left sidebar + full-width content panel ──
  return (
    <div style={{ maxWidth: 1500, margin: '0 auto', padding: '20px clamp(16px, 3vw, 32px) 48px', width: '100%', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <aside
        style={{
          width: 240, flexShrink: 0,
          position: 'sticky', top: 76,
          display: 'flex', flexDirection: 'column', gap: 6,
          maxHeight: 'calc(100vh - 92px)',
        }}
      >
        <div style={{ padding: '0 2px 12px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
          {identityMini}
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TABS.map(t => <TabButton key={t.id} tab={t} active={tab === t.id} mobile={false} onClick={() => setTab(t.id)} />)}
        </nav>
        <div style={{ flex: 1 }} />
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6 }}>
          {signOutLink}
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0 }}>
        {activeContent}
      </main>
    </div>
  );
}

// ── Saved jobs ───────────────────────────────────────────────────────────────
interface SavedEntry {
  jobId: string;
  savedAt: string | null;
  isActive: boolean;
  job: {
    JobTitle: string;
    Company: string;
    Location: string;
    Category?: string;
  };
}

function SavedJobsList() {
  const { savedVersion, toggleSave } = useSavedJobs();
  const [entries, setEntries] = useState<SavedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Refetch whenever a bookmark is toggled anywhere in the app.
  useEffect(() => {
    apiGet<{ jobs: SavedEntry[] }>('/api/jobs/saved')
      .then(data => setEntries(data?.jobs || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [savedVersion]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Bookmark size={15} style={{ color: 'var(--text-muted)' }} />
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Saved jobs</h3>
        {!loading && entries.length > 0 && <Badge variant="neutral">{entries.length}</Badge>}
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 70, borderRadius: 12 }} />
      ) : entries.length === 0 ? (
        <div style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border)', borderRadius: 12, padding: 18 }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            No saved jobs yet. Tap the bookmark icon on any role to keep it here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {entries.map(entry => (
            <div
              key={entry.jobId}
              style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10,
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: '12px 14px',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <Link
                  to={`/jobs/${entry.jobId}`}
                  style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none', wordBreak: 'break-word' }}
                >
                  {entry.job.JobTitle}
                </Link>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {entry.job.Company} · {entry.job.Location}
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {entry.job.Category && getCategoryLabel(entry.job.Category) && (
                    <Badge variant="blue" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                      {getCategoryLabel(entry.job.Category)}
                    </Badge>
                  )}
                  {!entry.isActive && (
                    <Badge variant="neutral" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>No longer listed</Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => void toggleSave(entry.jobId)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Subscription ─────────────────────────────────────────────────────────────
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Shown when there is no subscription record to load (the normal state for a
// free user) — an invitation, not an error. Premium users with a real fetch
// failure still get the error alert below.
//
// Visual language mirrors the /premium membership card (PremiumCheckout):
// navy gradient + gold hairline, fixed colors on purpose so it reads
// identically in both themes and profile → /premium feels like one moment.
function PremiumInviteCard() {
  const navigate = useNavigate();
  const gold = '#d4a94a';
  const cardMuted = '#8a94a6';
  const perks = [
    'Unlimited job description views',
    'Unlimited apply clicks',
    'Smart Match — AI resume scoring',
    "Today's Matches — daily personalized picks",
    'Advanced filters — salary, visa, relocation, experience, workplace',
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', marginTop: 24 }}>
      <div style={{
        background: 'linear-gradient(165deg, #131c29 0%, #0f1620 55%, #0c1219 100%)',
        border: '1px solid rgba(212, 169, 74, 0.28)',
        borderRadius: 14, padding: '14px 16px 12px', boxShadow: 'var(--shadow-md)',
        position: 'relative', overflow: 'hidden', width: '100%', maxWidth: 520,
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />

        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: gold,
        }}>
          <Crown size={13} /> Premium · Not active yet
        </span>

        <h3 style={{
          fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.2rem', fontWeight: 700,
          color: '#fff', margin: '8px 0 0', letterSpacing: '-0.01em', lineHeight: 1.2,
        }}>
          Your next role won&rsquo;t wait.
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: cardMuted, lineHeight: 1.45 }}>
          Unlock everything the free plan holds back — from your first search to your signed offer.
        </p>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '10px 0 8px' }} />

        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {perks.map(f => (
            <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.8rem', color: '#c7d0dd', lineHeight: 1.4 }}>
              <span style={{ color: gold, flexShrink: 0, marginTop: 1 }}><Check size={13} /></span>
              {f}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => navigate('/premium')}
          style={{
            marginTop: 12, width: '100%', height: 38,
            background: `linear-gradient(90deg, ${gold}, #e6c069)`, color: '#0f1620',
            border: 'none', borderRadius: 9, fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 800,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}
        >
          <Crown size={15} /> Unlock Premium
        </button>
        <p style={{ margin: '7px 0 0', fontSize: '0.7rem', color: cardMuted, textAlign: 'center', letterSpacing: '0.02em' }}>
          No auto-renewal · No credit card required
        </p>
      </div>

      <div style={{
        background: 'linear-gradient(165deg, #131c29 0%, #0f1620 55%, #0c1219 100%)',
        border: '1px solid rgba(212, 169, 74, 0.28)',
        borderRadius: 12, padding: '12px 14px', width: '100%', maxWidth: 520,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />
        <p style={{
          fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: gold, margin: '0 0 8px',
        }}>
          Have an invite code?
        </p>
        <PromoCodeForm variant="premium" />
      </div>
    </div>
  );
}

function SubscriptionSection() {
  const navigate = useNavigate();
  const { isPremium: authIsPremium } = useAuth();
  const [data, setData] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchSubscriptionHistory()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="skeleton" style={{ height: 180, borderRadius: 12 }} />;
  if (error || !data) {
    // A missing subscription record is the normal state for a free user —
    // sell the upgrade instead of showing an error. Only premium users
    // (who must have a record) see a real failure message.
    if (!authIsPremium) return <PremiumInviteCard />;
    return <Alert type="error">Could not load your subscription details. Please refresh.</Alert>;
  }

  const { isPremium, usage, history } = data;
  const expiresAt = usage.premiumExpiresAt;
  const expiringSoon = isPremium && expiresAt
    ? (new Date(expiresAt).getTime() - Date.now()) < 7 * DAY_MS
    : false;

  const cardStyle: CSSProperties = {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 14,
  };

  const statusColors: Record<string, { bg: string; fg: string }> = {
    active:    { bg: 'var(--success-soft)', fg: 'var(--success)' },
    expired:   { bg: 'var(--bg-surface-2)', fg: 'var(--text-muted)' },
    cancelled: { bg: 'var(--danger-soft)', fg: 'var(--danger)' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {isPremium ? (
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, background: 'var(--acid-soft)', color: 'var(--acid)' }}>
              <Crown size={18} />
            </span>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Premium</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                Active until {formatDate(expiresAt)}
              </p>
            </div>
            {expiringSoon && (
              <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 700, color: 'var(--warning)', background: 'var(--warning-soft)', padding: '3px 8px', borderRadius: 6 }}>
                Expiring soon
              </span>
            )}
          </div>
        </div>
      ) : (
        <div style={cardStyle}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Free plan</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
              Upgrade to Premium for unlimited views, applies, Smart Match, and advanced filters.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <UsageBar used={usage.jdViewsUsed} limit={usage.jdViewsLimit ?? 20} label="JD views this week" />
            <UsageBar used={usage.applyClicksUsed} limit={usage.applyClicksLimit ?? 15} label="Apply clicks this week" />
          </div>
          <button
            type="button"
            onClick={() => navigate('/premium')}
            style={{ height: 44, background: 'var(--acid)', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <Crown size={16} /> Upgrade to Premium
          </button>
          <PromoCodeForm />
        </div>
      )}

      {/* Purchase history */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Purchase history</h3>
        {history.length === 0 ? (
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>No purchases yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '6px 8px', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '6px 8px', fontWeight: 600 }}>Plan</th>
                  <th style={{ padding: '6px 8px', fontWeight: 600 }}>Amount</th>
                  <th style={{ padding: '6px 8px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '6px 8px', fontWeight: 600 }}>Promo</th>
                </tr>
              </thead>
              <tbody>
                {history.map((sub, i) => {
                  const sc = statusColors[sub.status] || statusColors.expired;
                  return (
                    <tr key={sub._id || i} style={{ borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      <td style={{ padding: '8px' }}>{formatDate(sub.createdAt)}</td>
                      <td style={{ padding: '8px' }}>{sub.plan}</td>
                      <td style={{ padding: '8px' }}>
                        {sub.currency === 'EUR' ? '€' : ''}{(sub.amount ?? 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, background: sc.bg, color: sc.fg, padding: '2px 8px', borderRadius: 6 }}>
                          {sub.status}
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>{sub.promoCode || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}