/**
 * REQ-6: status filtering (All / Active / Completed).
 *
 * `filterTodos` is a pure helper: it never mutates the list it is given and
 * never mutates the todos themselves. It always returns a *new* array that
 * holds references to the original todo objects, so switching back to "all"
 * always shows the complete, untouched list.
 */

/** The three supported status filters. */
export type Filter = 'all' | 'active' | 'completed';

/** Stable, display order of the available filters. */
export const FILTERS: readonly Filter[] = ['all', 'active', 'completed'];

/** Human readable (accessible) label for each filter. */
export const FILTER_LABELS: Readonly<Record<Filter, string>> = {
  all: 'All',
  active: 'Active',
  completed: 'Completed',
};

/** The filter used when nothing else has been selected. */
export const DEFAULT_FILTER: Filter = 'all';

/**
 * Minimal shape a todo needs for filtering. Using a structural type keeps this
 * helper decoupled from the full todo model.
 */
export interface FilterableTodo {
  completed: boolean;
}

/** Runtime type guard, handy when reading a filter from storage or the URL. */
export function isFilter(value: unknown): value is Filter {
  return typeof value === 'string' && (FILTERS as readonly string[]).includes(value);
}

/**
 * Returns the todos that match the given filter.
 *
 * - `all` -> every todo (in the original order)
 * - `active` -> only todos that are not completed
 * - `completed` -> only todos that are completed
 *
 * The source array and its items are left untouched.
 */
export function filterTodos<T extends FilterableTodo>(
  todos: readonly T[],
  filter: Filter = DEFAULT_FILTER,
): T[] {
  switch (filter) {
    case 'active':
      return todos.filter((todo) => !todo.completed);
    case 'completed':
      return todos.filter((todo) => todo.completed);
    case 'all':
    default:
      return todos.slice();
  }
}

/** Convenience counts per filter, useful for labels/badges. */
export function countTodos<T extends FilterableTodo>(
  todos: readonly T[],
): Record<Filter, number> {
  const completed = todos.reduce((total, todo) => (todo.completed ? total + 1 : total), 0);
  return {
    all: todos.length,
    active: todos.length - completed,
    completed,
  };
}

export default filterTodos;
