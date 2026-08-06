import type { Todo } from '../api/todos'
import TodoItem from './TodoItem'

export interface TodoListProps {
  todos: Todo[]
  onUpdate: (id: string, input: { title?: string; done?: boolean }) => Promise<unknown>
  onDelete: (id: string) => Promise<unknown>
}

export default function TodoList({ todos, onUpdate, onDelete }: TodoListProps) {
  if (todos.length === 0) {
    return <p className="todo-list__empty">No todos yet. Add one above.</p>
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </ul>
  )
}
