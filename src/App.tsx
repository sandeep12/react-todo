import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import './index.css'
import './App.css'

/*
 * Application shell.
 *
 * The shell owns the todo state hook (`useTodos`) and composes the presentation
 * units - NewTodoInput, FilterBar, TodoStats, TodoList (TodoItem) and
 * EmptyState - so that adding, toggling, editing, deleting and filtering work
 * end to end. Everything the shell needs lives in this module so the app has no
 * unresolved imports, and every interactive element is a native control
 * (input/button) which keeps Tab order, Enter/Space activation and focus
 * indication working without extra JavaScript.
 */

export type TodoFilter = 'all' | 'active' | 'completed'

export interface Todo {
  id: string
  title: string
  completed: boolean
}

interface FilterOption {
  value: TodoFilter
  label: string
}

const FILTER_OPTIONS: readonly FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

let idSequence = 0

function createTodoId(): string {
  idSequence += 1
  return `todo-${Date.now().toString(36)}-${idSequence.toString(36)}`
}

function matchesFilter(todo: Todo, filter: TodoFilter): boolean {
  if (filter === 'active') {
    return !todo.completed
  }
  if (filter === 'completed') {
    return todo.completed
  }
  return true
}

/** Todo state and the operations the UI needs. */
function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])

  const addTodo = useCallback((title: string): boolean => {
    const trimmed = title.trim()
    if (trimmed.length === 0) {
      return false
    }
    const todo: Todo = { id: createTodoId(), title: trimmed, completed: false }
    setTodos((current) => [...current, todo])
    return true
  }, [])

  const toggleTodo = useCallback((id: string) => {
    setTodos((current) =>
      current.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)),
    )
  }, [])

  const editTodo = useCallback((id: string, title: string): boolean => {
    const trimmed = title.trim()
    if (trimmed.length === 0) {
      return false
    }
    setTodos((current) =>
      current.map((todo) => (todo.id === id ? { ...todo, title: trimmed } : todo)),
    )
    return true
  }, [])

  const deleteTodo = useCallback((id: string) => {
    setTodos((current) => current.filter((todo) => todo.id !== id))
  }, [])

  return { todos, addTodo, toggleTodo, editTodo, deleteTodo }
}

interface NewTodoInputProps {
  onAdd: (title: string) => boolean
}

