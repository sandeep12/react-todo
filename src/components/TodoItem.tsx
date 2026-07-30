import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';

/**
 * Shape of a single todo as consumed by the list UI.
 *
 * The label is accepted as either `title` or `text` so the component works with
 * whichever naming the rest of the app settles on.
 */
export interface Todo {
  id: string;
  title?: string;
  text?: string;
  completed: boolean;
}

/** Resolve the visible label of a todo. */
export function getTodoText(todo: Todo): string {
  return todo.title ?? todo.text ?? '';
}

export interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  /**
   * When provided the parent owns edit mode, which is how the list guarantees
   * that at most one row is editable at a time. When omitted the row manages
   * its own edit state.
   */
  isEditing?: boolean;
  onEditStart?: (id: string) => void;
  onEditEnd?: (id: string) => void;
}

export function TodoItem({
  todo,
  onToggle,
  onUpdate,
  onDelete,
  isEditing,
  onEditStart,
  onEditEnd,
}: TodoItemProps) {
  const text = getTodoText(todo);
  const controlled = isEditing !== undefined;

  const [internalEditing, setInternalEditing] = useState(false);
  const editing = controlled ? Boolean(isEditing) : internalEditing;

  const [draft, setDraft] = useState(text);
  const inputRef = useRef<HTMLInputElement | null>(null);
  /** Guards against committing twice (e.g. Enter followed by a blur). */
  const finishedRef = useRef(false);

  useEffect(() => {
    if (editing) {
      setDraft(text);
      finishedRef.current = false;
    }
  }, [editing, text]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startEditing = () => {
    setDraft(text);
    finishedRef.current = false;
    if (!controlled) {
      setInternalEditing(true);
    }
    onEditStart?.(todo.id);
  };

  const leaveEditMode = () => {
    finishedRef.current = true;
    if (!controlled) {
      setInternalEditing(false);
    }
    onEditEnd?.(todo.id);
  };

  const commit = () => {
    if (finishedRef.current) {
      return;
    }
    const next = draft.trim();
    leaveEditMode();
    if (next === '') {
      // Saving an empty value removes the todo.
      onDelete(todo.id);
      return;
    }
    onUpdate(todo.id, next);
  };

  const cancel = () => {
    if (finishedRef.current) {
      return;
    }
    setDraft(text);
    leaveEditMode();
  };

  const handleDraftChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
    }
  };

  const toggleLabel = todo.completed
    ? `Mark "${text}" as not completed`
    : `Mark "${text}" as completed`;

  const className = [
    'todo-item',
    todo.completed ? 'todo-item--completed completed' : '',
    editing ? 'todo-item--editing editing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li
      className={className}
      data-completed={todo.completed ? 'true' : 'false'}
      data-editing={editing ? 'true' : 'false'}
      data-testid={`todo-item-${todo.id}`}
    >
      <input
        type="checkbox"
        className="todo-item__toggle"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        aria-label={toggleLabel}
      />

      {editing ? (
        <input
          ref={inputRef}
          type="text"
          className="todo-item__edit"
          data-testid="todo-edit-input"
          value={draft}
          aria-label={`Edit "${text}"`}
          onChange={handleDraftChange}
          onKeyDown={handleKeyDown}
          onBlur={commit}
        />
      ) : (
        <>
          <span
            className="todo-item__text"
            data-testid="todo-text"
            style={todo.completed ? { textDecoration: 'line-through' } : undefined}
            title="Double-click to edit"
            onDoubleClick={startEditing}
          >
            {text}
          </span>
          <button
            type="button"
            className="todo-item__edit-button"
            aria-label={`Edit "${text}"`}
            onClick={startEditing}
          >
            Edit
          </button>
        </>
      )}

      <button
        type="button"
        className="todo-item__delete"
        aria-label={`Delete "${text}"`}
        onClick={() => onDelete(todo.id)}
      >
        Delete
      </button>
    </li>
  );
}

export default TodoItem;
