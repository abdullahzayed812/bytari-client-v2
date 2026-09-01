/**
 * User-summary query keys. Summaries are near-immutable (a name), so they are
 * cached with a long `staleTime` and shared across every screen that resolves
 * an id.
 *
 *   userKeys.summary(userId) → ['users', 'summary', userId]
 */
export const userKeys = {
  all: ['users'] as const,
  summaries: () => [...userKeys.all, 'summary'] as const,
  summary: (userId: string) => [...userKeys.summaries(), userId] as const,
};
