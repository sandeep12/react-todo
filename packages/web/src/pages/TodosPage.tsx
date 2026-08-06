import { useAuth } from '../context/AuthContext'
import TodoForm from '../todos/TodoForm'
import TodoList from '../todos/TodoList'
import { useTodos } from '../todos/useTodos'

export default function TodosPage() {
  const { logout } = useAuth()
  const { todos, isLoading, error, loadTodos, addTodo, editTodo, removeTodo } = useTodos()

  return (
    <div className="todos-page">
      <header className="todos-page__header">
        <div>
          <h1>Your todos</h1>
          <p>Changes are saved automatically.</p>
        </div>
        <button className="todos-page__logout" type="button" onClick={logout}>
          Sign out
        </button>
      </header>

      <TodoForm onAdd={addTodo} />

      {isLoading ? <p className="todos-page__status">Loading todos…</p> : null}

      {error ? (
        <div className="todos-page__error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => void loadTodos()}>
            Try again
          </button>
        </div>
      ) : null}

      {!isLoading && !error ? (
        <TodoList todos={todos} onUpdate={editTodo} onDelete={removeTodo} />
      ) : null}
    </div>
  )
}
