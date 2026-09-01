/**
 * Veterinarian-application query keys.
 *
 *   vetKeys.all       → ['veterinarian']
 *   vetKeys.status()  → ['veterinarian', 'status']
 */
export const vetKeys = {
  all: ['veterinarian'] as const,
  status: () => [...vetKeys.all, 'status'] as const,
};
