import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { STORAGE_KEY, loadState, saveState } from '../lib/storage';
import type { TodoState } from '../types';
import { addTodo, editTodo, initialState, setFilter, todoReducer, toggleTodo } from './todoReducer';

function createMemoryStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem(key: string): string | null {
      return data.has(key) ? (data.get(key) as string) : null;
    },
    setItem(key: string, value: string): void {
      data.set(key, String(value));
    },
    removeItem(key: string): void {
      data.delete(key);
    },
    clear(): void {
      data.clear();
    },
    key(index: number): string | null {
      return Array.from(data.keys())[index] ?? null;
    },
    get length(): number {
      return data.size;
    },
  };
}

let storage: ReturnType<typeof createMemoryStorage>;

/** Mimics the hook: reduce, then persist. */
function dispatchAll(actions: Parameters<typeof todoReducer>[1][]): TodoState {
  let state = loadState(initialState);
  for (const action of actions) {
    state = todoReducer(state, action);
    saveState(state);
  }
  return state;
}

beforeEach(() => {
  storage = createMemoryStorage();
  vi.stubGlobal('localStorage', storage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('reducer + storage round trip', () => {
  it('rehydrates text, order, completed states and the filter identically', () => {
    const state = dispatchAll([
      addTodo('Buy milk', 'a'),
      addTodo('Walk the dog', 'b'),
      addTodo('Buy milk', 'c'),
      toggleTodo('b'),
      editTodo('c', '  Buy bread  '),
      setFilter('Active'),
    ]);

    const reloaded = loadState(initialState);

    expect(reloaded).toEqual(state);
    expect(reloaded.todos).toEqual([
      { id: 'a', text: 'Buy milk', completed: false },
      { id: 'b', text: 'Walk the dog', completed: true },
      { id: 'c', text: 'Buy bread', completed: false },
    ]);
    expect(reloaded.filter).toBe('Active');
  });

  it('persists after every mutation under a single key', () => {
    dispatchAll([addTodo('one', 'a')]);
    expect(storage.data.size).toBe(1);
    expect(loadState().todos.map((todo) => todo.text)).toEqual(['one']);

    dispatchAll([addTodo('two', 'b')]);
    expect(storage.data.size).toBe(1);
    expect(loadState().todos.map((todo) => todo.text)).toEqual(['one', 'two']);

    dispatchAll([toggleTodo('a')]);
    expect(loadState().todos[0].completed).toBe(true);

    dispatchAll([editTodo('b', '')]);
    expect(loadState().todos.map((todo) => todo.id)).toEqual(['a']);

    dispatchAll([setFilter('Completed')]);
    expect(loadState().filter).toBe('Completed');
    expect(Array.from(storage.data.keys())).toEqual([STORAGE_KEY]);
  });

  it('starts from an empty list and the All filter when nothing is stored', () => {
    expect(loadState(initialState)).toEqual({ todos: [], filter: 'All' });
  });

  it('starts from an empty list when the stored payload is corrupt', () => {
    storage.data.set(STORAGE_KEY, '{"todos": [ {"id": ');

    const state = loadState(initialState);

    expect(state).toEqual({ todos: [], filter: 'All' });

    // ...and the app keeps working from there.
    const next = todoReducer(state, addTodo('fresh start', 'a'));
    saveState(next);
    expect(loadState(initialState)).toEqual(next);
  });
});