function NewTodoInput({ onAdd }: NewTodoInputProps) {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!onAdd(title)) {
      setError('Type something before adding a todo.')
      return
    }
    setTitle('')
    setError('')
  }

  return (
    <form className="new-todo" onSubmit={handleSubmit} noValidate>
      <div className="new-todo__field">
        <label className="new-todo__label" htmlFor={inputId}>
          What needs doing?
        </label>
        <input
          className="new-todo__input"
          id={inputId}
          name="title"
          type="text"
          value={title}
          placeholder="e.g. Buy milk"
          autoComplete="off"
          aria-invalid={error !== '' || undefined}
          aria-describedby={error !== '' ? errorId : undefined}
          onChange={(event) => {
            setTitle(event.target.value)
            if (error !== '') {
              setError('')
            }
          }}
        />
      </div>
      <button className="button button--primary new-todo__submit" type="submit">
        Add
      </button>
      {error !== '' ? (
        <p className="new-todo__error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}

interface FilterBarProps {
  filter: TodoFilter
  onFilterChange: (filter: TodoFilter) => void
}

function FilterBar({ filter, onFilterChange }: FilterBarProps) {
  return (
    <div className="filter-bar" role="group" aria-label="Filter todos">
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option.value}
          className="filter-bar__button"
          type="button"
          aria-pressed={filter === option.value}
          onClick={() => onFilterChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

interface TodoStatsProps {
  total: number
  activeCount: number
  completedCount: number
}

function TodoStats({ total, activeCount, completedCount }: TodoStatsProps) {
  const message =
    total === 0
      ? 'No todos yet.'
      : `${activeCount} of ${total} remaining \u00b7 ${completedCount} completed`

  return (
    <p className="todo-stats" role="status">
      {message}
    </p>
  )
}

interface EmptyStateProps {
  title: string
  hint?: string
}

function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">{title}</p>
      {hint === undefined ? null : <p className="empty-state__hint">{hint}</p>}
    </div>
  )
}

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onEdit: (id: string, title: string) => boolean
  onDelete: (id: string) => void
}

function TodoItem({ todo, onToggle, onEdit, onDelete }: TodoItemProps) {
  const baseId = useId()
  const checkboxId = `${baseId}-checkbox`
  const editInputId = `${baseId}-edit`
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(todo.title)
  const editInputRef = useRef<HTMLInputElement>(null)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const wasEditing = useRef(false)

  // Move focus into the edit field, and back to the Edit button when done, so
  // keyboard users never lose their place in the tab order.
  useEffect(() => {
    if (isEditing) {
      wasEditing.current = true
      const input = editInputRef.current
      if (input) {
        input.focus()
        input.select()
      }
      return
    }
    if (wasEditing.current) {
      wasEditing.current = false
      editButtonRef.current?.focus()
    }
  }, [isEditing])

  function startEditing() {
    setDraft(todo.title)
    setIsEditing(true)
  }

  function cancelEditing() {
    setDraft(todo.title)
    setIsEditing(false)
  }

  function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = draft.trim()
    if (trimmed === '') {
      cancelEditing()
      return
    }
    if (trimmed !== todo.title) {
      onEdit(todo.id, trimmed)
    }
    setIsEditing(false)
  }

  function handleEditKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      cancelEditing()
    }
  }

  if (isEditing) {
    return (
      <form className="todo-item todo-item--editing" onSubmit={handleEditSubmit}>
        <label className="visually-hidden" htmlFor={editInputId}>
          Edit todo
        </label>
        <input
          ref={editInputRef}
          className="todo-item__edit-input"
          id={editInputId}
          type="text"
          value={draft}
          autoComplete="off"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleEditKeyDown}
        />
        <div className="todo-item__actions">
          <button className="button button--primary" type="submit">
            Save
          </button>
          <button className="button" type="button" onClick={cancelEditing}>
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="todo-item">
      <input
        className="todo-item__checkbox"
        id={checkboxId}
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <label
        className={
          todo.completed ? 'todo-item__label todo-item__label--completed' : 'todo-item__label'
        }
        htmlFor={checkboxId}
      >
        {todo.title}
      </label>
      <div className="todo-item__actions">
        <button
          ref={editButtonRef}
          className="button"
          type="button"
          aria-label={`Edit "${todo.title}"`}
          onClick={startEditing}
        >
          Edit
        </button>
        <button
          className="button button--danger"
          type="button"
          aria-label={`Delete "${todo.title}"`}
          onClick={() => onDelete(todo.id)}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

interface TodoListProps {
  todos: Todo[]
  onToggle: (id: string) => void
  onEdit: (id: string, title: string) => boolean
  onDelete: (id: string) => void
}

function TodoList({ todos, onToggle, onEdit, onDelete }: TodoListProps) {
  return (
    <ul className="todo-list" aria-label="Todos">
      {todos.map((todo) => (
        <li className="todo-list__item" key={todo.id}>
          <TodoItem todo={todo} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
        </li>
      ))}
    </ul>
  )
}

function noMatchTitle(filter: TodoFilter): string {
  if (filter === 'active') {
    return 'No active todos.'
  }
  if (filter === 'completed') {
    return 'No completed todos yet.'
  }
  return 'No todos to show.'
}

export default function App() {
  const { todos, addTodo, toggleTodo, editTodo, deleteTodo } = useTodos()
  const [filter, setFilter] = useState<TodoFilter>('all')

  const visibleTodos = useMemo(
    () => todos.filter((todo) => matchesFilter(todo, filter)),
    [todos, filter],
  )
  const completedCount = useMemo(() => todos.filter((todo) => todo.completed).length, [todos])
  const activeCount = todos.length - completedCount

  let listRegion
  if (todos.length === 0) {
    listRegion = (
      <EmptyState
        title="Nothing to do yet."
        hint="Add your first todo with the field above."
      />
    )
  } else if (visibleTodos.length === 0) {
    listRegion = <EmptyState title={noMatchTitle(filter)} hint="Try a different filter." />
  } else {
    listRegion = (
      <TodoList
        todos={visibleTodos}
        onToggle={toggleTodo}
        onEdit={editTodo}
        onDelete={deleteTodo}
      />
    )
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Todo App</h1>
        <p className="app__tagline">Keep track of what needs doing.</p>
      </header>
      <main className="app__main">
        <NewTodoInput onAdd={addTodo} />
        <FilterBar filter={filter} onFilterChange={setFilter} />
        <TodoStats total={todos.length} activeCount={activeCount} completedCount={completedCount} />
        {listRegion}
      </main>
    </div>
  )
}
