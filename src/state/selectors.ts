import type { Filter, Todo, TodoState } from '../types';

/** Returns the todos visible under the given filter, keeping insertion order. */
export function filterTodos(todos: readonly Todo[], filter: Filter): Todo[] {
  switch (filter) {
    case 'Active':
      return todos.filter((todo) => !todo.completed);
    case 'Completed':
      return todos.filter((todo) => todo.completed);
    case 'All':
    default:
      return [...todos];
  }
}

/** Number of todos that are not completed. */
export function countActive(todos: readonly Todo[]): number {
  return todos.reduce((count, todo) => (todo.completed ? count : count + 1), 0);
}

/** Number of completed todos. */
export function countCompleted(todos: readonly Todo[]): number {
  return todos.length - countActive(todos);
}

/** Convenience selector for the todos visible for the current state. */
export function selectVisibleTodos(state: TodoState): Todo[] {
  return filterTodos(state.todos, state.filter);
}
