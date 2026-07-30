import { describe, expect, it } from 'vitest';

import type { Todo } from '../types';
import { countActive, countCompleted, filterTodos, selectVisibleTodos } from './selectors';

const todos: Todo[] = [
  { id: '1', text: 'first', completed: false },
  { id: '2', text: 'second', completed: true },
  { id: '3', text: 'third', completed: false },
];

describe('filterTodos', () => {
  it('returns everything for All', () => {
    expect(filterTodos(todos, 'All').map((todo) => todo.id)).toEqual(['1', '2', '3']);
  });

  it('returns only incomplete todos for Active', () => {
    expect(filterTodos(todos, 'Active').map((todo) => todo.id)).toEqual(['1', '3']);
  });

  it('returns only completed todos for Completed', () => {
    expect(filterTodos(todos, 'Completed').map((todo) => todo.id)).toEqual(['2']);
  });

  it('never returns the original array instance', () => {
    expect(filterTodos(todos, 'All')).not.toBe(todos);
  });
});

describe('counts', () => {
  it('counts active and completed todos', () => {
    expect(countActive(todos)).toBe(2);
    expect(countCompleted(todos)).toBe(1);
  });

  it('handles an empty list', () => {
    expect(countActive([])).toBe(0);
    expect(countCompleted([])).toBe(0);
  });
});

describe('selectVisibleTodos', () => {
  it('uses the filter from the state', () => {
    expect(selectVisibleTodos({ todos, filter: 'Completed' }).map((todo) => todo.id)).toEqual(['2']);
  });
});
