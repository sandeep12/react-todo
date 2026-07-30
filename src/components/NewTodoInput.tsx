import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

export interface NewTodoInputProps {
  /**
   * Called once per successful submit with the trimmed, non-empty text of the
   * new todo. The owner of the list is responsible for appending the new item
   * to the bottom of the list.
   */
  onAdd: (text: string) => void;
  /** Visible, accessible label for the text field. */
  label?: string;
  /** Placeholder shown while the field is empty. */
  placeholder?: string;
  /** Focus the field when it first mounts. */
  autoFocus?: boolean;
}

/**
 * REQ-1 — add flow.
 *
 * A single-line text field wrapped in a form so that pressing Enter submits.
 * Empty / whitespace-only input is rejected without emitting anything; on a
 * successful add the field is cleared and keeps keyboard focus so several
 * todos can be typed in a row.
 */
export function NewTodoInput({
  onAdd,
  label = 'New todo',
  placeholder = 'What needs to be done?',
  autoFocus = false,
}: NewTodoInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = text.trim();
    if (trimmed.length === 0) {
      // Nothing to add: keep whatever the user typed and stay focused.
      inputRef.current?.focus();
      return;
    }

    onAdd(trimmed);
    setText('');
    inputRef.current?.focus();
  };

  return (
    <form className="new-todo-form" onSubmit={handleSubmit}>
      <label className="new-todo-label" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        ref={inputRef}
        className="new-todo-input"
        type="text"
        name="newTodo"
        value={text}
        placeholder={placeholder}
        autoComplete="off"
        onChange={handleChange}
      />
      <button className="new-todo-submit" type="submit">
        Add
      </button>
    </form>
  );
}

export default NewTodoInput;
