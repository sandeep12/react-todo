import type { CSSProperties } from 'react'

const styles: Record<string, CSSProperties> = {
  page: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '100%',
    padding: '1rem',
  },
  shell: {
    width: '100%',
    maxWidth: '32rem',
  },
  header: {
    marginBottom: '1rem',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    lineHeight: 1.2,
    overflowWrap: 'break-word',
  },
  subtitle: {
    margin: '0.25rem 0 0',
    color: '#4b5563',
    fontSize: '0.95rem',
    overflowWrap: 'break-word',
  },
  card: {
    width: '100%',
    padding: '1rem',
    borderRadius: '0.75rem',
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
  },
  cardText: {
    margin: 0,
    overflowWrap: 'break-word',
  },
}

function App() {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <h1 style={styles.title}>Todo App</h1>
          <p style={styles.subtitle}>Keep track of what needs to get done.</p>
        </header>

        <main style={styles.card}>
          <p style={styles.cardText}>
            The application shell is ready. Task features will render here.
          </p>
        </main>
      </div>
    </div>
  )
}

export default App
