/**
 * @vitest-environment jsdom
 */
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import TodoList, { type Todo } from './TodoList';

afterEach(cleanup);

function makeTodos(): Todo[] {
  return [
    { id: 'a', title: 'One', completed: false },
    { id: 'b', title: 'Two', completed: false },
    { id: 'c', title: 'Three', completed: true },
  ];
}

/** Small stateful host so the presentational list can be exercised end to end. */
function Harness({ initial }: { initial: Todo[] }) {
  const [todos, setTodos] = useState<Todo[]>(initial);

  return (
    <TodoList
      todos={todos}
      onToggle={(id) =>
        setTodos((prev) =>
          prev.map((todo) =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo,
          ),
        )
      }
      onUpdate={(id, text) =>
        setTodos((prev) =>
          prev.map((todo) => (todo.id === id ? { ...todo, title: text } : todo)),
        )
      }
      onDelete={(id) => setTodos((prev) => prev.filter((todo) => todo.id !== id))}
    />
  );
}

function texts(): string[] {
  return screen.getAllByTestId('todo-text').map((node) => node.textContent ?? '');
}

function checkedStates(): boolean[] {
  return (screen.getAllByRole('checkbox') as HTMLInputElement[]).map((box) => box.checked);
}

describe('TodoList', () => {
  it('renders a list with exactly one item per todo, in order', () => {
    render(<Harness initial={makeTodos()} />);

    expect(screen.getByRole('list')).not.toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(texts()).toEqual(['One', 'Two', 'Three']);
  });

  it('renders an empty list (and optional message) when there are no todos', () => {
    render(
      <TodoList
        todos={[]}
        onToggle={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        emptyMessage="Nothing to do"
      />,
    );

    expect(screen.getByRole('list')).not.toBeNull();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.getByText('Nothing to do')).not.toBeNull();
  });

  it('toggles only the clicked todo and keeps the order stable', () => {
    render(<Harness initial={makeTodos()} />);

    expect(checkedStates()).toEqual([false, false, true]);

    fireEvent.click(screen.getByRole('checkbox', { name: /One/ }));

    expect(checkedStates()).toEqual([true, false, true]);
    expect(texts()).toEqual(['One', 'Two', 'Three']);

    // Clicking again returns it to incomplete, others still untouched.
    fireEvent.click(screen.getByRole('checkbox', { name: /One/ }));

    expect(checkedStates()).toEqual([false, false, true]);
    expect(texts()).toEqual(['One', 'Two', 'Three']);
  });

  it('keeps at most one todo in edit mode', () => {
    render(<Harness initial={makeTodos()} />);

    fireEvent.doubleClick(screen.getByText('One'));
    expect(screen.getAllByRole('textbox')).toHaveLength(1);

    fireEvent.doubleClick(screen.getByText('Two'));
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    expect(inputs).toHaveLength(1);
    expect(inputs[0].value).toBe('Two');
  });

  it('saves an edit with Enter for only the edited todo', () => {
    render(<Harness initial={makeTodos()} />);

    fireEvent.doubleClick(screen.getByText('Two'));
    const input = screen.getByTestId('todo-edit-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Two updated' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.queryByTestId('todo-edit-input')).toBeNull();
    expect(texts()).toEqual(['One', 'Two updated', 'Three']);
    expect(checkedStates()).toEqual([false, false, true]);
  });

  it('cancels an edit with Escape without changing any todo', () => {
    render(<Harness initial={makeTodos()} />);

    fireEvent.doubleClick(screen.getByText('Two'));
    const input = screen.getByTestId('todo-edit-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'discard me' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByTestId('todo-edit-input')).toBeNull();
    expect(texts()).toEqual(['One', 'Two', 'Three']);
    expect(checkedStates()).toEqual([false, false, true]);
  });

  it('deletes the todo when an edit is saved empty', () => {
    render(<Harness initial={makeTodos()} />);

    fireEvent.doubleClick(screen.getByText('Two'));
    const input = screen.getByTestId('todo-edit-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(texts()).toEqual(['One', 'Three']);
    expect(checkedStates()).toEqual([false, true]);
  });

  it('deletes only the row whose delete control was used', () => {
    render(<Harness initial={makeTodos()} />);

    fireEvent.click(screen.getByRole('button', { name: /Delete "Two"/ }));

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(texts()).toEqual(['One', 'Three']);
    expect(checkedStates()).toEqual([false, true]);

    fireEvent.click(screen.getByRole('button', { name: /Delete "One"/ }));

    expect(texts()).toEqual(['Three']);
    expect(checkedStates()).toEqual([true]);
  });
});
