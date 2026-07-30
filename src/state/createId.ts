interface RandomSource {
  randomUUID?: () => string;
}

let counter = 0;

/**
 * Creates a stable, unique id for a todo.
 *
 * Uses `crypto.randomUUID()` when available and falls back to a
 * timestamp + counter combination in older environments.
 */
export function createId(): string {
  const cryptoObj = (globalThis as { crypto?: RandomSource }).crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }

  counter += 1;
  return `todo-${Date.now().toString(36)}-${counter.toString(36)}`;
}
