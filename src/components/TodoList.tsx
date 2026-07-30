import { useEffect, useState } from 'react';
import TodoItem, { getTodoText, type Todo } from './TodoItem';

export type { Todo };
export { getTodoText };

export interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  /** Optional message rendered next to the (empty) list. */
  emptyMessage?: string;
  /** Accessible name of the list element. */
  listLabel?: string;
}

export function TodoList({
  todos,
  onToggle,
  onUpdate,
  onDelete,
  emptyMessage,
  listLabel = 'Todos',
}: TodoListProps) {
  // Owning the edit target here guarantees at most one row is editable.
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (editingId !== null && !todos.some((todo) => todo.id === editingId)) {
      setEditingId(null);
    }
  }, [todos, editingId]);

  return (
    <>
      <ul className="todo-list" aria-label={listLabel}>
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            isEditing={editingId === todo.id}
            onEditStart={setEditingId}
            onEditEnd={() => setEditingId(null)}
            onToggle={onToggle}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </ul>
      {todos.length === 0 && emptyMessage ? (
        <p className="todo-list__empty">{emptyMessage}</p>
      ) : null}
    </>
  );
}

export default TodoList;
