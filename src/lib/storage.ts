import { DEFAULT_FILTER, isFilter } from '../types';
import type { Todo, TodoState } from '../types';

/**
 * Single `localStorage` key holding the whole persisted state (todos + filter).
 */
export const STORAGE_KEY = 'react-todo-app.state.v1';

/**
 * Minimal structural description of the `localStorage` API we rely on. Using a
 * local interface keeps this module usable in non-DOM environments (such as a
 * plain Node test runner) where `Storage` is not declared.
 */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** A fresh, empty state using the default filter. */
export function defaultState(): TodoState {
  return { todos: [], filter: DEFAULT_FILTER };
}

/**
 * Returns the ambient storage, or `null` when it is unavailable (SSR, Node,
 * blocked cookies in private browsing mode, ...).
 */
function getStorage(): StorageLike | null {
  try {
    const storage = (globalThis as { localStorage?: StorageLike }).localStorage;
    if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') {
      return null;
    }
    return storage;
  } catch {
    // Accessing localStorage can throw in some hardened browser configurations.
    return null;
  }
}

function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.text === 'string' &&
    typeof candidate.completed === 'boolean'
  );
}

function hasUniqueIds(todos: readonly Todo[]): boolean {
  return new Set(todos.map((todo) => todo.id)).size === todos.length;
}

/**
 * Parses a raw persisted payload.
 *
 * Anything that is missing, unparsable or does not match the expected schema
 * yields `fallback` (an empty list with the default filter) instead of throwing.
 */
export function parseState(raw: string | null | undefined, fallback: TodoState = defaultState()): TodoState {
  if (raw == null || raw === '') return fallback;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return fallback;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return fallback;

  const candidate = parsed as { todos?: unknown; filter?: unknown };

  if (!Array.isArray(candidate.todos)) return fallback;
  if (!candidate.todos.every(isTodo)) return fallback;

  const todos = (candidate.todos as Todo[]).map((todo) => ({
    id: todo.id,
    text: todo.text,
    completed: todo.completed,
  }));
  if (!hasUniqueIds(todos)) return fallback;

  if (candidate.filter !== undefined && !isFilter(candidate.filter)) return fallback;
  const filter = isFilter(candidate.filter) ? candidate.filter : DEFAULT_FILTER;

  return { todos, filter };
}

/**
 * Reads the persisted state. Never throws: on any problem the `fallback`
 * (empty list, default filter) is returned.
 */
export function loadState(fallback: TodoState = defaultState()): TodoState {
  const storage = getStorage();
  if (!storage) return fallback;

  try {
    return parseState(storage.getItem(STORAGE_KEY), fallback);
  } catch {
    return fallback;
  }
}

/**
 * Writes todos and the active filter under {@link STORAGE_KEY}. Never throws
 * (a full or unavailable storage must not break the app).
 */
export function saveState(state: TodoState): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    const payload: TodoState = { todos: state.todos, filter: state.filter };
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota / private-mode write failures.
  }
}

/** Removes the persisted state, if any. Never throws. */
export function clearState(): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
