import { useEffect, useState } from 'react'

import type { Todo } from '../api/todos'

export interface TodoItemProps {
  todo: Todo
  onUpdate: (id: string, input: { title?: string; done?: boolean }) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}

export default function TodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
  const [title, setTitle] = useState(todo.title)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setTitle(todo.title)
  }, [todo.title])

  async function handleToggleDone() {
    setError(null)
    setIsUpdating(true)

    try {
      await onUpdate(todo.id, { done: !todo.done })
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : 'Failed to update todo'
      setError(message)
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleTitleBlur() {
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setTitle(todo.title)
      setError('Title cannot be empty')
      return
    }

    if (trimmedTitle === todo.title) {
      return
    }

    setError(null)
    setIsUpdating(true)

    try {
      await onUpdate(todo.id, { title: trimmedTitle })
    } catch (updateError) {
      setTitle(todo.title)
      const message = updateError instanceof Error ? updateError.message : 'Failed to update todo'
      setError(message)
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDelete() {
    setError(null)
    setIsDeleting(true)

    try {
      await onDelete(todo.id)
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Failed to delete todo'
      setError(message)
      setIsDeleting(false)
    }
  }

  const isBusy = isUpdating || isDeleting

  return (
    <li className={`todo-item${todo.done ? ' todo-item--done' : ''}`}>
      <label className="todo-item__done">
        <span className="visually-hidden">Mark “{todo.title}” as done</span>
        <input
          type="checkbox"
          checked={todo.done}
          onChange={() => void handleToggleDone()}
          disabled={isBusy}
        />
      </label>

      <input
        className="todo-item__title"
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onBlur={() => void handleTitleBlur()}
        disabled={isBusy}
        aria-label="Todo title"
      />

      <button
        className="todo-item__delete"
        type="button"
        onClick={() => void handleDelete()}
        disabled={isBusy}
        aria-label={`Delete “${todo.title}”`}
      >
        {isDeleting ? 'Deleting…' : 'Delete'}
      </button>

      {error ? (
        <p className="todo-item__error" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  )
}
