import { useCallback, useEffect, useMemo, useReducer } from 'react';

import { loadState, saveState } from '../lib/storage';
import type { Filter, Todo } from '../types';
import { countActive, countCompleted, filterTodos } from './selectors';
import { todoReducer, initialState } from './todoReducer';
import * as actions from './todoReducer';

export interface UseTodosResult {
  /** All todos, in insertion order. */
  todos: Todo[];
  /** Currently active filter. */
  filter: Filter;
  /** Todos matching the active filter. */
  visibleTodos: Todo[];
  /** Number of todos left to do. */
  activeCount: number;
  /** Number of completed todos. */
  completedCount: number;
  /** Adds a todo. Text is trimmed; empty/whitespace-only input is ignored. */
  addTodo: (text: string) => void;
  /** Flips the completed flag of a todo. */
  toggleTodo: (id: string) => void;
  /** Updates the text of a todo; empty/whitespace-only text deletes it. */
  editTodo: (id: string, text: string) => void;
  /** Removes a todo. */
  deleteTodo: (id: string) => void;
  /** Changes the active filter. */
  setFilter: (filter: Filter) => void;
}

/**
 * Owns the todo list state.
 *
 * State is hydrated from `localStorage` on mount and written back after every
 * mutation, so a reload restores text, order, completed states and the active
 * filter exactly.
 */
export function useTodos(): UseTodosResult {
  const [state, dispatch] = useReducer(todoReducer, initialState, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const addTodo = useCallback((text: string) => {
    dispatch(actions.addTodo(text));
  }, []);

  const toggleTodo = useCallback((id: string) => {
    dispatch(actions.toggleTodo(id));
  }, []);

  const editTodo = useCallback((id: string, text: string) => {
    dispatch(actions.editTodo(id, text));
  }, []);

  const deleteTodo = useCallback((id: string) => {
    dispatch(actions.deleteTodo(id));
  }, []);

  const setFilter = useCallback((filter: Filter) => {
    dispatch(actions.setFilter(filter));
  }, []);

  const visibleTodos = useMemo(() => filterTodos(state.todos, state.filter), [state.todos, state.filter]);
  const activeCount = useMemo(() => countActive(state.todos), [state.todos]);
  const completedCount = useMemo(() => countCompleted(state.todos), [state.todos]);

  return {
    todos: state.todos,
    filter: state.filter,
    visibleTodos,
    activeCount,
    completedCount,
    addTodo,
    toggleTodo,
    editTodo,
    deleteTodo,
    setFilter,
  };
}
