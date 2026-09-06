/**
 * Genuinely cross-farm-type query keys — join-code and subscription-renewal
 * state. Everything is organization-scoped so one prefix invalidates a farm's
 * whole join-code/subscription state, regardless of species.
 */
export const farmKeys = {
  all: ['farm'] as const,
  joinCode: (organizationId: string) => [...farmKeys.all, organizationId, 'join-code'] as const,
  subscriptionRenewals: (organizationId: string) =>
    [...farmKeys.all, organizationId, 'subscription-renewals'] as const,
};
