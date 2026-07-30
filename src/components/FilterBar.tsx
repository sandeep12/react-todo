import { FILTERS, FILTER_LABELS, type Filter } from '../lib/filterTodos';

export interface FilterBarProps {
  /** The currently selected filter. */
  filter: Filter;
  /** Called with the newly selected filter when a control is activated. */
  onFilterChange: (filter: Filter) => void;
  /** Optional accessible name for the group of controls. */
  label?: string;
  /** Optional extra class name for the wrapper element. */
  className?: string;
}

/**
 * REQ-6: All / Active / Completed status filter controls.
 *
 * Native `<button>` elements are used so the controls are Tab-reachable and
 * activatable with Enter and Space for free, and each one exposes its state
 * through `aria-pressed` (plus `aria-current` on the selected control).
 */
export function FilterBar({
  filter,
  onFilterChange,
  label = 'Filter todos',
  className,
}: FilterBarProps) {
  return (
    <div
      className={className ? `filter-bar ${className}` : 'filter-bar'}
      role="group"
      aria-label={label}
      data-testid="filter-bar"
    >
      {FILTERS.map((option) => {
        const selected = option === filter;

        return (
          <button
            key={option}
            type="button"
            className={
              selected ? 'filter-bar__button is-selected' : 'filter-bar__button'
            }
            data-filter={option}
            aria-pressed={selected}
            aria-current={selected ? 'true' : undefined}
            onClick={() => onFilterChange(option)}
          >
            {FILTER_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}

export default FilterBar;
