/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import TodoItem, { type Todo } from './TodoItem';

afterEach(cleanup);

const baseTodo: Todo = { id: 't1', title: 'Buy milk', completed: false };

function setup(overrides: Partial<Todo> = {}) {
  const onToggle = vi.fn();
  const onUpdate = vi.fn();
  const onDelete = vi.fn();
  const todo: Todo = { ...baseTodo, ...overrides };

  render(
    <ul>
      <TodoItem
        todo={todo}
        onToggle={onToggle}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </ul>,
  );

  return { todo, onToggle, onUpdate, onDelete };
}

function enterEditMode() {
  fireEvent.doubleClick(screen.getByTestId('todo-text'));
  return screen.getByTestId('todo-edit-input') as HTMLInputElement;
}

describe('TodoItem', () => {
  it('renders the todo as a list item with a checkbox reflecting incomplete state', () => {
    setup();

    const item = screen.getByRole('listitem');
    expect(item).not.toBeNull();
    expect(screen.getByTestId('todo-text').textContent).toBe('Buy milk');

    const checkbox = screen.getByRole('checkbox', { name: /Buy milk/ }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    expect(item.getAttribute('data-completed')).toBe('false');
  });

  it('visually distinguishes completed todos and checks the checkbox', () => {
    setup({ completed: true });

    const item = screen.getByRole('listitem');
    const checkbox = screen.getByRole('checkbox', { name: /Buy milk/ }) as HTMLInputElement;

    expect(checkbox.checked).toBe(true);
    expect(item.className).toContain('completed');
    expect(item.getAttribute('data-completed')).toBe('true');
    expect(screen.getByTestId('todo-text').style.textDecoration).toContain('line-through');
  });

  it('calls onToggle with the todo id when the checkbox is clicked', () => {
    const { onToggle, onUpdate, onDelete } = setup();

    fireEvent.click(screen.getByRole('checkbox', { name: /Buy milk/ }));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith('t1');
    expect(onUpdate).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('swaps the text for an input pre-filled with the current text on double click', () => {
    setup();

    const input = enterEditMode();

    expect(input.value).toBe('Buy milk');
    expect(screen.queryByTestId('todo-text')).toBeNull();
    expect(screen.getByRole('listitem').getAttribute('data-editing')).toBe('true');
  });

  it('also enters edit mode through the explicit edit button', () => {
    setup();

    fireEvent.click(screen.getByRole('button', { name: /Edit "Buy milk"/ }));

    const input = screen.getByTestId('todo-edit-input') as HTMLInputElement;
    expect(input.value).toBe('Buy milk');
  });

  it('saves the edited text on Enter and exits edit mode', () => {
    const { onUpdate, onDelete } = setup();

    const input = enterEditMode();
    fireEvent.change(input, { target: { value: '  Buy oat milk  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith('t1', 'Buy oat milk');
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByTestId('todo-edit-input')).toBeNull();
    expect(screen.getByTestId('todo-text').textContent).toBe('Buy milk');
  });

  it('cancels editing on Escape leaving the original text unchanged', () => {
    const { onUpdate, onDelete } = setup();

    const input = enterEditMode();
    fireEvent.change(input, { target: { value: 'Something else' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onUpdate).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByTestId('todo-edit-input')).toBeNull();
    expect(screen.getByTestId('todo-text').textContent).toBe('Buy milk');

    // Re-entering edit mode shows the original text again, not the discarded draft.
    expect(enterEditMode().value).toBe('Buy milk');
  });

  it('deletes the todo when an empty or whitespace-only value is saved', () => {
    const { onUpdate, onDelete } = setup();

    const input = enterEditMode();
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith('t1');
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('removes the todo immediately through the delete control', () => {
    const { onDelete, onToggle, onUpdate } = setup();

    fireEvent.click(screen.getByRole('button', { name: /Delete "Buy milk"/ }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith('t1');
    expect(onToggle).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('gives every control an accessible name and keyboard reachability', () => {
    setup();

    const checkbox = screen.getByRole('checkbox', { name: /Buy milk/ });
    const editButton = screen.getByRole('button', { name: /Edit "Buy milk"/ });
    const deleteButton = screen.getByRole('button', { name: /Delete "Buy milk"/ });

    // Native input/button elements are Tab-reachable and activated by Enter/Space.
    expect(checkbox.tagName).toBe('INPUT');
    expect(editButton.tagName).toBe('BUTTON');
    expect(deleteButton.tagName).toBe('BUTTON');

    for (const element of [checkbox, editButton, deleteButton]) {
      expect(element.getAttribute('tabindex')).not.toBe('-1');
      expect(element.hasAttribute('disabled')).toBe(false);
      (element as HTMLElement).focus();
      expect(document.activeElement).toBe(element);
    }

    const input = enterEditMode();
    expect(screen.getByRole('textbox', { name: /Edit "Buy milk"/ })).toBe(input);
    input.focus();
    expect(document.activeElement).toBe(input);
  });

  it('supports todos that carry their label in `text`', () => {
    render(
      <ul>
        <TodoItem
          todo={{ id: 't9', text: 'Water plants', completed: false }}
          onToggle={vi.fn()}
          onUpdate={vi.fn()}
          onDelete={vi.fn()}
        />
      </ul>,
    );

    expect(screen.getByTestId('todo-text').textContent).toBe('Water plants');
    expect(screen.getByRole('checkbox', { name: /Water plants/ })).not.toBeNull();
  });
});
