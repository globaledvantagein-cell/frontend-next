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
import {
  WORKPLACE_OPTIONS,
  EXPERIENCE_OPTIONS,
  EMPLOYMENT_OPTIONS,
  FILTER_CONTROL_STYLE,
} from '../../hooks/jobFilterTypes';

export interface SelectsProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  companyOptions: FilterDropdownOption[];
  categoryOptions: FilterDropdownOption[];
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
}

// Props shared by the attribute dropdowns (no company/category option lists).
type DropdownProps = Pick<SelectsProps, 'filters' | 'setFilters' | 'openDropdown' | 'setOpenDropdown'>;
type ToggleProps = Pick<SelectsProps, 'filters' | 'setFilters'>;

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

/**
 * Workplace / Experience / Employment multi-select dropdowns. Kept separate
 * from FilterSelects so the desktop layout can place them on their own row.
 */
export function AttributeSelects({
  filters, setFilters, openDropdown, setOpenDropdown, widthOverride,
}: DropdownProps & { widthOverride?: number | string }) {
  return (
    <>
      <FilterDropdown
        id="workplace"
        label="Workplace"
        value=""
        options={WORKPLACE_OPTIONS as unknown as FilterDropdownOption[]}
        onChange={() => {}}
        multiSelect
        selectedValues={filters.workplace}
        onMultiChange={vals => setFilters(prev => ({ ...prev, workplace: vals }))}
        openId={openDropdown}
        onOpenChange={setOpenDropdown}
        active={filters.workplace.length > 0}
        width={widthOverride ?? 110}
      />

      <FilterDropdown
        id="experience"
        label="Experience"
        value=""
        options={EXPERIENCE_OPTIONS as unknown as FilterDropdownOption[]}
        onChange={() => {}}
        multiSelect
        selectedValues={filters.experience}
        onMultiChange={vals => setFilters(prev => ({ ...prev, experience: vals }))}
        openId={openDropdown}
        onOpenChange={setOpenDropdown}
        active={filters.experience.length > 0}
        width={widthOverride ?? 120}
      />

      <FilterDropdown
        id="employment"
        label="Employment"
        value=""
        options={EMPLOYMENT_OPTIONS as unknown as FilterDropdownOption[]}
        onChange={() => {}}
        multiSelect
        selectedValues={filters.employment}
        onMultiChange={vals => setFilters(prev => ({ ...prev, employment: vals }))}
        openId={openDropdown}
        onOpenChange={setOpenDropdown}
        active={filters.employment.length > 0}
        width={widthOverride ?? 120}
      />
    </>
  );
}

/**
 * Small boolean toggle button. Active → acid scheme (mirrors an active
 * FilterDropdown trigger, dot included); inactive → neutral trigger look.
 */
export function ToggleChip({
  label, active, onToggle,
}: { label: string; active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      style={{
        // Lighter than the dropdowns (10px vs their 10/28 chevron padding) so
        // chips read as secondary refinements, not primary selects.
        height: 34, padding: '0 10px', borderRadius: 8, fontSize: '0.76rem',
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
        whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit',
        border: active ? '1.5px solid var(--acid)' : '1px solid var(--border)',
        background: active ? 'var(--acid-soft)' : 'var(--bg-surface-2)',
        color: active ? 'var(--acid)' : 'var(--text-secondary)',
        fontWeight: active ? 600 : 400,
        transition: 'background 0.18s, border-color 0.18s, color 0.18s',
      }}
    >
      {active && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--acid)', flexShrink: 0 }} />}
      {label}
    </button>
  );
}

/** The three boolean job-attribute toggles: visa, relocation, has-salary. */
export function ToggleChips({ filters, setFilters }: ToggleProps) {
  return (
    <>
      <ToggleChip
        label="Visa sponsor"
        active={filters.visa}
        onToggle={() => setFilters(prev => ({ ...prev, visa: !prev.visa }))}
      />
      <ToggleChip
        label="Relocation"
        active={filters.relocation}
        onToggle={() => setFilters(prev => ({ ...prev, relocation: !prev.relocation }))}
      />
      <ToggleChip
        label="Has salary"
        active={filters.hasSalary}
        onToggle={() => setFilters(prev => ({ ...prev, hasSalary: !prev.hasSalary }))}
      />
    </>
  );
}

/**
 * Min/Max yearly-salary (EUR) inputs. Values are stored as strings; the hook
 * debounces the commit at 800ms. When `stretch` is set the pair fills its row
 * (used in the mobile sheet); otherwise each input is a compact 90px.
 */
export function SalaryRangeInputs({
  filters, setFilters, stretch = false,
}: ToggleProps & { stretch?: boolean }) {
  const base = {
    ...FILTER_CONTROL_STYLE,
    width: stretch ? '100%' : 90,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: stretch ? 1 : undefined }}>
      {/* Tiny group label so the two number fields don't read as orphaned.
          Hidden in the stretched mobile-sheet layout (it has its own heading). */}
      {!stretch && (
        <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
          Salary
        </span>
      )}
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={1000000}
        step={1000}
        value={filters.salaryMin}
        onChange={e => setFilters(prev => ({ ...prev, salaryMin: e.target.value }))}
        placeholder="Min €"
        aria-label="Minimum salary"
        style={{ ...base, borderColor: filters.salaryMin.trim() ? 'var(--acid)' : undefined }}
      />
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={1000000}
        step={1000}
        value={filters.salaryMax}
        onChange={e => setFilters(prev => ({ ...prev, salaryMax: e.target.value }))}
        placeholder="Max €"
        aria-label="Maximum salary"
        style={{ ...base, borderColor: filters.salaryMax.trim() ? 'var(--acid)' : undefined }}
      />
    </div>
  );
}