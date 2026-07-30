import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { STORAGE_KEY, clearState, defaultState, loadState, parseState, saveState } from './storage';
import type { TodoState } from '../types';

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

type MemoryStorage = ReturnType<typeof createMemoryStorage>;

const sampleState: TodoState = {
  todos: [
    { id: 'a', text: 'Buy milk', completed: false },
    { id: 'b', text: 'Walk the dog', completed: true },
    { id: 'c', text: 'Buy milk', completed: false },
  ],
  filter: 'Active',
};

let storage: MemoryStorage;

beforeEach(() => {
  storage = createMemoryStorage();
  vi.stubGlobal('localStorage', storage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('defaultState', () => {
  it('is an empty list with the All filter', () => {
    expect(defaultState()).toEqual({ todos: [], filter: 'All' });
  });

  it('returns a fresh object every time', () => {
    const first = defaultState();
    first.todos.push({ id: 'x', text: 'mutated', completed: false });
    expect(defaultState().todos).toEqual([]);
  });
});

describe('saveState / loadState', () => {
  it('persists todos and filter under a single key', () => {
    saveState(sampleState);

    expect(Array.from(storage.data.keys())).toEqual([STORAGE_KEY]);
    expect(JSON.parse(storage.data.get(STORAGE_KEY) as string)).toEqual({
      todos: sampleState.todos,
      filter: 'Active',
    });
  });

  it('hydrates text, order, completed states and filter identically', () => {
    saveState(sampleState);

    const hydrated = loadState();

    expect(hydrated).toEqual(sampleState);
    expect(hydrated.todos.map((todo) => todo.text)).toEqual(['Buy milk', 'Walk the dog', 'Buy milk']);
    expect(hydrated.todos.map((todo) => todo.completed)).toEqual([false, true, false]);
    expect(hydrated.filter).toBe('Active');
  });

  it('overwrites the previous payload rather than appending keys', () => {
    saveState(sampleState);
    saveState({ todos: [], filter: 'Completed' });

    expect(storage.data.size).toBe(1);
    expect(loadState()).toEqual({ todos: [], filter: 'Completed' });
  });

  it('never throws when writing fails', () => {
    vi.stubGlobal('localStorage', {
      ...storage,
      setItem() {
        throw new Error('quota exceeded');
      },
    });

    expect(() => saveState(sampleState)).not.toThrow();
  });

  it('clears the persisted payload', () => {
    saveState(sampleState);
    clearState();

    expect(storage.data.size).toBe(0);
    expect(loadState()).toEqual(defaultState());
  });
});

describe('loadState hydration edge cases', () => {
  it('returns an empty list and the default filter when nothing is stored', () => {
    expect(loadState()).toEqual({ todos: [], filter: 'All' });
  });

  it('returns the default state when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined);

    expect(loadState()).toEqual({ todos: [], filter: 'All' });
  });

  it('returns the default state when reading throws', () => {
    vi.stubGlobal('localStorage', {
      ...storage,
      getItem() {
        throw new Error('blocked');
      },
    });

    expect(() => loadState()).not.toThrow();
    expect(loadState()).toEqual({ todos: [], filter: 'All' });
  });

  it.each([
    ['unparsable json', '{ this is not json'],
    ['empty string', ''],
    ['a json array', '[]'],
    ['a json primitive', '"nope"'],
    ['null', 'null'],
    ['a missing todos list', '{"filter":"All"}'],
    ['a non-array todos value', '{"todos":{},"filter":"All"}'],
    ['a todo without an id', '{"todos":[{"text":"x","completed":false}],"filter":"All"}'],
    ['a todo with a numeric id', '{"todos":[{"id":1,"text":"x","completed":false}],"filter":"All"}'],
    ['a todo without text', '{"todos":[{"id":"a","completed":false}],"filter":"All"}'],
    ['a todo with non-boolean completed', '{"todos":[{"id":"a","text":"x","completed":"yes"}]}'],
    ['a null todo entry', '{"todos":[null],"filter":"All"}'],
    ['duplicate ids', '{"todos":[{"id":"a","text":"x","completed":false},{"id":"a","text":"y","completed":false}]}'],
    ['an unknown filter', '{"todos":[],"filter":"Archived"}'],
  ])('yields an empty list for %s without crashing', (_label, raw) => {
    storage.data.set(STORAGE_KEY, raw as string);

    const hydrated = loadState();

    expect(hydrated.todos).toEqual([]);
    expect(hydrated.filter).toBe('All');
  });

  it('accepts a payload without a filter and falls back to All', () => {
    storage.data.set(STORAGE_KEY, '{"todos":[{"id":"a","text":"Keep me","completed":true}]}');

    expect(loadState()).toEqual({
      todos: [{ id: 'a', text: 'Keep me', completed: true }],
      filter: 'All',
    });
  });

  it('ignores unknown extra properties on todos', () => {
    storage.data.set(
      STORAGE_KEY,
      '{"todos":[{"id":"a","text":"Keep me","completed":false,"legacy":42}],"filter":"Completed"}',
    );

    expect(loadState()).toEqual({
      todos: [{ id: 'a', text: 'Keep me', completed: false }],
      filter: 'Completed',
    });
  });

  it('uses the provided fallback when hydration fails', () => {
    const fallback: TodoState = { todos: [], filter: 'Completed' };

    expect(loadState(fallback)).toBe(fallback);
  });
});

describe('parseState', () => {
  it('handles a null payload', () => {
    expect(parseState(null)).toEqual({ todos: [], filter: 'All' });
  });

  it('round-trips a serialised state', () => {
    expect(parseState(JSON.stringify(sampleState))).toEqual(sampleState);
  });
});
