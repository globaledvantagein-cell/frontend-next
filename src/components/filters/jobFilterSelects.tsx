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
  type IFacetCounts,
} from '../../hooks/jobFilterTypes';

// Append "(N)" to each option label when live facet counts are available.
// Counts are unfiltered totals — users see what's out there before clicking.
function withCounts(
  options: readonly { value: string; label: string }[],
  counts?: Record<string, number>,
): FilterDropdownOption[] {
  if (!counts) return options as unknown as FilterDropdownOption[];
  return options.map(o => ({ ...o, label: `${o.label} (${counts[o.value] ?? 0})` }));
}

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
  filters, setFilters, openDropdown, setOpenDropdown, widthOverride, facetCounts,
}: DropdownProps & { widthOverride?: number | string; facetCounts?: IFacetCounts | null }) {
  return (
    <>
      <FilterDropdown
        id="workplace"
        label="Workplace"
        value=""
        options={withCounts(WORKPLACE_OPTIONS, facetCounts?.workplace)}
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
        options={withCounts(EXPERIENCE_OPTIONS, facetCounts?.experience)}
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
        options={withCounts(EMPLOYMENT_OPTIONS, facetCounts?.employment)}
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
  label, active, onToggle, count,
}: { label: string; active: boolean; onToggle: () => void; count?: number }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className="filter-pill"
      style={{
        // Dim (but keep clickable) when we know the count is zero.
        opacity: count === 0 && !active ? 0.5 : 1,
        height: 34, padding: '0 12px', fontSize: '0.76rem',
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
        whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit',
        border: active ? '1.5px solid var(--acid)' : '1px solid var(--border)',
        background: active ? 'var(--acid-soft)' : 'var(--bg-surface-2)',
        color: active ? 'var(--acid)' : 'var(--text-secondary)',
        fontWeight: active ? 600 : 400,
      }}
    >
      {active && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--acid)', flexShrink: 0 }} />}
      {label}
      {count != null && (
        <span style={{ fontSize: '0.68rem', color: active ? 'var(--acid)' : 'var(--text-muted)', fontWeight: 400 }}>
          {count}
        </span>
      )}
    </button>
  );
}

/** The three boolean job-attribute toggles: visa, relocation, has-salary. */
export function ToggleChips({ filters, setFilters, facetCounts }: ToggleProps & { facetCounts?: IFacetCounts | null }) {
  return (
    <>
      <ToggleChip
        label="Visa sponsor"
        active={filters.visa}
        count={facetCounts?.visa.available}
        onToggle={() => setFilters(prev => ({ ...prev, visa: !prev.visa }))}
      />
      <ToggleChip
        label="Relocation"
        active={filters.relocation}
        count={facetCounts?.relocation.available}
        onToggle={() => setFilters(prev => ({ ...prev, relocation: !prev.relocation }))}
      />
      <ToggleChip
        label="Has salary"
        active={filters.hasSalary}
        count={facetCounts?.hasSalary.count}
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
// type=number still accepts 'e', 'E', '+', '-' (valid scientific/sign chars) —
// meaningless for a salary, so block them at the keystroke.
function blockNonNumericKeys(e: React.KeyboardEvent<HTMLInputElement>) {
  if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
}

export function SalaryRangeInputs({
  filters, setFilters, stretch = false,
}: ToggleProps & { stretch?: boolean }) {
  const min = parseInt(filters.salaryMin, 10);
  const max = parseInt(filters.salaryMax, 10);
  // min>max is silently dropped by the API — surface it instead of confusing
  // the user with "nothing changed".
  const invalidRange = Number.isFinite(min) && Number.isFinite(max) && min > max;
  const active = filters.salaryMin.trim() !== '' || filters.salaryMax.trim() !== '';

  const inputStyle: React.CSSProperties = {
    ...FILTER_CONTROL_STYLE,
    border: 'none', background: 'transparent', height: 30,
    width: stretch ? '100%' : 74, padding: '0 6px',
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
  };

  return (
    // One bordered group so Min/Max read as a single "salary range" control,
    // not two orphaned number fields. Border echoes the active/invalid state.
    <div
      className="filter-pill"
      title={invalidRange ? 'Min salary is higher than max — this range is ignored' : 'Yearly salary range (EUR)'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 0,
        height: 34, paddingInline: 10,
        flex: stretch ? 1 : undefined, flexShrink: 0,
        border: invalidRange ? '1.5px solid var(--danger)' : active ? '1.5px solid var(--acid)' : '1px solid var(--border)',
        background: active && !invalidRange ? 'var(--acid-soft)' : 'var(--bg-surface-2)',
        transition: 'border-color 0.18s, background 0.18s',
      }}
    >
      <span style={{ fontSize: '0.76rem', color: invalidRange ? 'var(--danger)' : active ? 'var(--acid)' : 'var(--text-muted)', flexShrink: 0 }}>€</span>
      <input
        type="number" inputMode="numeric" min={0} max={1000000} step={1000}
        value={filters.salaryMin}
        onChange={e => setFilters(prev => ({ ...prev, salaryMin: e.target.value }))}
        onKeyDown={blockNonNumericKeys}
        placeholder="Min" aria-label="Minimum yearly salary" aria-invalid={invalidRange}
        style={inputStyle}
      />
      <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem', flexShrink: 0 }}>–</span>
      <input
        type="number" inputMode="numeric" min={0} max={1000000} step={1000}
        value={filters.salaryMax}
        onChange={e => setFilters(prev => ({ ...prev, salaryMax: e.target.value }))}
        onKeyDown={blockNonNumericKeys}
        placeholder="Max" aria-label="Maximum yearly salary" aria-invalid={invalidRange}
        style={inputStyle}
      />
    </div>
  );
}