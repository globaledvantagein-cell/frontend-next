'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from '@/compat/router';
import MobileDetailOverlay from '../components/MobileDetailOverlay';
import PublicJobDetail from '../components/PublicJobDetail';
import JobDetailSkeleton from '../components/JobDetailSkeleton';
import SignupGate from '../components/SignupGate';
import UpgradeModal from '../components/UpgradeModal';
import { Button, Container, EmptyState } from '../components/ui';
import { DashboardFilterBar, MobileFilterSheet } from '../components/DashboardFilterBar';
import { DesktopJobCard, MobileJobCard } from '../components/jobs/JobListItem';
import { useAppliedJobs } from '../context/AppliedJobsContext';
import { useAuth } from '../context/AuthContext';
import type { GateReason, GateUsage } from '../types';
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
    companyOptions, categoryOptions, facetCounts,
    jobs, setJobs, totalJobs, hasMore,
    loading, loadingMore, loadMore, updateJob,
  } = useJobFilters(companyParam || undefined, searchParam || undefined);

  const { isApplied } = useAppliedJobs();
  const { isPremium } = useAuth();

  const [selectedJobId,    setSelectedJobId]    = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [splitHeight,      setSplitHeight]      = useState<number | null>(null);
  const [filterSheetOpen,  setFilterSheetOpen]  = useState(false);
  const [openDropdown,     setOpenDropdown]     = useState<string | null>(null);
  const [forceGate,        setForceGate]        = useState(false);
  // The active upgrade/gate modal (null = closed). Reused for JD-limit,
  // apply-limit, signup, and premium-filter gates.
  const [gateModal,        setGateModal]        = useState<{ reason: GateReason; usage?: GateUsage | null } | null>(null);

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

  const { job: fullJob, gated, teaser: gatedTeaser, gateReason, usage: gateUsage, loading: detailLoading, refetch: refetchDetail } =
    useGatedJobDetail(selectedJobId, selectedTeaser);

  const desktopSplitHeight = splitHeight ? `${splitHeight}px` : undefined;

  // Reset forceGate when selection changes
  useEffect(() => { setForceGate(false); }, [selectedJobId]);

  // A gated JD-detail response pops the UpgradeModal. signup_required also keeps
  // the in-panel SignupGate (below) so the panel isn't blank behind the modal.
  useEffect(() => {
    if (gated && gateReason) setGateModal({ reason: gateReason, usage: gateUsage });
  }, [gated, gateReason, gateUsage]);

  const handleApplyLimit = useCallback((usage?: GateUsage | null) => {
    setGateModal({ reason: 'apply_limit', usage });
  }, []);
  const handlePremiumFilter = useCallback(() => {
    setGateModal({ reason: 'premium_required' });
  }, []);

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
      // Anonymous visitor → the Google-auth SignupGate is the right surface.
      if (gateReason === 'signup_required') {
        return <SignupGate teaser={gatedTeaser || selectedTeaser || undefined} onAuthSuccess={refetchDetail} />;
      }
      // Signed-in free user (jd_limit) or premium-gated content → a light teaser
      // backdrop; the UpgradeModal (opened by the effect above) is the CTA.
      const t = gatedTeaser || selectedTeaser;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px 20px', maxWidth: 440, margin: '0 auto', gap: 12 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', color: 'var(--text-primary)', margin: 0 }}>
            {t?.JobTitle || 'Weekly limit reached'}
          </h2>
          {t?.Company && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              {t.Company}{(t as any)?.Location ? ` · ${(t as any).Location}` : ''}
            </p>
          )}
          {(gatedTeaser?.descriptionPreview) && (
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {gatedTeaser.descriptionPreview}
            </p>
          )}
          <Button size="sm" onClick={() => setGateModal({ reason: gateReason || 'jd_limit', usage: gateUsage })}>
            Upgrade to see the full description
          </Button>
        </div>
      );
    }
    if (fullJob) {
      return (
        <PublicJobDetail
          job={fullJob}
          onApplyTracked={handleApplyTracked}
          onAuthRequired={() => setForceGate(true)}
          onApplyLimit={handleApplyLimit}
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

      {/* maxWidth 1800 (not the default xl 1200) so the split-grid's own
          max-width rules — 1600px @1440, 1800px @1920 (globals.css) — are no
          longer clipped by the Container. Overriding here keeps Container.tsx
          untouched for other pages. */}
      <Container style={{ maxWidth: '1800px', padding: '10px 24px 0', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div ref={filtersRef} style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: 10, marginBottom: 10, flexShrink: 0 }}>
          <DashboardFilterBar
            filters={filters} setFilters={setFilters}
            companyOptions={companyOptions} categoryOptions={categoryOptions}
            facetCounts={facetCounts}
            filteredCount={jobs.length} totalCount={totalJobs}
            hasActiveFilters={hasActiveFilters} activeFilterCount={activeFilterCount}
            clearFilters={clearFilters}
            openDropdown={openDropdown} setOpenDropdown={setOpenDropdown}
            onOpenFilterSheet={() => setFilterSheetOpen(true)}
            isPremium={isPremium} onPremiumRequired={handlePremiumFilter}
          />
        </div>

        {filterSheetOpen && isMobile && (
          <MobileFilterSheet
            filters={filters} setFilters={setFilters}
            companyOptions={companyOptions} categoryOptions={categoryOptions}
            facetCounts={facetCounts}
            filteredCount={jobs.length}
            hasActiveFilters={hasActiveFilters} clearFilters={clearFilters}
            openDropdown={openDropdown} setOpenDropdown={setOpenDropdown}
            onClose={() => setFilterSheetOpen(false)}
            isPremium={isPremium} onPremiumRequired={handlePremiumFilter}
          />
        )}

        <div ref={splitViewRef} className="split-grid" style={{ gap: 8, flex: 1, minHeight: 0, height: desktopSplitHeight }}>
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
              <div className="flex flex-col" style={{ gap: 8, padding: '4px 4px' }}>
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

      {gateModal && (
        <UpgradeModal
          gateReason={gateModal.reason}
          usage={gateModal.usage}
          onClose={() => setGateModal(null)}
        />
      )}
    </div>
  );
}