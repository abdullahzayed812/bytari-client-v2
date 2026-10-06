import { useMutation, useQuery } from '@tanstack/react-query';

import type { ApiError } from '@/services/api';

import {
  subscriptionKeys,
  subscriptionsApi,
  type SubscriptionInfo,
  type SubscriptionInfoRequestInput,
  type SubscriptionSubject,
} from './api';

export function useSubscriptionInfo(subject: SubscriptionSubject) {
  return useQuery<SubscriptionInfo, ApiError>({
    queryKey: subscriptionKeys.info(subject),
    queryFn: () => subscriptionsApi.info(subject),
    staleTime: 10 * 60_000,
  });
}

export function useSendSubscriptionInfoRequest() {
  return useMutation<{ threadId: string }, ApiError, SubscriptionInfoRequestInput>({
    mutationKey: [...subscriptionKeys.all, 'info-request'],
    mutationFn: (input) => subscriptionsApi.sendInfoRequest(input),
  });
}
