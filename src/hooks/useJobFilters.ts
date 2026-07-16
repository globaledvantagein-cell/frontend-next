/**
 * Server-driven job filters hook.
 *
 * All filtering and sorting happens on the backend via MongoDB queries.
 * The hook manages:
 *   - filter state (UI updates instantly, search is debounced 400 ms)
 *   - fetching page 1 whenever committed filters change
 *   - appending subsequent pages via `loadMore()`
 *   - company dropdown options fetched once from /api/jobs/company-names
 *   - category dropdown options fetched once from /api/jobs/category-counts
 *   - an `updateJob()` helper so callers can patch individual jobs in-memory
 *     (e.g. after an apply-click count update) without refetching
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { IJob } from '../types';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '../utils/categorize';
import { apiGet } from '../utils/jobApi';
import {
  PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
  DEFAULT_FILTERS,
  buildSearchParams,
  type FilterState,
  type FilterDropdownOption,
} from './jobFilterTypes';

// Re-export so existing imports keep working.
export {
  PAGE_SIZE,
  SORT_DROPDOWN_OPTIONS,
  DATE_DROPDOWN_OPTIONS,
  FILTER_CONTROL_STYLE,
  DEFAULT_FILTERS,
  type FilterState,
  type SortOption,
  type DateFilter,
  type FilterDropdownOption,
} from './jobFilterTypes';

export function useJobFilters(initialCompany?: string) {
  const initialState = useMemo<FilterState>(() => ({
    ...DEFAULT_FILTERS,
    company: initialCompany ? [initialCompany] : [],
  }), [initialCompany]);

  // UI state — updates immediately
  const [filters, setFiltersInternal] = useState<FilterState>(initialState);
  // Debounced "committed" state — drives API calls
  const [committedFilters, setCommittedFilters] = useState<FilterState>(initialState);

  // Server results
  const [jobs,        setJobs]        = useState<IJob[]>([]);
  const [totalJobs,   setTotalJobs]   = useState(0);
  const [hasMore,     setHasMore]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [companyOptions, setCompanyOptions] = useState<FilterDropdownOption[]>([
    { value: 'All', label: 'All' },
  ]);

  const [categoryOptions, setCategoryOptions] = useState<FilterDropdownOption[]>(
    CATEGORY_ORDER.map(cat => ({ value: cat, label: CATEGORY_LABELS[cat] })),
  );

  // Internal refs
  const abortRef       = useRef<AbortController | null>(null);
  const pageRef        = useRef(2);
  const loadingMoreRef = useRef(false);
  const committedRef   = useRef(committedFilters);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    committedRef.current = committedFilters;
  }, [committedFilters]);

  // ── Bootstrap: company names + category counts (parallel, once) ─────────
  useEffect(() => {
    const ctrl = new AbortController();

    apiGet<string[]>('/api/jobs/company-names', { signal: ctrl.signal, noAuth: true })
      .then(names => {
        if (!Array.isArray(names)) return;
        setCompanyOptions([
          { value: 'All', label: 'All' },
          ...names.map(n => ({ value: n, label: n })),
        ]);
      })
      .catch(() => {}); // non-critical

    apiGet<Record<string, number>>('/api/jobs/category-counts', { signal: ctrl.signal, noAuth: true })
      .then(counts => {
        if (!counts || typeof counts !== 'object') return;
        setCategoryOptions(
          CATEGORY_ORDER.map(cat => ({
            value: cat,
            label: `${CATEGORY_LABELS[cat]} (${counts[cat] || 0})`,
          })),
        );
      })
      .catch(() => {});

    return () => ctrl.abort();
  }, []);

  // ── Fetch page 1 on every committedFilters change ───────────────────────
  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setJobs([]);
    pageRef.current = 2;

    const params = buildSearchParams(committedFilters, 1);

    apiGet<{ jobs?: IJob[]; totalJobs?: number }>(`/api/jobs?${params}`, { signal: ctrl.signal, noAuth: true })
      .then(data => {
        if (ctrl.signal.aborted) return;
        const batch = Array.isArray(data?.jobs) ? data.jobs : [];
        const total = Number(data?.totalJobs) || 0;
        setJobs(batch);
        setTotalJobs(total);
        setHasMore(batch.length === PAGE_SIZE && batch.length < total);
      })
      .catch(err => {
        if (err?.name !== 'AbortError') console.error('[useJobFilters] fetch error:', err);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  }, [committedFilters]);

  // ── Load next page ──────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    const page   = pageRef.current;
    const params = buildSearchParams(committedRef.current, page);

    try {
      const data = await apiGet<{ jobs?: IJob[]; totalJobs?: number }>(
        `/api/jobs?${params}`, { noAuth: true }
      );
      const batch = Array.isArray(data?.jobs) ? data.jobs : [];
      const total = Number(data?.totalJobs) || 0;

      setJobs(prev => {
        const next = [...prev, ...batch];
        setHasMore(next.length < total);
        return next;
      });
      setTotalJobs(total);
      pageRef.current = page + 1;
    } catch (err) {
      console.error('[useJobFilters] loadMore error:', err);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [hasMore]);

  // ── Debounced setFilters ────────────────────────────────────────────────
  const setFilters = useCallback(
    (updater: FilterState | ((prev: FilterState) => FilterState)) => {
      setFiltersInternal(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        const searchChanged = next.search !== prev.search;

        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        if (searchChanged) {
          searchTimerRef.current = setTimeout(() => setCommittedFilters(next), SEARCH_DEBOUNCE_MS);
        } else {
          setCommittedFilters(next);
        }
        return next;
      });
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters(prev => ({ ...prev, company: [], category: [], date: 'All', search: '' }));
  }, [setFilters]);

  const updateJob = useCallback((jobId: string, updates: Partial<IJob>) => {
    setJobs(prev =>
      prev.map(job => (job._id === jobId ? { ...job, ...updates } : job)),
    );
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      filters.search.trim() !== ''  ||
      filters.company.length > 0    ||
      filters.category.length > 0   ||
      filters.date !== 'All',
    [filters],
  );

  const activeFilterCount = useMemo(
    () =>
      (filters.search.trim()       ? 1 : 0) +
      (filters.company.length > 0  ? 1 : 0) +
      (filters.category.length > 0 ? 1 : 0) +
      (filters.date !== 'All'      ? 1 : 0),
    [filters],
  );

  return {
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
    jobs,
    setJobs,
    totalJobs,
    hasMore,
    loading,
    loadingMore,
    loadMore,
    updateJob,
    companyOptions,
    categoryOptions,
  };
}
