'use client';

/**
 * Shared building blocks for the dashboard filter bar.
 * Both the inline filter bar and the mobile bottom sheet render the same
 * three FilterDropdowns; extracting them eliminates the duplication.
 */
import FilterDropdown from '../FilterDropdown';
import {
  SORT_DROPDOWN_OPTIONS,
  DATE_DROPDOWN_OPTIONS,
  type FilterState,
  type SortOption,
  type DateFilter,
  type FilterDropdownOption,
} from '../../hooks/useJobFilters';

export interface SelectsProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  companyOptions: FilterDropdownOption[];
  categoryOptions: FilterDropdownOption[];
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
}

export function SortSelect({
  width, filters, setFilters, openDropdown, setOpenDropdown,
}: Pick<SelectsProps, 'filters' | 'setFilters' | 'openDropdown' | 'setOpenDropdown'> & { width: number | string }) {
  return (
    <FilterDropdown
      id="sort"
      label="Sort"
      value={filters.sort}
      options={SORT_DROPDOWN_OPTIONS as unknown as FilterDropdownOption[]}
      onChange={val => setFilters(prev => ({ ...prev, sort: val as SortOption }))}
      openId={openDropdown}
      onOpenChange={setOpenDropdown}
      active={filters.sort !== 'newest'}
      width={width}
    />
  );
}

export function FilterSelects({
  filters, setFilters, companyOptions, categoryOptions,
  openDropdown, setOpenDropdown, widthOverride,
}: SelectsProps & { widthOverride?: number | string }) {
  return (
    <>
      <FilterDropdown
        id="company"
        label="Company"
        value=""
        options={companyOptions}
        onChange={() => {}}
        multiSelect
        selectedValues={filters.company}
        onMultiChange={vals => setFilters(prev => ({ ...prev, company: vals }))}
        openId={openDropdown}
        onOpenChange={setOpenDropdown}
        active={filters.company.length > 0}
        width={widthOverride ?? 160}
        searchable
      />

      <FilterDropdown
        id="category"
        label="Category"
        value=""
        options={categoryOptions}
        onChange={() => {}}
        multiSelect
        selectedValues={filters.category}
        onMultiChange={vals => setFilters(prev => ({ ...prev, category: vals }))}
        openId={openDropdown}
        onOpenChange={setOpenDropdown}
        active={filters.category.length > 0}
        width={widthOverride ?? 180}
      />

      <FilterDropdown
        id="date"
        label="Date"
        value={filters.date}
        options={DATE_DROPDOWN_OPTIONS as unknown as FilterDropdownOption[]}
        onChange={val => setFilters(prev => ({ ...prev, date: val as DateFilter }))}
        openId={openDropdown}
        onOpenChange={setOpenDropdown}
        active={filters.date !== 'All'}
        width={widthOverride ?? 120}
      />
    </>
  );
}