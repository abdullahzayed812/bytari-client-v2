import { apiClient } from '@/services/api';

/**
 * `GET /users/:id` — an authenticated **name-level** user summary. Added to the
 * backend in the pre-Phase-12 gap audit specifically so the app can resolve the
 * actor / authorship user ids that other DTOs carry (`recordedByUserId`,
 * `createdBy`, `transferredBy`, ownership `owner`, …) and to back the ownership
 * transfer recipient field.
 *
 * The response is deliberately minimal — no email / phone / account status /
 * roles. A `DEACTIVATED` account returns `404`.
 */
export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  veterinarianStatus: 'NOT_APPLIED' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

export const usersApi = {
  getSummary(userId: string): Promise<UserSummary> {
    return apiClient.get<UserSummary>(`/users/${userId}`);
  },
};

export type UsersApi = typeof usersApi;
