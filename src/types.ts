/**
 * Shared domain types for the todo application.
 *
 * These types describe the data that is persisted to `localStorage`, so keep
 * them JSON-serialisable.
 */

/** Available filters, in the order they are presented in the UI. */
export const FILTERS = ['All', 'Active', 'Completed'] as const;

/** A filter selecting which todos are visible. */
export type Filter = (typeof FILTERS)[number];

/** The filter used when nothing has been persisted yet. */
export const DEFAULT_FILTER: Filter = 'All';

/**
 * A single todo item.
 *
 * `id` is stable and unique for the lifetime of the item, so it can be used as
 * a React key and as the target of every mutating action.
 */
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

/** The complete application state that is persisted between sessions. */
export interface TodoState {
  /** Todos in insertion order: the oldest todo first, newest last. */
  todos: Todo[];
  /** The currently active filter. */
  filter: Filter;
}

/** Runtime type guard for {@link Filter}. */
export function isFilter(value: unknown): value is Filter {
  return typeof value === 'string' && (FILTERS as readonly string[]).includes(value);
}
