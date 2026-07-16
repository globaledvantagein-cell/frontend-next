'use client';

/**
 * Standalone single-job page — the target URL when someone shares a job.
 *
 * Route:  /jobs/:id
 * URL:    https://englishjobsgermany.com/jobs/6835a3f1c7…
 *
 * Uses fetchJobDetailCached so repeated opens (friend clicks 10 links)
 * only hit the network once per job. Auth status is checked locally from
 * localStorage — no extra server round-trip to determine if the user is
 * signed in.
 *
 * Gate behaviour is identical to the Dashboard split-view: anonymous users
 * who have exceeded FREE_VIEW_LIMIT see a teaser + SignupGate.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from '@/compat/router';
import { ArrowLeft, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchJobDetailCached } from '../utils/jobApi';
import PublicJobDetail from '../components/PublicJobDetail';
import JobDetailSkeleton from '../components/JobDetailSkeleton';
import SignupGate from '../components/SignupGate';
import { Container } from '../components/ui';
import { BRAND } from '../theme/brand';
import type { IJob } from '../types';

export default function JobSharePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [job, setJob] = useState<IJob | null>(null);
  const [gated, setGated] = useState(false);
  const [teaser, setTeaser] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forceGate, setForceGate] = useState(false);

  // ── Fetch job (waits for auth init so we use the right cache lane) ────
  const fetchJob = useCallback(async () => {
    if (!id || authLoading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchJobDetailCached(id, isAuthenticated);
      if (res.gated) {
        setGated(true);
        setTeaser(res.teaser);
        setJob(null);
      } else {
        setGated(false);
        setTeaser(null);
        const fullJob = res.job as IJob;
        setJob(fullJob);
        document.title = `${fullJob.JobTitle} at ${fullJob.Company} · ${BRAND.appName}`;
      }
    } catch (err: any) {
      setError(err.message || 'This job could not be found.');
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated, authLoading]);

  useEffect(() => {
    document.title = BRAND.appName;
    fetchJob();
  }, [fetchJob]);

  // Reset force-gate when the ID changes (user navigates between shared links)
  useEffect(() => { setForceGate(false); }, [id]);

  const handleApplyTracked = useCallback((_jobId: string, applyClicks: number) => {
    setJob(prev => (prev ? { ...prev, applyClicks } : prev));
  }, []);

  // ── Render states ──────────────────────────────────────────────────────

  const renderContent = () => {
    // 1. Still loading
    if (loading || authLoading) {
      return <JobDetailSkeleton />;
    }

    // 2. Error / not found
    if (error) {
      return (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'var(--bg-surface)',
          border: '1px dashed var(--border)',
          borderRadius: 14,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 12,
            background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px', color: 'var(--text-muted)',
          }}>
            <Briefcase size={22} />
          </div>
          <h2 style={{
            fontSize: '1.3rem', fontWeight: 700,
            color: 'var(--text-primary)', marginBottom: 8,
          }}>
            Job not found
          </h2>
          <p style={{
            color: 'var(--text-muted)', fontSize: '0.9rem',
            lineHeight: 1.55, marginBottom: 22, maxWidth: 360, margin: '0 auto 22px',
          }}>
            This job may have been removed or the link may be incorrect.
          </p>
          <Link
            to="/jobs"
            style={{
              color: 'var(--primary)', fontWeight: 600,
              textDecoration: 'none', fontSize: '0.9rem',
            }}
          >
            ← Browse all jobs
          </Link>
        </div>
      );
    }

    // 3. Gated (anonymous user over view limit, or Apply clicked without auth)
    if (forceGate || gated) {
      return (
        <SignupGate
          teaser={
            (teaser as any) ||
            (job ? { JobTitle: job.JobTitle, Company: job.Company, Location: job.Location } : undefined)
          }
          onAuthSuccess={() => {
            setForceGate(false);
            setGated(false);
            fetchJob();
          }}
        />
      );
    }

    // 4. Full job detail
    if (job) {
      return (
        <PublicJobDetail
          job={job}
          onApplyTracked={handleApplyTracked}
          onAuthRequired={() => setForceGate(true)}
        />
      );
    }

    return null;
  };

  // If the user arrived here from within the app (e.g. clicked a title on
  // /jobs), window.history.length > 1. navigate(-1) restores the previous
  // page WITH its scroll position and React state intact.
  // If they landed directly (shared link, new tab), fall back to /jobs.
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/jobs');
    }
  };

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '80vh' }}>
      <Container style={{ maxWidth: 1000, padding: '24px 24px 48px' }}>
        {/* Back link — uses browser back to preserve scroll position */}
        <button
          onClick={handleBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: '0.86rem', fontWeight: 600,
            color: 'var(--text-muted)', textDecoration: 'none',
            marginBottom: 20, transition: 'color 0.18s',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 0, fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <ArrowLeft size={15} /> Back to all jobs
        </button>

        {renderContent()}
      </Container>
    </div>
  );
}