import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FilterBar } from './FilterBar';
import { FILTERS, filterTodos, type Filter } from '../lib/filterTodos';

afterEach(() => {
  cleanup();
});

const getControls = () => ({
  all: screen.getByRole('button', { name: 'All' }),
  active: screen.getByRole('button', { name: 'Active' }),
  completed: screen.getByRole('button', { name: 'Completed' }),
});

describe('FilterBar', () => {
  it('renders All, Active and Completed controls with accessible names', () => {
    render(<FilterBar filter="all" onFilterChange={() => {}} />);

    const controls = getControls();

    expect(controls.all).toBeTruthy();
    expect(controls.active).toBeTruthy();
    expect(controls.completed).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('exposes the controls inside a labelled group', () => {
    render(<FilterBar filter="all" onFilterChange={() => {}} />);

    expect(screen.getByRole('group', { name: 'Filter todos' })).toBeTruthy();
  });

  it('marks "All" as selected when the all filter is active', () => {
    render(<FilterBar filter="all" onFilterChange={() => {}} />);

    const controls = getControls();

    expect(controls.all.getAttribute('aria-pressed')).toBe('true');
    expect(controls.all.getAttribute('aria-current')).toBe('true');
    expect(controls.active.getAttribute('aria-pressed')).toBe('false');
    expect(controls.active.getAttribute('aria-current')).toBe(null);
    expect(controls.completed.getAttribute('aria-pressed')).toBe('false');
  });

  it('marks "Active" as selected when the active filter is chosen', () => {
    render(<FilterBar filter="active" onFilterChange={() => {}} />);

    const controls = getControls();

    expect(controls.active.getAttribute('aria-pressed')).toBe('true');
    expect(controls.active.getAttribute('aria-current')).toBe('true');
    expect(controls.all.getAttribute('aria-pressed')).toBe('false');
    expect(controls.completed.getAttribute('aria-pressed')).toBe('false');
  });

  it('marks "Completed" as selected when the completed filter is chosen', () => {
    render(<FilterBar filter="completed" onFilterChange={() => {}} />);

    const controls = getControls();

    expect(controls.completed.getAttribute('aria-pressed')).toBe('true');
    expect(controls.completed.getAttribute('aria-current')).toBe('true');
    expect(controls.all.getAttribute('aria-pressed')).toBe('false');
    expect(controls.active.getAttribute('aria-pressed')).toBe('false');
  });

  it('marks exactly one control as selected for every filter mode', () => {
    for (const filter of FILTERS) {
      render(<FilterBar filter={filter} onFilterChange={() => {}} />);

      const pressed = screen
        .getAllByRole('button')
        .filter((button) => button.getAttribute('aria-pressed') === 'true');

      expect(pressed).toHaveLength(1);
      cleanup();
    }
  });

  it('reports the chosen filter when a control is clicked', () => {
    const onFilterChange = vi.fn();
    render(<FilterBar filter="all" onFilterChange={onFilterChange} />);

    const controls = getControls();

    fireEvent.click(controls.active);
    expect(onFilterChange).toHaveBeenLastCalledWith('active');

    fireEvent.click(controls.completed);
    expect(onFilterChange).toHaveBeenLastCalledWith('completed');

    fireEvent.click(controls.all);
    expect(onFilterChange).toHaveBeenLastCalledWith('all');

    expect(onFilterChange).toHaveBeenCalledTimes(3);
  });

  it('renders the controls as native, keyboard-activatable buttons', () => {
    render(<FilterBar filter="all" onFilterChange={() => {}} />);

    for (const button of screen.getAllByRole('button')) {
      // Native buttons are activated by Enter and Space by the browser.
      expect(button.tagName).toBe('BUTTON');
      expect(button.getAttribute('type')).toBe('button');
      expect((button as HTMLButtonElement).disabled).toBe(false);
      expect((button as HTMLButtonElement).tabIndex).toBeGreaterThanOrEqual(0);
      expect(button.getAttribute('tabindex')).not.toBe('-1');
    }
  });

  it('is Tab-reachable: each control can receive focus', () => {
    render(<FilterBar filter="all" onFilterChange={() => {}} />);

    for (const button of screen.getAllByRole('button')) {
      (button as HTMLButtonElement).focus();
      expect(document.activeElement).toBe(button);
    }
  });

  it('accepts a custom group label and class name', () => {
    render(
      <FilterBar
        filter="all"
        onFilterChange={() => {}}
        label="Show"
        className="extra"
      />,
    );

    const group = screen.getByRole('group', { name: 'Show' });
    expect(group.className).toContain('filter-bar');
    expect(group.className).toContain('extra');
  });

  it('only changes which todos are visible, never the stored list', () => {
    const todos = [
      { id: '1', title: 'Keep me', completed: false },
      { id: '2', title: 'Done already', completed: true },
    ];
    let filter: Filter = 'all';

    const view = render(
      <FilterBar
        filter={filter}
        onFilterChange={(next) => {
          filter = next;
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Completed' }));
    view.rerender(
      <FilterBar
        filter={filter}
        onFilterChange={(next) => {
          filter = next;
        }}
      />,
    );

    expect(filter).toBe('completed');
    expect(filterTodos(todos, filter).map((todo) => todo.id)).toEqual(['2']);
    expect(
      screen.getByRole('button', { name: 'Completed' }).getAttribute('aria-pressed'),
    ).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    view.rerender(
      <FilterBar
        filter={filter}
        onFilterChange={(next) => {
          filter = next;
        }}
      />,
    );

    expect(filter).toBe('all');
    expect(filterTodos(todos, filter).map((todo) => todo.id)).toEqual(['1', '2']);
    expect(todos).toHaveLength(2);
  });
});
