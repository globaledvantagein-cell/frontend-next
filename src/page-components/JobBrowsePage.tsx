'use client';

/**
 * Shared browse layout: sticky filter rail + job cards.
 *
 * Owns everything that is identical between job verticals — the two-column
 * shell, the count header, infinite scroll, skeletons, the empty state, and the
 * mobile filter sheet. The page wrappers own only their data source
 * (useJobFilters vs useRemoteJobFilters) and any vertical-specific filter.
 *
 * Cards link to `${jobLinkPrefix}/${job._id}` in a new tab. There is no inline
 * detail panel and nothing here fetches a job description.
 */

import { useEffect, useRef } from 'react';
import { Button, EmptyState } from '../components/ui';
import BrowseSidebar from '../components/BrowseSidebar';
import { DesktopJobCard, MobileJobCard } from '../components/jobs/JobListItem';
import { useAppliedJobs } from '../context/AppliedJobsContext';
import type { IJob } from '../types';
import type { FilterDropdownOption, IFacetCounts } from '../hooks/jobFilterTypes';
import type { SidebarFilterState } from '../components/BrowseSidebar';

export interface JobBrowsePageProps {
  // ── Data ──
  jobs: IJob[];
  totalJobs: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;

  // ── Filters ──
  filters: SidebarFilterState;
  setFilters: React.Dispatch<React.SetStateAction<any>>;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  companyOptions: FilterDropdownOption[];
  categoryOptions: FilterDropdownOption[];
  facetCounts?: IFacetCounts | null;

  // ── Auth / premium ──
  isPremium?: boolean;
  onPremiumRequired?: () => void;

  /** '/jobs' or '/remote-jobs' — cards link to `${prefix}/${job._id}`. */
  jobLinkPrefix: string;
  /** Autocomplete endpoint for the rail's search box. */
  autocompleteEndpoint?: string;

  /** Vertical-specific filter sections, rendered inside the rail. */
  extraFilters?: React.ReactNode;
  /** Passed straight through to BrowseSidebar. */
  variant?: 'main' | 'remote';
  countryOptions?: FilterDropdownOption[];

  /** document.title for the page. */
  pageTitle?: string;

  /** Mobile filter surface — the sheet/top bar differs per vertical. */
  mobileFilters?: React.ReactNode;

  /** Set false where "Applied" badges are not tracked (the remote vertical). */
  showAppliedBadges?: boolean;
}

export default function JobBrowsePage({
  jobs, totalJobs, loading, loadingMore, hasMore, loadMore,
  filters, setFilters, clearFilters, hasActiveFilters, activeFilterCount,
  companyOptions, categoryOptions, facetCounts,
  isPremium = true, onPremiumRequired,
  jobLinkPrefix, autocompleteEndpoint = '/api/jobs/autocomplete',
  extraFilters, pageTitle, mobileFilters, showAppliedBadges = true,
  variant = 'main', countryOptions,
}: JobBrowsePageProps) {
  const { isApplied } = useAppliedJobs();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (pageTitle) document.title = pageTitle;
  }, [pageTitle]);

  // ── Infinite scroll ─────────────────────────────────────────────────────
  // The list scrolls with the PAGE (no inner scroll container), so the
  // observer root is the viewport.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loading || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '400px', threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, hasMore, loadMore]);

  const loadMoreIndicator = (
    <>
      <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />
      {hasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            style={{
              height: 36, padding: '0 20px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'transparent',
              color: loadingMore ? 'var(--text-muted)' : 'var(--text-secondary)',
              fontSize: '0.82rem', fontWeight: 600,
              cursor: loadingMore ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: 'inherit',
            }}
          >
            {loadingMore ? 'Loading…' : 'Load more jobs'}
          </button>
        </div>
      )}
      {!hasMore && jobs.length > 0 && !loading && (
        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '12px 0' }}>
          All {totalJobs} roles loaded
        </p>
      )}
    </>
  );

  const emptyState = (
    <EmptyState
      title="No jobs match your filters"
      body={hasActiveFilters ? 'Try adjusting your search or filters.' : 'No roles are currently available.'}
      action={hasActiveFilters ? <Button variant="ghost" size="sm" onClick={clearFilters}>Clear all filters</Button> : undefined}
    />
  );

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div className="dashboard-shell" style={{ paddingTop: 10 }}>
        {mobileFilters}

        <div className="browse-layout">
          <BrowseSidebar
            filters={filters} setFilters={setFilters}
            companyOptions={companyOptions} categoryOptions={categoryOptions}
            facetCounts={facetCounts}
            hasActiveFilters={hasActiveFilters} activeFilterCount={activeFilterCount}
            clearFilters={clearFilters}
            isPremium={isPremium} onPremiumRequired={onPremiumRequired}
            autocompleteEndpoint={autocompleteEndpoint}
            extraFilters={extraFilters}
            variant={variant}
            countryOptions={countryOptions}
          />

          <main className="browse-jobs-grid">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10, minHeight: 20 }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {loading ? '—' : totalJobs.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {totalJobs === 1 ? 'job' : 'jobs'}
                {hasActiveFilters ? ' matching your filters' : ''}
              </span>
            </div>

            {/* Desktop cards */}
            <div className="desktop-cards-only flex flex-col" style={{ gap: 8 }}>
              {loading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="skeleton" style={{ height: 88, borderRadius: 10 }} />
                  ))}
                </div>
              ) : jobs.length === 0 ? emptyState : (
                jobs.map(job => (
                  <DesktopJobCard
                    key={job._id}
                    job={job}
                    href={`${jobLinkPrefix}/${job._id}`}
                    applied={showAppliedBadges ? isApplied(job._id) : false}
                  />
                ))
              )}
            </div>

            {/* Mobile cards */}
            <div className="mobile-list-only flex flex-col gap-2">
              {loading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 10 }} />)}
                </div>
              ) : jobs.length === 0 ? emptyState : (
                jobs.map(job => (
                  <MobileJobCard
                    key={job._id}
                    job={job}
                    href={`${jobLinkPrefix}/${job._id}`}
                    applied={showAppliedBadges ? isApplied(job._id) : false}
                  />
                ))
              )}
            </div>

            {/* One sentinel for both lists — duplicating it would leave the
                IntersectionObserver watching a display:none node. */}
            {!loading && jobs.length > 0 && loadMoreIndicator}
          </main>
        </div>
      </div>
    </div>
  );
}
