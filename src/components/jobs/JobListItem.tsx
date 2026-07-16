'use client';

/**
 * Single card in the Dashboard's job list.
 * Memoized — re-renders only when the job, selection state, or callback change.
 */
import { forwardRef, memo } from 'react';
import type { IJob } from '../../types';
import { Badge } from '../ui';
import SaveJobButton from '../SaveJobButton';
import { compactSalary, getDisplayLocation, normalizeWorkplace } from '../../utils/job';
import { relativeDate } from '../../utils/date';

interface DesktopProps {
  job: IJob;
  selected: boolean;
  applied?: boolean;
  onClick: () => void;
}

export const DesktopJobCard = memo(
  forwardRef<HTMLButtonElement, DesktopProps>(function DesktopJobCard({ job, selected, applied, onClick }, ref) {
    const salary = compactSalary(job);
    const wp = normalizeWorkplace(job.WorkplaceType);
    const showWp = wp === 'Remote' || wp === 'Hybrid';

    // The bookmark sits OUTSIDE the card button — a button inside a button is
    // invalid HTML and swallows the inner click.
    return (
      <div style={{ position: 'relative' }}>
        <button
          ref={ref}
          onClick={onClick}
          style={{
            border:     selected ? '1px solid var(--acid)' : '1px solid var(--border)',
            background: selected ? 'var(--acid-soft)' : 'var(--bg-surface-2)',
            borderRadius: 8, padding: '10px 10px',
            textAlign: 'left', cursor: 'pointer', width: '100%',
          }}
        >
          <p style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, whiteSpace: 'normal', wordBreak: 'break-word', paddingRight: 22 }}>
            {job.JobTitle}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {job.Company} | {getDisplayLocation(job)}
          </p>
          {(showWp || salary || applied) && (
            <div className="flex flex-wrap gap-1.5" style={{ marginTop: 6 }}>
              {applied && <Badge variant="green" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>✓ Applied</Badge>}
              {showWp && <Badge variant="blue"  style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{wp}</Badge>}
              {salary && <Badge variant="green" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>{salary}</Badge>}
            </div>
          )}
        </button>
        <SaveJobButton jobId={job._id} size={14} style={{ position: 'absolute', top: 6, right: 6 }} />
      </div>
    );
  })
);

interface MobileProps {
  job: IJob;
  applied?: boolean;
  onClick: () => void;
}

export const MobileJobCard = memo(function MobileJobCard({ job, applied, onClick }: MobileProps) {
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onClick}
        style={{
          border: '1px solid var(--border)', borderRadius: 10,
          background: 'var(--bg-surface)', padding: '14px 12px',
          textAlign: 'left', width: '100%',
        }}
      >
        <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700, lineHeight: 1.3, paddingRight: 26 }}>{job.JobTitle}</p>
        <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: 4 }}>{job.Company} · {getDisplayLocation(job)}</p>
        <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: 3 }}>{relativeDate(job.PostedDate || job.scrapedAt)}</p>
        {applied && <Badge variant="green" style={{ fontSize: '0.65rem', padding: '1px 6px', marginTop: 6 }}>✓ Applied</Badge>}
      </button>
      <SaveJobButton jobId={job._id} style={{ position: 'absolute', top: 10, right: 8 }} />
    </div>
  );
});