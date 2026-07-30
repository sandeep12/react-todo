import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { TodoStats, countRemaining, formatRemaining } from './TodoStats';

afterEach(() => {
  cleanup();
});

const makeTodo = (id: string, completed = false) => ({
  id,
  title: `Todo ${id}`,
  completed,
});

describe('formatRemaining', () => {
  it('uses the singular noun for exactly one remaining item', () => {
    expect(formatRemaining(1)).toBe('1 item left');
  });

  it('uses the plural noun for zero remaining items', () => {
    expect(formatRemaining(0)).toBe('0 items left');
  });

  it('uses the plural noun for more than one remaining item', () => {
    expect(formatRemaining(2)).toBe('2 items left');
    expect(formatRemaining(11)).toBe('11 items left');
  });
});

describe('countRemaining', () => {
  it('returns 0 for an empty list', () => {
    expect(countRemaining([])).toBe(0);
  });

  it('ignores completed todos', () => {
    expect(
      countRemaining([makeTodo('1'), makeTodo('2', true), makeTodo('3')]),
    ).toBe(2);
  });

  it('returns 0 when everything is completed', () => {
    expect(countRemaining([makeTodo('1', true), makeTodo('2', true)])).toBe(0);
  });
});

describe('<TodoStats />', () => {
  it('renders "0 items left" when there are no todos', () => {
    render(<TodoStats todos={[]} />);

    expect(screen.getByTestId('todo-stats').textContent).toBe('0 items left');
    expect(screen.getByText('0 items left')).toBeTruthy();
  });

  it('renders the singular label for a single incomplete todo', () => {
    render(<TodoStats todos={[makeTodo('1')]} />);

    expect(screen.getByTestId('todo-stats').textContent).toBe('1 item left');
  });

  it('counts only the incomplete todos', () => {
    render(
      <TodoStats
        todos={[makeTodo('1'), makeTodo('2', true), makeTodo('3')]}
      />,
    );

    expect(screen.getByTestId('todo-stats').textContent).toBe('2 items left');
    expect(screen.getByTestId('todo-stats').getAttribute('data-remaining')).toBe(
      '2',
    );
  });

  it('updates immediately when a todo is added', () => {
    const { rerender } = render(<TodoStats todos={[makeTodo('1')]} />);
    expect(screen.getByTestId('todo-stats').textContent).toBe('1 item left');

    rerender(<TodoStats todos={[makeTodo('1'), makeTodo('2')]} />);
    expect(screen.getByTestId('todo-stats').textContent).toBe('2 items left');
  });

  it('updates immediately when a todo is toggled', () => {
    const { rerender } = render(
      <TodoStats todos={[makeTodo('1'), makeTodo('2')]} />,
    );
    expect(screen.getByTestId('todo-stats').textContent).toBe('2 items left');

    rerender(<TodoStats todos={[makeTodo('1', true), makeTodo('2')]} />);
    expect(screen.getByTestId('todo-stats').textContent).toBe('1 item left');

    rerender(<TodoStats todos={[makeTodo('1', true), makeTodo('2', true)]} />);
    expect(screen.getByTestId('todo-stats').textContent).toBe('0 items left');
  });

  it('updates immediately when a todo is deleted', () => {
    const { rerender } = render(
      <TodoStats todos={[makeTodo('1'), makeTodo('2')]} />,
    );
    expect(screen.getByTestId('todo-stats').textContent).toBe('2 items left');

    rerender(<TodoStats todos={[makeTodo('2')]} />);
    expect(screen.getByTestId('todo-stats').textContent).toBe('1 item left');

    rerender(<TodoStats todos={[]} />);
    expect(screen.getByTestId('todo-stats').textContent).toBe('0 items left');
  });

  it('announces the count through a polite live region', () => {
    render(<TodoStats todos={[makeTodo('1')]} />);

    const status = screen.getByRole('status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toBe('1 item left');
  });

  it('merges an extra class name from the parent', () => {
    render(<TodoStats todos={[]} className="footer-slot" />);

    const stats = screen.getByTestId('todo-stats');
    expect(stats.className).toContain('todo-stats');
    expect(stats.className).toContain('footer-slot');
  });
});
