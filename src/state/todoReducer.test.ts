import { describe, expect, it } from 'vitest';

import type { TodoState } from '../types';
import {
  addTodo,
  deleteTodo,
  editTodo,
  initialState,
  setFilter,
  todoReducer,
  toggleTodo,
} from './todoReducer';

/** Builds a state with one todo per text, using deterministic ids `id-1`, ... */
function stateWith(...texts: string[]): TodoState {
  return texts.reduce<TodoState>(
    (state, text, index) => todoReducer(state, addTodo(text, `id-${index + 1}`)),
    initialState,
  );
}

describe('initialState', () => {
  it('is an empty list with the All filter', () => {
    expect(initialState).toEqual({ todos: [], filter: 'All' });
  });
});

describe('addTodo', () => {
  it('appends todos, keeping insertion order', () => {
    const state = stateWith('first', 'second', 'third');

    expect(state.todos.map((todo) => todo.text)).toEqual(['first', 'second', 'third']);
  });

  it('creates todos that start out incomplete', () => {
    const state = stateWith('write tests');

    expect(state.todos[0]).toEqual({ id: 'id-1', text: 'write tests', completed: false });
  });

  it('trims surrounding whitespace', () => {
    const state = todoReducer(initialState, addTodo('   padded text \n', 'id-1'));

    expect(state.todos[0].text).toBe('padded text');
  });

  it.each(['', '   ', '\t', '\n  \t '])('rejects %j', (text) => {
    const state = todoReducer(initialState, addTodo(text));

    expect(state).toBe(initialState);
    expect(state.todos).toHaveLength(0);
  });

  it('allows duplicate texts with distinct ids', () => {
    const state = stateWith('Buy milk', 'Buy milk');

    expect(state.todos).toHaveLength(2);
    expect(state.todos[0].text).toBe(state.todos[1].text);
    expect(state.todos[0].id).not.toBe(state.todos[1].id);
  });

  it('generates unique ids when none is supplied', () => {
    let state = initialState;
    for (let i = 0; i < 25; i += 1) {
      state = todoReducer(state, addTodo('same text'));
    }

    const ids = state.todos.map((todo) => todo.id);
    expect(ids).toHaveLength(25);
    expect(new Set(ids).size).toBe(25);
    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
  });

  it('does not mutate the previous state', () => {
    const before = stateWith('one');
    const snapshot = JSON.parse(JSON.stringify(before)) as TodoState;

    todoReducer(before, addTodo('two', 'id-2'));

    expect(before).toEqual(snapshot);
  });

  it('keeps the active filter untouched', () => {
    const filtered = todoReducer(initialState, setFilter('Completed'));
    const next = todoReducer(filtered, addTodo('task', 'id-1'));

    expect(next.filter).toBe('Completed');
  });
});

describe('toggleTodo', () => {
  it('flips only the targeted todo', () => {
    const state = todoReducer(stateWith('a', 'b', 'c'), toggleTodo('id-2'));

    expect(state.todos.map((todo) => todo.completed)).toEqual([false, true, false]);
  });

  it('toggles back to incomplete', () => {
    const once = todoReducer(stateWith('a'), toggleTodo('id-1'));
    const twice = todoReducer(once, toggleTodo('id-1'));

    expect(twice.todos[0].completed).toBe(false);
  });

  it('preserves order and text', () => {
    const state = todoReducer(stateWith('a', 'b', 'c'), toggleTodo('id-1'));

    expect(state.todos.map((todo) => todo.text)).toEqual(['a', 'b', 'c']);
  });

  it('ignores unknown ids', () => {
    const before = stateWith('a');
    const after = todoReducer(before, toggleTodo('missing'));

    expect(after).toBe(before);
  });
});

describe('editTodo', () => {
  it('replaces the text of the targeted todo', () => {
    const state = todoReducer(stateWith('old', 'other'), editTodo('id-1', 'new'));

    expect(state.todos.map((todo) => todo.text)).toEqual(['new', 'other']);
  });

  it('trims the new text', () => {
    const state = todoReducer(stateWith('old'), editTodo('id-1', '  new text  '));

    expect(state.todos[0].text).toBe('new text');
  });

  it('keeps the completed state and the position', () => {
    const toggled = todoReducer(stateWith('a', 'b'), toggleTodo('id-2'));
    const state = todoReducer(toggled, editTodo('id-2', 'b renamed'));

    expect(state.todos[1]).toEqual({ id: 'id-2', text: 'b renamed', completed: true });
  });

  it.each(['', '   ', '\t\n'])('deletes the todo when the new text is %j', (text) => {
    const state = todoReducer(stateWith('a', 'b', 'c'), editTodo('id-2', text));

    expect(state.todos.map((todo) => todo.id)).toEqual(['id-1', 'id-3']);
  });

  it('ignores unknown ids', () => {
    const before = stateWith('a');

    expect(todoReducer(before, editTodo('missing', 'x'))).toBe(before);
    expect(todoReducer(before, editTodo('missing', ''))).toBe(before);
  });

  it('allows editing to a duplicate text', () => {
    const state = todoReducer(stateWith('a', 'b'), editTodo('id-2', 'a'));

    expect(state.todos.map((todo) => todo.text)).toEqual(['a', 'a']);
  });
});

describe('deleteTodo', () => {
  it('removes the todo and keeps the order of the rest', () => {
    const state = todoReducer(stateWith('a', 'b', 'c'), deleteTodo('id-1'));

    expect(state.todos.map((todo) => todo.text)).toEqual(['b', 'c']);
  });

  it('can empty the list', () => {
    const state = todoReducer(stateWith('only'), deleteTodo('id-1'));

    expect(state.todos).toEqual([]);
  });

  it('ignores unknown ids', () => {
    const before = stateWith('a');

    expect(todoReducer(before, deleteTodo('missing'))).toBe(before);
  });
});

describe('setFilter', () => {
  it.each(['All', 'Active', 'Completed'] as const)('sets the %s filter', (filter) => {
    const state = todoReducer(stateWith('a'), setFilter(filter));

    expect(state.filter).toBe(filter);
  });

  it('does not touch the todos', () => {
    const before = stateWith('a', 'b');
    const after = todoReducer(before, setFilter('Active'));

    expect(after.todos).toBe(before.todos);
  });

  it('is a no-op when the filter is unchanged', () => {
    const before = todoReducer(stateWith('a'), setFilter('Active'));

    expect(todoReducer(before, setFilter('Active'))).toBe(before);
  });
});

describe('unknown actions', () => {
  it('return the state unchanged', () => {
    const before = stateWith('a');

    // @ts-expect-error exercising the defensive default branch
    expect(todoReducer(before, { type: 'nope' })).toBe(before);
  });
});
