'use client';

/**
 * Job cards for the REMOTE list. Sibling of JobListItem.tsx.
 *
 * Differences from the German cards:
 *   - a country badge (flag + 2-letter code) sits next to the location
 *   - the workplace badge is always "Remote" — every job in this collection is
 *   - no visa / relocation badges (irrelevant for remote work)
 *   - no save button (saved jobs are keyed to the German jobs collection)
 */
import { forwardRef, memo } from 'react';
import type { IJob } from '../../types';
import { Badge } from '../ui';
import CompanyLogo from '../CompanyLogo';
import { compactSalary } from '../../utils/job';
import { getCountryLabel, getRemoteDisplayLocation } from '../../utils/remoteJob';
import { relativeDate } from '../../utils/date';

/** Country name badge, e.g. "United States". Renders nothing without a Country. */
export function CountryBadge({ country, compact = false }: { country?: string | null; compact?: boolean }) {
  const label = getCountryLabel(country);
  if (!label) return null;
  return (
    <Badge
      variant="neutral"
      style={{ fontSize: compact ? '0.65rem' : '0.72rem', padding: compact ? '1px 6px' : '2px 8px' }}
    >
      {label}
    </Badge>
  );
}

interface DesktopProps {
  job: IJob;
  selected: boolean;
  onClick: () => void;
}

export const RemoteDesktopJobCard = memo(
  forwardRef<HTMLButtonElement, DesktopProps>(function RemoteDesktopJobCard({ job, selected, onClick }, ref) {
    const salary = compactSalary(job);

    return (
      <button
        ref={ref}
        onClick={onClick}
        style={{
          // Border-only separation: an unselected card carries no fill, so
          // the list reads as one surface with the page behind it.
          border:     selected ? '1px solid var(--acid)' : '1px solid var(--border)',
          background: selected ? 'var(--acid-soft)' : 'transparent',
          borderRadius: 8, padding: '12px 14px',
          textAlign: 'left', cursor: 'pointer', width: '100%',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}
      >
        <CompanyLogo companyName={job.Company} domain={job.companyDomain ?? undefined} size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {job.JobTitle}
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {job.Company} · {getRemoteDisplayLocation(job)} · {relativeDate(job.PostedDate || job.scrapedAt)}
        </p>
        <div className="flex flex-wrap gap-1.5" style={{ marginTop: 6 }}>
          <CountryBadge country={job.Country} />
          {/* Always Remote — that's the whole collection. */}
          <Badge variant="blue" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>Remote</Badge>
          {salary && (
            <Badge variant="neutral" style={{ fontSize: '0.72rem', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {job.filterSalaryTier && (
                <span
                  title={job.filterSalaryTier === 'ats' ? 'Salary provided by employer' : 'Salary found in job description'}
                  style={{
                    width: 5, height: 5, borderRadius: '50%', flexShrink: 0, cursor: 'help',
                    background: job.filterSalaryTier === 'ats' ? '#16a34a' : '#3b82f6',
                  }}
                />
              )}
              {salary}
            </Badge>
          )}
        </div>
        </div>
      </button>
    );
  })
);

interface MobileProps {
  job: IJob;
  onClick: () => void;
}

export const RemoteMobileJobCard = memo(function RemoteMobileJobCard({ job, onClick }: MobileProps) {
  return (
    <button
      onClick={onClick}
      style={{
        border: '1px solid var(--border)', borderRadius: 10,
        background: 'transparent', padding: '14px 12px',
        textAlign: 'left', width: '100%',
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}
    >
      <CompanyLogo companyName={job.Company} domain={job.companyDomain ?? undefined} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700, lineHeight: 1.3 }}>{job.JobTitle}</p>
      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 4 }}>{job.Company} · {getRemoteDisplayLocation(job)}</p>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>{relativeDate(job.PostedDate || job.scrapedAt)}</p>
      <div className="flex flex-wrap gap-1.5" style={{ marginTop: 6 }}>
        <CountryBadge country={job.Country} compact />
        <Badge variant="blue" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>Remote</Badge>
      </div>
      </div>
    </button>
  );
});
