import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FILTER,
  FILTERS,
  FILTER_LABELS,
  countTodos,
  filterTodos,
  isFilter,
} from './filterTodos';

interface TestTodo {
  id: string;
  title: string;
  completed: boolean;
}

const makeTodos = (): TestTodo[] => [
  { id: '1', title: 'Write the BRD', completed: false },
  { id: '2', title: 'Ship the filter bar', completed: true },
  { id: '3', title: 'Water the plants', completed: false },
  { id: '4', title: 'Archive old notes', completed: true },
];

const ids = (todos: readonly TestTodo[]): string[] => todos.map((todo) => todo.id);

describe('filterTodos', () => {
  it('returns every todo for the "all" filter', () => {
    const todos = makeTodos();

    expect(ids(filterTodos(todos, 'all'))).toEqual(['1', '2', '3', '4']);
  });

  it('returns only incomplete todos for the "active" filter', () => {
    const todos = makeTodos();
    const result = filterTodos(todos, 'active');

    expect(ids(result)).toEqual(['1', '3']);
    expect(result.every((todo) => !todo.completed)).toBe(true);
  });

  it('returns only completed todos for the "completed" filter', () => {
    const todos = makeTodos();
    const result = filterTodos(todos, 'completed');

    expect(ids(result)).toEqual(['2', '4']);
    expect(result.every((todo) => todo.completed)).toBe(true);
  });

  it('defaults to the "all" filter', () => {
    const todos = makeTodos();

    expect(ids(filterTodos(todos))).toEqual(ids(todos));
    expect(DEFAULT_FILTER).toBe('all');
  });

  it('handles an empty list for every filter', () => {
    for (const filter of FILTERS) {
      expect(filterTodos<TestTodo>([], filter)).toEqual([]);
    }
  });

  it('never mutates or removes the stored todos', () => {
    const todos = makeTodos();
    const snapshot = makeTodos();

    filterTodos(todos, 'active');
    filterTodos(todos, 'completed');
    filterTodos(todos, 'all');

    expect(todos).toEqual(snapshot);
    expect(todos).toHaveLength(4);
  });

  it('returns a new array rather than the source array', () => {
    const todos = makeTodos();

    for (const filter of FILTERS) {
      expect(filterTodos(todos, filter)).not.toBe(todos);
    }
  });

  it('keeps references to the original todo objects', () => {
    const todos = makeTodos();
    const [first] = filterTodos(todos, 'active');

    expect(first).toBe(todos[0]);
  });

  it('shows the full list again when switching back to "all"', () => {
    const todos = makeTodos();

    expect(ids(filterTodos(todos, 'completed'))).toEqual(['2', '4']);
    expect(ids(filterTodos(todos, 'active'))).toEqual(['1', '3']);
    expect(ids(filterTodos(todos, 'all'))).toEqual(['1', '2', '3', '4']);
  });

  it('drops a todo from the active view once it is toggled complete', () => {
    const todos = makeTodos();

    expect(ids(filterTodos(todos, 'active'))).toContain('1');

    // Toggling produces a new list (immutable update), as the store does.
    const toggled = todos.map((todo) =>
      todo.id === '1' ? { ...todo, completed: true } : todo,
    );

    expect(ids(filterTodos(toggled, 'active'))).not.toContain('1');
    expect(ids(filterTodos(toggled, 'completed'))).toContain('1');
    expect(ids(filterTodos(toggled, 'all'))).toEqual(['1', '2', '3', '4']);
  });

  it('falls back to returning everything for an unknown filter value', () => {
    const todos = makeTodos();

    // Simulate a bad value arriving from storage.
    expect(ids(filterTodos(todos, 'nope' as never))).toEqual(ids(todos));
  });
});

describe('isFilter', () => {
  it('accepts the supported filters', () => {
    expect(FILTERS.every((filter) => isFilter(filter))).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isFilter('done')).toBe(false);
    expect(isFilter('')).toBe(false);
    expect(isFilter(null)).toBe(false);
    expect(isFilter(undefined)).toBe(false);
    expect(isFilter(1)).toBe(false);
  });
});

describe('countTodos', () => {
  it('counts todos per filter without mutating the list', () => {
    const todos = makeTodos();

    expect(countTodos(todos)).toEqual({ all: 4, active: 2, completed: 2 });
    expect(todos).toEqual(makeTodos());
  });
});

describe('FILTER_LABELS', () => {
  it('provides a label for every filter', () => {
    expect(FILTERS.map((filter) => FILTER_LABELS[filter])).toEqual([
      'All',
      'Active',
      'Completed',
    ]);
  });
});
