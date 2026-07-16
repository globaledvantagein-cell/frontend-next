'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from '@/compat/router';
import { Bookmark, Clock, SlidersHorizontal, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSavedJobs } from '../context/SavedJobsContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { Button, Container, Badge, Alert } from '../components/ui';
import { BRAND } from '../theme/brand';
import { apiGet } from '../utils/jobApi';
import { CATEGORY_LABELS, type Category } from '../utils/categorize';
import IdentityCard from '../components/profile/IdentityCard';
import EmailPreferences from '../components/profile/EmailPreferences';
import JobPreferencesForm from '../components/profile/JobPreferencesForm';
import ParsedResumeProfile from '../components/profile/ParsedResumeProfile';
import type { ProfileData } from '../components/profile/profileTypes';

// 8px spacing rhythm. The active section's content stacks here; the child
// components bring their own compact cards.
const CONTENT_STACK: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 };

type TabId = 'profile' | 'preferences' | 'saved' | 'history';
const TABS: { id: TabId; label: string; icon: ReactNode }[] = [
  { id: 'profile',     label: 'Profile',             icon: <UserIcon size={15} /> },
  { id: 'preferences', label: 'Preferences',         icon: <SlidersHorizontal size={15} /> },
  { id: 'saved',       label: 'Saved Jobs',          icon: <Bookmark size={15} /> },
  { id: 'history',     label: 'Application History',  icon: <Clock size={15} /> },
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
                  {entry.job.Category && CATEGORY_LABELS[entry.job.Category as Category] && (
                    <Badge variant="blue" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                      {CATEGORY_LABELS[entry.job.Category as Category]}
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