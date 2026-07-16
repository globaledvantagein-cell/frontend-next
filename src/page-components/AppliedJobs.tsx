'use client';

/**
 * Applied Jobs page — shows all jobs the user confirmed applying to,
 * including expired ones (with a status tag). Sorted by most recently applied.
 */
import { useEffect, useState } from 'react';
import { Link } from '@/compat/router';
import { ExternalLink, Briefcase, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../utils/jobApi';
import { Container, Badge, Button } from '../components/ui';
import { BRAND } from '../theme/brand';

interface AppliedJob {
  jobId: string;
  appliedAt: string;
  isActive: boolean;
  job: {
    JobTitle: string;
    Company: string;
    Location: string;
    ApplicationURL: string;
    IsRemote: boolean;
    Category: string;
    Domain: string;
    ExperienceLevel: string;
    PostedDate: string | null;
  };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AppliedJobs() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<AppliedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = `Applied Jobs · ${BRAND.appName}`;
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    setLoading(true);
    apiGet<{ success: boolean; jobs: AppliedJob[] }>('/api/jobs/applied')
      .then(data => setJobs(data.jobs || []))
      .catch(err => setError(err.message || 'Failed to load applied jobs'))
      .finally(() => setLoading(false));
  }, [isAuthenticated, authLoading]);

  if (authLoading) return null;

  if (!isAuthenticated) {
    return (
      <div style={{ background: 'var(--bg-base)', minHeight: '80vh' }}>
        <Container style={{ maxWidth: 600, padding: '60px 24px', textAlign: 'center' }}>
          <Briefcase size={40} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: 10 }}>
            Your Applied Jobs
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: '0.9rem' }}>
            Sign in to track the jobs you've applied to.
          </p>
          <Link to="/login"><Button size="sm">Sign in</Button></Link>
        </Container>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '80vh' }}>
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '24px 0' }}>
        <Container style={{ maxWidth: 800 }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.3rem,3vw,1.7rem)', color: 'var(--text-primary)', textAlign: 'center' }}>
            Applied Jobs
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', textAlign: 'center', marginTop: 6 }}>
            {loading ? 'Loading…' : `${jobs.length} application${jobs.length !== 1 ? 's' : ''}`}
          </p>
        </Container>
      </div>

      <Container style={{ maxWidth: 800, padding: '20px 24px 48px' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 10 }} />)}
          </div>
        )}

        {error && (
          <div style={{ padding: 20, background: 'var(--danger-soft)', borderRadius: 10, color: 'var(--danger)', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Briefcase size={36} style={{ color: 'var(--text-muted)', marginBottom: 14 }} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
              No applications yet
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: 20, maxWidth: 340, margin: '0 auto 20px' }}>
              When you apply to jobs and confirm your application, they'll appear here.
            </p>
            <Link to="/jobs"><Button size="sm">Browse jobs</Button></Link>
          </div>
        )}

        {!loading && !error && jobs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {jobs.map(entry => (
              <AppliedJobCard key={entry.jobId} entry={entry} />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}

function AppliedJobCard({ entry }: { entry: AppliedJob }) {
  const { job, isActive, appliedAt, jobId } = entry;

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 10,
      background: 'var(--bg-surface-2)', padding: '14px 16px',
      opacity: isActive ? 1 : 0.7,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link
            to={isActive ? `/jobs/${jobId}` : '#'}
            style={{
              fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)',
              textDecoration: 'none', lineHeight: 1.35,
              ...(isActive ? {} : { pointerEvents: 'none' as const }),
            }}
          >
            {job.JobTitle}
          </Link>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 3 }}>
            {job.Company} · {job.Location}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <Badge variant={isActive ? 'green' : 'neutral'} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
              {isActive ? 'Active' : 'Expired'}
            </Badge>
            <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Clock size={10} /> Applied {formatDate(appliedAt)}
            </span>
          </div>
        </div>

        {isActive && job.ApplicationURL && (
          <a
            href={job.ApplicationURL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)',
              textDecoration: 'none', whiteSpace: 'nowrap', padding: '6px 10px',
              borderRadius: 6, border: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
            Visit <ExternalLink size={11} />
          </a>
        )}
      </div>
    </div>
  );
}