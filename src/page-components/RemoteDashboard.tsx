'use client';

/**
 * The /remote-jobs dashboard — the free, global remote vertical.
 *
 * Structurally the same split-view as Dashboard.tsx (list left, detail right,
 * mobile overlay, infinite scroll), but a separate component reading a separate
 * pipeline end-to-end: useRemoteJobFilters → /api/remote-jobs → remoteJobs
 * collection. Nothing here touches the German cache or its premium metering.
 *
 * Deliberately absent vs. Dashboard.tsx: premium gates, upgrade modals, signup
 * gates, locked filters, and the Smart Match / Today's Matches integrations —
 * those belong to the German niche product.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from '@/compat/router';
import MobileDetailOverlay from '../components/MobileDetailOverlay';
import RemoteJobDetail from '../components/RemoteJobDetail';
import JobDetailSkeleton from '../components/JobDetailSkeleton';
import { Button, EmptyState } from '../components/ui';
import { RemoteFilterBar, RemoteMobileFilterSheet } from '../components/RemoteFilterBar';
import { RemoteDesktopJobCard, RemoteMobileJobCard } from '../components/jobs/RemoteJobListItem';
import type { IJob } from '../types';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useRemoteJobFilters } from '../hooks/useRemoteJobFilters';
import { fetchRemoteJobDetail } from '../utils/remoteJobApi';

// Dismissal is remembered per browser so the banner doesn't nag on every visit.
const BANNER_DISMISS_KEY = 'ejg_remote_banner_dismissed';

export default function RemoteDashboard() {
  const [searchParams] = useSearchParams();
  const companyParam    = searchParams.get('company');
  const searchParam     = searchParams.get('search');
  const deepLinkedJobId = searchParams.get('id');

  const {
    filters, setFilters, clearFilters, hasActiveFilters, activeFilterCount,
    companyOptions, categoryOptions, facetCounts,
    jobs, totalJobs, hasMore,
    loading, loadingMore, loadMore,
  } = useRemoteJobFilters(companyParam || undefined, searchParam || undefined);

  const [selectedJobId,    setSelectedJobId]    = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [splitHeight,      setSplitHeight]      = useState<number | null>(null);
  const [openDropdown,     setOpenDropdown]     = useState<string | null>(null);
  const [filterSheetOpen,  setFilterSheetOpen]  = useState(false);
  const [bannerDismissed,  setBannerDismissed]  = useState(true); // assume dismissed pre-hydration

  const isMobile = useMediaQuery('(max-width: 767px)');

  const filtersRef     = useRef<HTMLDivElement | null>(null);
  const splitViewRef   = useRef<HTMLDivElement | null>(null);
  const listPanelRef   = useRef<HTMLDivElement | null>(null);
  const sentinelRef    = useRef<HTMLDivElement | null>(null);
  const desktopJobRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const savedScrollRef = useRef(0);

  // localStorage is client-only; reading it in an effect keeps the first client
  // render identical to the server HTML (banner hidden), then reveals it.
  useEffect(() => {
    try { setBannerDismissed(localStorage.getItem(BANNER_DISMISS_KEY) === '1'); }
    catch { setBannerDismissed(false); }
  }, []);

  const dismissBanner = useCallback(() => {
    setBannerDismissed(true);
    try { localStorage.setItem(BANNER_DISMISS_KEY, '1'); } catch { /* private mode — fine */ }
  }, []);

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

  // ── Deep link (?id=) — select it once the first page has landed ──────────
  const deepLinkHandledRef = useRef(false);
  useEffect(() => {
    if (!deepLinkedJobId || loading || deepLinkHandledRef.current) return;
    deepLinkHandledRef.current = true;
    setSelectedJobId(deepLinkedJobId);
    if (isMobile) {
      savedScrollRef.current = window.scrollY;
      setMobileDetailOpen(true);
    }
  }, [deepLinkedJobId, loading, isMobile]);

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
    const nodes = [filtersRef.current, splitViewRef.current].filter(Boolean) as Element[];
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

  // ── Selected job detail — always ungated, so a plain fetch is enough ─────
  const [detail, setDetail] = useState<IJob | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!selectedJobId) {
      setDetail(null);
      return;
    }
    const ctrl = new AbortController();
    setDetailLoading(true);
    fetchRemoteJobDetail(selectedJobId, { signal: ctrl.signal })
      .then(job => { if (!ctrl.signal.aborted) setDetail(job); })
      .catch(err => {
        if (err?.name !== 'AbortError') console.error('[RemoteDashboard] detail error:', err);
      })
      .finally(() => { if (!ctrl.signal.aborted) setDetailLoading(false); });
    return () => ctrl.abort();
  }, [selectedJobId]);

  const desktopSplitHeight = splitHeight ? `${splitHeight}px` : undefined;

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
    if (detailLoading && !detail) return <JobDetailSkeleton />;
    if (detail) return <RemoteJobDetail job={detail} />;
    return <EmptyState title="Couldn’t load this job" body="It may have been filled or removed." />;
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

  const skeletons = (
    <div className="flex flex-col gap-3" style={{ padding: 12 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="skeleton" style={{ height: 88, borderRadius: 10 }} />
      ))}
    </div>
  );

  const emptyState = (
    <EmptyState
      title="No remote jobs match your filters"
      body={hasActiveFilters ? 'Try adjusting your search or filters.' : 'No roles are currently available.'}
      action={hasActiveFilters ? <Button variant="ghost" size="sm" onClick={clearFilters}>Clear all filters</Button> : undefined}
    />
  );

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* .dashboard-shell (globals.css) — the SAME container /jobs uses:
          1440px cap, centered, 20px gutters. */}
      <div className="dashboard-shell" style={{ paddingTop: 10 }}>

        {/* One-line muted intro banner, dismissible. Border only — no fill, so
            it sits on the page background like everything else. */}
        {!bannerDismissed && (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              fontSize: '0.78rem', color: 'var(--text-muted)',
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 8, padding: '7px 12px', marginBottom: 8, flexShrink: 0,
            }}
          >
            <span style={{ flex: 1, minWidth: 0 }}>
              🌍 Fully remote positions from companies in the US, UK, Canada, Australia, and more. Work from anywhere.
            </span>
            <button
              type="button"
              onClick={dismissBanner}
              aria-label="Dismiss"
              style={{
                background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1, flexShrink: 0, fontFamily: 'inherit',
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* No box: transparent, no border, no side padding — the bar sits
            directly on the page background. */}
        <div ref={filtersRef} style={{ marginBottom: 10, flexShrink: 0 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
            Remote Jobs
          </h1>
          <RemoteFilterBar
            filters={filters} setFilters={setFilters}
            companyOptions={companyOptions} categoryOptions={categoryOptions}
            facetCounts={facetCounts}
            filteredCount={jobs.length} totalCount={totalJobs}
            hasActiveFilters={hasActiveFilters} activeFilterCount={activeFilterCount}
            clearFilters={clearFilters}
            openDropdown={openDropdown} setOpenDropdown={setOpenDropdown}
            onOpenFilterSheet={() => setFilterSheetOpen(true)}
          />
        </div>

        {filterSheetOpen && isMobile && (
          <RemoteMobileFilterSheet
            filters={filters} setFilters={setFilters}
            companyOptions={companyOptions} categoryOptions={categoryOptions}
            facetCounts={facetCounts}
            filteredCount={jobs.length}
            hasActiveFilters={hasActiveFilters} clearFilters={clearFilters}
            openDropdown={openDropdown} setOpenDropdown={setOpenDropdown}
            onClose={() => setFilterSheetOpen(false)}
          />
        )}

        {/* Both panels are transparent and border-free — separation comes from
            the card borders, not from background changes. */}
        <div ref={splitViewRef} className="split-grid" style={{ gap: 16, marginTop: 8, flex: 1, minHeight: 0, height: desktopSplitHeight }}>
          <section
            ref={listPanelRef}
            className="thin-scroll"
            style={{
              background: 'transparent', minHeight: 0,
              height: desktopSplitHeight, overflowY: 'auto',
            }}
          >
            {loading ? skeletons : (
              <div className="flex flex-col" style={{ gap: 8, paddingRight: 4 }}>
                {jobs.length === 0 ? emptyState : (
                  <>
                    {jobs.map(job => (
                      <RemoteDesktopJobCard
                        key={job._id}
                        ref={node => { desktopJobRefs.current[job._id] = node; }}
                        job={job}
                        selected={selectedJobId === job._id}
                        onClick={handleDesktopClick(job._id)}
                      />
                    ))}
                    {loadMoreIndicator}
                  </>
                )}
              </div>
            )}
          </section>

          {/* paddingRight clears the scrollbar: the detail header positions
              "Posted: …" absolutely at right:0, so with no right padding it was
              running under the overflow scrollbar and getting clipped. */}
          <section
            className="thin-scroll"
            style={{
              background: 'transparent', paddingLeft: 4, paddingRight: 16,
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
                <RemoteMobileJobCard key={job._id} job={job} onClick={handleMobileClick(job._id)} />
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
      </div>
    </div>
  );
}
