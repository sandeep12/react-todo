import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import {
  EMPTY_STATE_MESSAGES,
  EmptyState,
  resolveEmptyStateVariant,
} from './EmptyState';

afterEach(() => {
  cleanup();
});

describe('resolveEmptyStateVariant', () => {
  it('reports "no-todos" when the collection is empty', () => {
    expect(resolveEmptyStateVariant(0, 0)).toBe('no-todos');
  });

  it('reports "no-matches" when todos exist but none are visible', () => {
    expect(resolveEmptyStateVariant(3, 0)).toBe('no-matches');
  });

  it('reports null when at least one todo is visible', () => {
    expect(resolveEmptyStateVariant(3, 1)).toBeNull();
    expect(resolveEmptyStateVariant(1, 1)).toBeNull();
  });
});

describe('<EmptyState />', () => {
  it('renders the "no todos at all" message', () => {
    render(<EmptyState variant="no-todos" />);

    const el = screen.getByTestId('empty-state');
    expect(el.textContent).toBe(EMPTY_STATE_MESSAGES['no-todos']);
    expect(el.getAttribute('data-variant')).toBe('no-todos');
    expect(el.textContent).not.toContain('No matching todos');
  });

  it('renders a distinct "no matching todos" message', () => {
    render(<EmptyState variant="no-matches" />);

    const el = screen.getByTestId('empty-state');
    expect(el.textContent).toBe('No matching todos for this filter.');
    expect(el.getAttribute('data-variant')).toBe('no-matches');
  });

  it('uses different copy for each variant', () => {
    expect(EMPTY_STATE_MESSAGES['no-todos']).not.toBe(
      EMPTY_STATE_MESSAGES['no-matches'],
    );
  });

  it('names the active filter when one is provided', () => {
    render(<EmptyState variant="no-matches" filterLabel="active" />);

    const el = screen.getByTestId('empty-state');
    expect(el.textContent).toContain('No matching todos');
    expect(el.textContent).toContain('active');
  });

  it('ignores the filter label for the "no-todos" variant', () => {
    render(<EmptyState variant="no-todos" filterLabel="active" />);

    expect(screen.getByTestId('empty-state').textContent).toBe(
      EMPTY_STATE_MESSAGES['no-todos'],
    );
  });

  it('exposes the message as a status region', () => {
    render(<EmptyState variant="no-todos" />);

    expect(screen.getByRole('status').textContent).toBe(
      EMPTY_STATE_MESSAGES['no-todos'],
    );
  });

  it('merges an extra class name from the parent', () => {
    render(<EmptyState variant="no-matches" className="list-slot" />);

    const el = screen.getByTestId('empty-state');
    expect(el.className).toContain('empty-state');
    expect(el.className).toContain('list-slot');
  });
});
