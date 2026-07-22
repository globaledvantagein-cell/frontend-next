'use client';

/**
 * Dashboard filter bar — three responsive variants (mobile/tablet/desktop)
 * + the mobile filter bottom sheet. Renders the shared filter dropdowns
 * from ./filters/jobFilterSelects.
 */
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from './ui';
import { FILTER_CONTROL_STYLE, type FilterState, type FilterDropdownOption } from '../hooks/useJobFilters';
import { SortSelect, FilterSelects, AttributeSelects, ToggleChips, SalaryRangeInputs } from './filters/jobFilterSelects';

// Thin visual separator between filter groups (dropdowns | toggles | salary).
const groupDivider = <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 2px', flexShrink: 0 }} />;

interface FilterBarProps {
  filters: FilterState;
  companyOptions: FilterDropdownOption[];
  categoryOptions: FilterDropdownOption[];
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  filteredCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  clearFilters: () => void;
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
  onOpenFilterSheet: () => void;
}

export function DashboardFilterBar({
  filters,
  setFilters,
  filteredCount,
  totalCount,
  hasActiveFilters,
  activeFilterCount,
  companyOptions,
  categoryOptions,
  clearFilters,
  openDropdown,
  setOpenDropdown,
  onOpenFilterSheet,
}: FilterBarProps) {
  const selectsProps = { filters, setFilters, companyOptions, categoryOptions, openDropdown, setOpenDropdown };
  const dropdownProps = { filters, setFilters, openDropdown, setOpenDropdown };
  const toggleProps = { filters, setFilters };

  const searchInput = (
    <div className="relative" style={{ flex: 1, minWidth: 0 }}>
      <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
      <Input
        value={filters.search}
        onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
        placeholder="Search jobs..."
        style={{ ...FILTER_CONTROL_STYLE, width: '100%', paddingLeft: 32, color: 'var(--text-secondary)', borderColor: filters.search.trim() ? 'var(--acid)' : undefined }}
      />
    </div>
  );

  const countLabel = (
    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
      {filteredCount} of {totalCount} jobs
    </span>
  );

  const clearAll = hasActiveFilters ? (
    <button
      onClick={clearFilters}
      style={{
        height: 34, paddingInline: 12, borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--bg-surface-2)',
        color: 'var(--text-muted)',
        fontSize: '0.74rem', fontWeight: 500,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
        whiteSpace: 'nowrap', flexShrink: 0,
        transition: 'border-color 0.18s, color 0.18s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.color = 'var(--danger)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
    >
      <X size={11} /> Clear all
    </button>
  ) : null;

  return (
    <>
      {/* Mobile */}
      <div className="filter-bar-mobile">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {searchInput}
            <button
              onClick={onOpenFilterSheet}
              style={{
                height: 34, paddingInline: 14, borderRadius: 999, border: '1px solid',
                borderColor: activeFilterCount > 0 ? 'var(--acid)' : 'var(--border)',
                background: activeFilterCount > 0 ? 'var(--acid-soft)' : 'var(--bg-surface-2)',
                color: activeFilterCount > 0 ? 'var(--acid)' : 'var(--text-secondary)',
                fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
              }}
            >
              <SlidersHorizontal size={13} />
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
          </div>
          {countLabel}
        </div>
      </div>

      {/* Tablet */}
      <div className="filter-bar-tablet">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {searchInput}
            <SortSelect {...selectsProps} width={120} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <FilterSelects {...selectsProps} />
            <AttributeSelects {...dropdownProps} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <ToggleChips {...toggleProps} />
            {groupDivider}
            <SalaryRangeInputs {...toggleProps} />
            <div style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              {countLabel}{clearAll}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="filter-bar-full">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Row 1 — search, sort, primary dropdowns, count/clear */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="relative" style={{ flex: 1, minWidth: 180, maxWidth: 300 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <Input
                value={filters.search}
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search jobs..."
                style={{ ...FILTER_CONTROL_STYLE, width: '100%', paddingLeft: 32, color: 'var(--text-secondary)', borderColor: filters.search.trim() ? 'var(--acid)' : undefined }}
              />
            </div>
            <SortSelect {...selectsProps} width={150} />
            <FilterSelects {...selectsProps} />
            <div style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              {countLabel}{clearAll}
            </div>
          </div>
          {/* Row 2 — attribute dropdowns | toggles | salary. Tighter gap (5 vs
              row 1's 6) marks it as the secondary refinement row. Wraps when narrow. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <AttributeSelects {...dropdownProps} />
            {groupDivider}
            <ToggleChips {...toggleProps} />
            {groupDivider}
            <SalaryRangeInputs {...toggleProps} />
          </div>
        </div>
      </div>
    </>
  );
}

// ── Mobile filter bottom sheet ──────────────────────────────────

interface MobileFilterSheetProps {
  companyOptions: FilterDropdownOption[];
  categoryOptions: FilterDropdownOption[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  filteredCount: number;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
  onClose: () => void;
}

export function MobileFilterSheet({
  filters,
  setFilters,
  filteredCount,
  hasActiveFilters,
  clearFilters,
  companyOptions,
  categoryOptions,
  openDropdown,
  setOpenDropdown,
  onClose,
}: MobileFilterSheetProps) {
  const selectsProps = { filters, setFilters, companyOptions, categoryOptions, openDropdown, setOpenDropdown };
  const dropdownProps = { filters, setFilters, openDropdown, setOpenDropdown };
  const toggleProps = { filters, setFilters };
  const sectionLabelStyle = { fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginTop: 4, marginBottom: 2 };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
      />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'var(--bg-surface)', borderRadius: '20px 20px 0 0',
        padding: '16px 16px calc(16px + env(safe-area-inset-bottom))',
        maxHeight: '80dvh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Filters</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>Sort by</div>
          <SortSelect {...selectsProps} width="100%" />
          <div style={sectionLabelStyle}>Filter by</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <FilterSelects {...selectsProps} widthOverride="100%" />
          </div>

          <div style={sectionLabelStyle}>More filters</div>
          {/* 1-column: the attribute labels are long and cramp in 2 columns */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <AttributeSelects {...dropdownProps} widthOverride="100%" />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <ToggleChips {...toggleProps} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <SalaryRangeInputs {...toggleProps} stretch />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {hasActiveFilters && (
            <button
              onClick={() => { clearFilters(); onClose(); }}
              style={{ flex: 1, height: 46, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', fontSize: '0.9rem', cursor: 'pointer' }}
            >
              Clear all
            </button>
          )}
          <button
            onClick={onClose}
            style={{ flex: 2, height: 46, borderRadius: 10, border: 'none', background: 'var(--acid)', color: '#000', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}
          >
            Show {filteredCount} results
          </button>
        </div>
      </div>
    </div>
  );
}