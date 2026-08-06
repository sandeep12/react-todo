import { FormEvent, useState } from 'react'

export interface TodoFormProps {
  onAdd: (title: string) => Promise<unknown>
}

export default function TodoForm({ onAdd }: TodoFormProps) {
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const trimmedTitle = title.trim()
  const canSubmit = trimmedTitle.length > 0 && !isSubmitting

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await onAdd(trimmedTitle)
      setTitle('')
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Failed to add todo'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <label className="todo-form__field">
        <span className="visually-hidden">New todo title</span>
        <input
          type="text"
          name="title"
          placeholder="What needs doing?"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={isSubmitting}
        />
      </label>

      <button className="todo-form__submit" type="submit" disabled={!canSubmit}>
        {isSubmitting ? 'Adding…' : 'Add'}
      </button>

      {error ? (
        <p className="todo-form__error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
