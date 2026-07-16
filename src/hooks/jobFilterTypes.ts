/**
 * Constants and types for useJobFilters.
 * Kept separate so non-hook consumers (filter UI) can import without
 * pulling in the React hook bundle.
 */
import type { CSSProperties } from 'react';

export const PAGE_SIZE = 30;
export const SEARCH_DEBOUNCE_MS = 400;

export const SORT_DROPDOWN_OPTIONS = [
  { value: 'newest',  label: 'Newest first' },
  { value: 'company', label: 'Company A-Z'  },
] as const;

export const DATE_DROPDOWN_OPTIONS = [
  { value: 'All',        label: 'All time'   },
  { value: 'Today',      label: 'Today'      },
  { value: 'This Week',  label: 'This week'  },
  { value: 'This Month', label: 'This month' },
] as const;

export const FILTER_CONTROL_STYLE: CSSProperties = {
  height: 34,
  fontSize: '0.76rem',
  color: 'var(--text-secondary)',
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '0 10px',
  outline: 'none',
};

export type SortOption = 'newest' | 'company';
export type DateFilter = 'All' | 'Today' | 'This Week' | 'This Month';

export interface FilterState {
  company:  string[];
  category: string[];
  date:     DateFilter;
  sort:     SortOption;
  search:   string;
}

export const DEFAULT_FILTERS: FilterState = {
  company:  [],
  category: [],
  date:     'All',
  sort:     'newest',
  search:   '',
};

export interface FilterDropdownOption {
  value: string;
  label: string;
}

export function buildSearchParams(filters: FilterState, page: number): URLSearchParams {
  const p = new URLSearchParams();
  p.set('page',  String(page));
  p.set('limit', String(PAGE_SIZE));

  filters.company.forEach(c => p.append('company', c));
  filters.category.forEach(c => p.append('category', c));

  if (filters.search.trim())     p.set('search', filters.search.trim());
  if (filters.date !== 'All')    p.set('date',   filters.date);
  if (filters.sort !== 'newest') p.set('sort',   filters.sort);

  return p;
}
