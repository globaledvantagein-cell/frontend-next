'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from '@/compat/router';
import MobileDetailOverlay from '../components/MobileDetailOverlay';
import PublicJobDetail from '../components/PublicJobDetail';
import JobDetailSkeleton from '../components/JobDetailSkeleton';
import SignupGate from '../components/SignupGate';
import { Button, Container, EmptyState } from '../components/ui';
import { DashboardFilterBar, MobileFilterSheet } from '../components/DashboardFilterBar';
import { DesktopJobCard, MobileJobCard } from '../components/jobs/JobListItem';
import { useAppliedJobs } from '../context/AppliedJobsContext';
import { BRAND } from '../theme/brand';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useJobFilters } from '../hooks/useJobFilters';
import { useGatedJobDetail } from '../hooks/useGatedJobDetail';
import { useDeepLinkJob } from '../hooks/useDeepLinkJob';

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const companyParam    = searchParams.get('company');
  const searchParam     = searchParams.get('search');
  const deepLinkedJobId = searchParams.get('id');

  const {
    filters, setFilters, clearFilters, hasActiveFilters, activeFilterCount,
    companyOptions, categoryOptions,
    jobs, setJobs, totalJobs, hasMore,
    loading, loadingMore, loadMore, updateJob,
  } = useJobFilters(companyParam || undefined, searchParam || undefined);

  const { isApplied } = useAppliedJobs();

  const [selectedJobId,    setSelectedJobId]    = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [splitHeight,      setSplitHeight]      = useState<number | null>(null);
  const [filterSheetOpen,  setFilterSheetOpen]  = useState(false);
  const [openDropdown,     setOpenDropdown]     = useState<string | null>(null);
  const [forceGate,        setForceGate]        = useState(false);

  const isMobile = useMediaQuery('(max-width: 767px)');

  const heroRef        = useRef<HTMLDivElement | null>(null);
  const filtersRef     = useRef<HTMLDivElement | null>(null);
  const splitViewRef   = useRef<HTMLDivElement | null>(null);
  const listPanelRef   = useRef<HTMLDivElement | null>(null);
  const sentinelRef    = useRef<HTMLDivElement | null>(null);
  const desktopJobRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const savedScrollRef = useRef(0);

  useEffect(() => { document.title = `${BRAND.appName} Jobs`; }, []);

  // ── Auto-select first job ───────────────────────────────────────────────
  useEffect(() => {
    if (jobs.length === 0) {
      setSelectedJobId(null);
      setMobileDetailOpen(false);
      return;
    }
    const exists = jobs.some(job => job._id === selectedJobId);
    if (!exists) {
      setSelectedJobId(jobs[0]._id);
      if (isMobile) setMobileDetailOpen(false);
    }
  }, [jobs, selectedJobId, isMobile]);

  // ── Deep-link handling (extracted into a hook) ──────────────────────────
  const handleDeepLinkResolve = useCallback((job: any, mobile: boolean) => {
    setSelectedJobId(job._id);
    if (mobile) {
      savedScrollRef.current = window.scrollY;
      setMobileDetailOpen(true);
    }
  }, []);
  const prependJob = useCallback((job: any) => {
    setJobs(prev => prev.some(j => j._id === job._id) ? prev : [job, ...prev]);
  }, [setJobs]);

  useDeepLinkJob({
    deepLinkedJobId,
    jobs,
    loading,
    isMobile,
    onResolve: handleDeepLinkResolve,
    prepend: prependJob,
  });

  // ── Auto-scroll to selected card on desktop ─────────────────────────────
  useEffect(() => {
    if (!selectedJobId || isMobile) return;
    const node = desktopJobRefs.current[selectedJobId];
    if (!node) return;
    requestAnimationFrame(() => node.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }, [selectedJobId, isMobile]);

  // ── Split-view height ───────────────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 768 || !splitViewRef.current) {
        setSplitHeight(null);
        return;
      }
      const top = splitViewRef.current.getBoundingClientRect().top;
      setSplitHeight(Math.max(window.innerHeight - top - 4, 320));
    };
    const observer = new ResizeObserver(update);
    const nodes = [heroRef.current, filtersRef.current, splitViewRef.current].filter(Boolean) as Element[];
    nodes.forEach(n => observer.observe(n));
    window.addEventListener('resize', update);
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [loading]);

  useEffect(() => { if (!isMobile) setFilterSheetOpen(false); }, [isMobile]);

  // ── Infinite scroll ─────────────────────────────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || loading || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { root: isMobile ? null : listPanelRef.current, rootMargin: '200px', threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, hasMore, loadMore, isMobile]);

  // ── Selected job / gated detail ─────────────────────────────────────────
  const selectedTeaser = useMemo(
    () => (selectedJobId ? jobs.find(job => job._id === selectedJobId) ?? null : null),
    [jobs, selectedJobId],
  );

  const { job: fullJob, gated, teaser: gatedTeaser, loading: detailLoading, refetch: refetchDetail } =
    useGatedJobDetail(selectedJobId, selectedTeaser);

  const desktopSplitHeight = splitHeight ? `${splitHeight}px` : undefined;

  // Reset forceGate when selection changes
  useEffect(() => { setForceGate(false); }, [selectedJobId]);

  const handleApplyTracked = useCallback((jobId: string, applyClicks: number) => {
    updateJob(jobId, { applyClicks });
  }, [updateJob]);

  // Memoized click handlers per row would require a per-job factory, but the
  // hot path here (re-renders on selection change) is dominated by the list
  // items themselves which are memoized. Inline closures are fine.
  const handleDesktopClick = (jobId: string) => () => setSelectedJobId(jobId);
  const handleMobileClick  = (jobId: string) => () => {
    setSelectedJobId(jobId);
    savedScrollRef.current = window.scrollY;
    setMobileDetailOpen(true);
  };

  const renderRightPanel = () => {
    if (!selectedJobId) {
      return <EmptyState title="Select a job from the list to view details" body="Pick any role on the left panel." />;
    }
    if (forceGate) {
      return (
        <SignupGate
          teaser={selectedTeaser || undefined}
          onAuthSuccess={() => { setForceGate(false); refetchDetail(); }}
        />
      );
    }
    if (detailLoading && !fullJob && !gated) {
      return <JobDetailSkeleton />;
    }
    if (gated) {
      return <SignupGate teaser={gatedTeaser || selectedTeaser || undefined} onAuthSuccess={refetchDetail} />;
    }
    if (fullJob) {
      return (
        <PublicJobDetail
          job={fullJob}
          onApplyTracked={handleApplyTracked}
          onAuthRequired={() => setForceGate(true)}
        />
      );
    }
    return null;
  };

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
              border: '1px solid var(--border)', background: 'var(--bg-surface-2)',
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

  const skeletons = (
    <div className="flex flex-col gap-3" style={{ padding: 12 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="skeleton" style={{ height: 88, borderRadius: 10 }} />
      ))}
    </div>
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
      {/* Hero removed — filters are the first thing visible */}
      <div ref={heroRef} style={{ display: 'none' }} />

      <Container style={{ padding: '10px 24px 0', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div ref={filtersRef} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, marginBottom: 10, flexShrink: 0 }}>
          <DashboardFilterBar
            filters={filters} setFilters={setFilters}
            companyOptions={companyOptions} categoryOptions={categoryOptions}
            filteredCount={jobs.length} totalCount={totalJobs}
            hasActiveFilters={hasActiveFilters} activeFilterCount={activeFilterCount}
            clearFilters={clearFilters}
            openDropdown={openDropdown} setOpenDropdown={setOpenDropdown}
            onOpenFilterSheet={() => setFilterSheetOpen(true)}
          />
        </div>

        {filterSheetOpen && isMobile && (
          <MobileFilterSheet
            filters={filters} setFilters={setFilters}
            companyOptions={companyOptions} categoryOptions={categoryOptions}
            filteredCount={jobs.length}
            hasActiveFilters={hasActiveFilters} clearFilters={clearFilters}
            openDropdown={openDropdown} setOpenDropdown={setOpenDropdown}
            onClose={() => setFilterSheetOpen(false)}
          />
        )}

        <div ref={splitViewRef} className="split-grid" style={{ gap: 10, flex: 1, minHeight: 0, height: desktopSplitHeight }}>
          <section
            ref={listPanelRef}
            className="thin-scroll"
            style={{
              border: '1px solid var(--border)', borderRadius: 10,
              background: 'var(--bg-surface)', minHeight: 0,
              height: desktopSplitHeight, overflowY: 'auto',
            }}
          >
            {loading ? skeletons : (
              <div className="flex flex-col" style={{ gap: 6, padding: '8px 8px' }}>
                {jobs.length === 0 ? emptyState : (
                  <>
                    {jobs.map(job => (
                      <DesktopJobCard
                        key={job._id}
                        ref={node => { desktopJobRefs.current[job._id] = node; }}
                        job={job}
                        selected={selectedJobId === job._id}
                        applied={isApplied(job._id)}
                        onClick={handleDesktopClick(job._id)}
                      />
                    ))}
                    {loadMoreIndicator}
                  </>
                )}
              </div>
            )}
          </section>

          <section
            className="thin-scroll"
            style={{
              border: '1px solid var(--border)', borderRadius: 10,
              background: 'var(--bg-surface)', padding: '10px 14px',
              minHeight: 0, height: desktopSplitHeight, overflowY: 'auto',
            }}
          >
            {renderRightPanel()}
          </section>
        </div>

        <div className="mobile-list-only flex flex-col gap-2">
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 10 }} />)}
            </div>
          ) : jobs.length === 0 ? emptyState : (
            <>
              {jobs.map(job => (
                <MobileJobCard key={job._id} job={job} applied={isApplied(job._id)} onClick={handleMobileClick(job._id)} />
              ))}
              {loadMoreIndicator}
            </>
          )}
        </div>

        {mobileDetailOpen && selectedJobId && (
          <MobileDetailOverlay
            onBack={() => {
              setMobileDetailOpen(false);
              requestAnimationFrame(() => window.scrollTo(0, savedScrollRef.current));
            }}
            backLabel="Back to results"
          >
            {renderRightPanel()}
          </MobileDetailOverlay>
        )}
      </Container>
    </div>
  );
}