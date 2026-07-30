import { DEFAULT_FILTER } from '../types';
import type { Filter, Todo, TodoState } from '../types';
import { createId } from './createId';

/** State used before anything has been hydrated from storage. */
export const initialState: TodoState = { todos: [], filter: DEFAULT_FILTER };

export type TodoAction =
  | { type: 'addTodo'; payload: { text: string; id?: string } }
  | { type: 'toggleTodo'; payload: { id: string } }
  | { type: 'editTodo'; payload: { id: string; text: string } }
  | { type: 'deleteTodo'; payload: { id: string } }
  | { type: 'setFilter'; payload: { filter: Filter } };

/**
 * Adds a todo to the end of the list. `id` is only meant for tests and
 * migrations; production code lets the reducer generate one.
 */
export function addTodo(text: string, id?: string): TodoAction {
  return { type: 'addTodo', payload: { text, id } };
}

export function toggleTodo(id: string): TodoAction {
  return { type: 'toggleTodo', payload: { id } };
}

/** Edits a todo. An empty or whitespace-only text deletes the todo. */
export function editTodo(id: string, text: string): TodoAction {
  return { type: 'editTodo', payload: { id, text } };
}

export function deleteTodo(id: string): TodoAction {
  return { type: 'deleteTodo', payload: { id } };
}

export function setFilter(filter: Filter): TodoAction {
  return { type: 'setFilter', payload: { filter } };
}

function removeTodo(state: TodoState, id: string): TodoState {
  const todos = state.todos.filter((todo) => todo.id !== id);
  if (todos.length === state.todos.length) return state;
  return { ...state, todos };
}

/**
 * Pure reducer for the todo list. Insertion order is preserved: new todos are
 * appended and no action ever re-orders the list.
 */
export function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'addTodo': {
      const text = action.payload.text.trim();
      // Empty / whitespace-only input is rejected. Duplicate texts are allowed.
      if (text.length === 0) return state;

      const todo: Todo = {
        id: action.payload.id ?? createId(),
        text,
        completed: false,
      };
      return { ...state, todos: [...state.todos, todo] };
    }

    case 'toggleTodo': {
      let found = false;
      const todos = state.todos.map((todo) => {
        if (todo.id !== action.payload.id) return todo;
        found = true;
        return { ...todo, completed: !todo.completed };
      });
      if (!found) return state;
      return { ...state, todos };
    }

    case 'editTodo': {
      const text = action.payload.text.trim();
      if (text.length === 0) {
        // Clearing the text of a todo deletes it.
        return removeTodo(state, action.payload.id);
      }

      let changed = false;
      const todos = state.todos.map((todo) => {
        if (todo.id !== action.payload.id) return todo;
        if (todo.text === text) return todo;
        changed = true;
        return { ...todo, text };
      });
      if (!changed) return state;
      return { ...state, todos };
    }

    case 'deleteTodo':
      return removeTodo(state, action.payload.id);

    case 'setFilter': {
      if (state.filter === action.payload.filter) return state;
      return { ...state, filter: action.payload.filter };
    }

    default:
      return state;
  }
}
