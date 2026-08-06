import { API_BASE_URL } from './config'

export default function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1>Todo App</h1>
        <p className="app__tagline">Keep track of what needs doing.</p>
      </header>
      <main className="app__main">
        <p>The app shell is ready. Todo features will appear here.</p>
        <p data-testid="api-base-url">API: {API_BASE_URL}</p>
      </main>
    </div>
  )
}
