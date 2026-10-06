import { apiClient } from '@/services/api';

/** Mirrors the server's `SUBSCRIPTION_SUBJECTS`. */
export type SubscriptionSubject =
  'CLINIC' | 'VETERINARY_OFFICE' | 'POULTRY_FARM' | 'SHEEP_FARM' | 'CATTLE_FARM' | 'POULTRY_TRADER';

export interface SubscriptionInfo {
  subject: SubscriptionSubject;
  freeTrialDays: number;
}

export interface SubscriptionInfoRequestInput {
  subject: SubscriptionSubject;
  /** Required for every subject except `POULTRY_TRADER`. */
  organizationId?: string;
  note?: string;
}

export const subscriptionKeys = {
  all: ['subscriptions'] as const,
  info: (subject: SubscriptionSubject) => [...subscriptionKeys.all, 'info', subject] as const,
};

export const subscriptionsApi = {
  /** `GET /subscriptions/info?subject=` — the free-trial period (server-configured). */
  info(subject: SubscriptionSubject): Promise<SubscriptionInfo> {
    return apiClient.get<SubscriptionInfo>('/subscriptions/info', { params: { subject } });
  },
  /** `POST /subscriptions/info-requests` → a SUPPORT thread to the administration. */
  sendInfoRequest(input: SubscriptionInfoRequestInput): Promise<{ threadId: string }> {
    return apiClient.post<{ threadId: string }>('/subscriptions/info-requests', input);
  },
};
