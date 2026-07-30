/**
 * TodoStats — REQ-7
 *
 * Renders the "items left" counter for the todo list. The component is purely
 * derived from its props, so it re-renders with the correct value whenever the
 * owning list changes (add, toggle, delete).
 */

/** Minimal structural shape this component needs from a todo. */
export interface TodoStatsTodo {
  completed: boolean;
}

export interface TodoStatsProps {
  /** The full todo collection; completed entries are excluded from the count. */
  todos: readonly TodoStatsTodo[];
  /** Optional extra class name for layout tweaks by the parent. */
  className?: string;
}

/** Number of todos that are not yet completed. */
export function countRemaining(todos: readonly TodoStatsTodo[]): number {
  return todos.reduce((total, todo) => (todo.completed ? total : total + 1), 0);
}

/** `1 item left` (singular) vs `0 items left` / `2 items left` (plural). */
export function formatRemaining(count: number): string {
  return `${count} ${count === 1 ? 'item' : 'items'} left`;
}

export function TodoStats({ todos, className }: TodoStatsProps) {
  const remaining = countRemaining(todos);

  return (
    <p
      className={className ? `todo-stats ${className}` : 'todo-stats'}
      data-testid="todo-stats"
      data-remaining={remaining}
      role="status"
      aria-live="polite"
    >
      {formatRemaining(remaining)}
    </p>
  );
}

export default TodoStats;
