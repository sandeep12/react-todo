/**
 * EmptyState — REQ-7
 *
 * Two distinct messages replace the list when it has nothing to show:
 *  - `no-todos`   : the collection itself is empty.
 *  - `no-matches` : todos exist, but none match the active filter.
 */

export type EmptyStateVariant = 'no-todos' | 'no-matches';

export const EMPTY_STATE_MESSAGES: Record<EmptyStateVariant, string> = {
  'no-todos': 'Nothing to do yet. Add your first todo above.',
  'no-matches': 'No matching todos for this filter.',
};

export interface EmptyStateProps {
  variant: EmptyStateVariant;
  /** Optional filter name (e.g. "active") used to sharpen the message. */
  filterLabel?: string;
  className?: string;
}

/**
 * Decides which empty state (if any) the list should render.
 * Returns `null` when there is at least one visible todo.
 */
export function resolveEmptyStateVariant(
  totalCount: number,
  visibleCount: number,
): EmptyStateVariant | null {
  if (totalCount === 0) {
    return 'no-todos';
  }
  if (visibleCount === 0) {
    return 'no-matches';
  }
  return null;
}

export function EmptyState({
  variant,
  filterLabel,
  className,
}: EmptyStateProps) {
  const message =
    variant === 'no-matches' && filterLabel
      ? `No matching todos for the "${filterLabel}" filter.`
      : EMPTY_STATE_MESSAGES[variant];

  return (
    <p
      className={className ? `empty-state ${className}` : 'empty-state'}
      data-testid="empty-state"
      data-variant={variant}
      role="status"
    >
      {message}
    </p>
  );
}

export default EmptyState;
