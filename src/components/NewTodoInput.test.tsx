import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NewTodoInput } from './NewTodoInput';

afterEach(cleanup);

function getInput(): HTMLInputElement {
  return screen.getByLabelText(/new todo/i) as HTMLInputElement;
}

function typeText(input: HTMLInputElement, value: string) {
  fireEvent.change(input, { target: { value } });
}

/** Pressing Enter in a single-input form submits the form. */
function pressEnter(input: HTMLInputElement) {
  const form = input.closest('form') as HTMLFormElement;
  fireEvent.submit(form);
}

/** Minimal host that appends added todos, mirroring the real list owner. */
function Harness({ onAdd }: { onAdd?: (text: string) => void } = {}) {
  const [items, setItems] = useState<string[]>([]);

  return (
    <div>
      <NewTodoInput
        onAdd={(text) => {
          onAdd?.(text);
          setItems((previous) => [...previous, text]);
        }}
      />
      <ul aria-label="Todo list">
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function listTexts(): string[] {
  return screen
    .queryAllByRole('listitem')
    .map((item) => item.textContent ?? '');
}

describe('NewTodoInput', () => {
  it('has an accessible name and is reachable via Tab', () => {
    render(<NewTodoInput onAdd={vi.fn()} />);

    const input = getInput();
    expect(input).toBeTruthy();
    expect(input.tagName).toBe('INPUT');
    // Focusable by default: not disabled and not removed from the tab order.
    expect(input.hasAttribute('disabled')).toBe(false);
    expect(input.getAttribute('tabindex')).toBeNull();

    input.focus();
    expect(document.activeElement).toBe(input);
  });

  it('emits an add with the entered text when Enter is pressed', () => {
    const onAdd = vi.fn();
    render(<NewTodoInput onAdd={onAdd} />);

    const input = getInput();
    typeText(input, 'buy milk');
    pressEnter(input);

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd).toHaveBeenCalledWith('buy milk');
  });

  it('appends new todos to the bottom of the list', () => {
    render(<Harness />);

    const input = getInput();

    typeText(input, 'first');
    pressEnter(input);
    typeText(input, 'second');
    pressEnter(input);
    typeText(input, 'third');
    pressEnter(input);

    expect(listTexts()).toEqual(['first', 'second', 'third']);
  });

  it('clears the input and keeps focus after a successful add', () => {
    render(<NewTodoInput onAdd={vi.fn()} />);

    const input = getInput();
    input.focus();
    typeText(input, 'water plants');
    pressEnter(input);

    expect(input.value).toBe('');
    expect(document.activeElement).toBe(input);
  });

  it('rejects empty and whitespace-only submissions', () => {
    const onAdd = vi.fn();
    render(<Harness onAdd={onAdd} />);

    const input = getInput();

    // Empty.
    pressEnter(input);
    expect(onAdd).not.toHaveBeenCalled();
    expect(listTexts()).toEqual([]);

    // Whitespace only.
    typeText(input, '    ');
    pressEnter(input);
    expect(onAdd).not.toHaveBeenCalled();
    expect(listTexts()).toEqual([]);

    // Tabs / newlines only.
    typeText(input, '\t\n ');
    pressEnter(input);
    expect(onAdd).not.toHaveBeenCalled();
    expect(listTexts()).toEqual([]);
  });

  it('trims leading and trailing whitespace from the stored text', () => {
    const onAdd = vi.fn();
    render(<Harness onAdd={onAdd} />);

    const input = getInput();
    typeText(input, '   walk the dog   ');
    pressEnter(input);

    expect(onAdd).toHaveBeenCalledWith('walk the dog');
    expect(listTexts()).toEqual(['walk the dog']);
  });

  it('allows two adds with identical text as separate items', () => {
    const onAdd = vi.fn();
    render(<Harness onAdd={onAdd} />);

    const input = getInput();

    typeText(input, 'same task');
    pressEnter(input);
    typeText(input, 'same task');
    pressEnter(input);

    expect(onAdd).toHaveBeenCalledTimes(2);
    expect(onAdd).toHaveBeenNthCalledWith(1, 'same task');
    expect(onAdd).toHaveBeenNthCalledWith(2, 'same task');
    expect(listTexts()).toEqual(['same task', 'same task']);
  });

  it('also adds when the submit button is clicked', () => {
    const onAdd = vi.fn();
    render(<NewTodoInput onAdd={onAdd} />);

    typeText(getInput(), 'click add');
    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    expect(onAdd).toHaveBeenCalledWith('click add');
  });
});
