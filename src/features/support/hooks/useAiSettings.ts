import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/services/api';

import { aiSettingsApi, supportKeys } from '../api';
import type { AiSettings, UpdateAiSettingsInput } from '../types';

/** Admin-only AI on/off flags for consultations & inquiries (`/admin/ai-settings`). */
export function useAiSettings(options: { enabled?: boolean } = {}) {
  return useQuery<AiSettings, ApiError>({
    queryKey: supportKeys.aiSettings(),
    queryFn: () => aiSettingsApi.get(),
    enabled: options.enabled ?? true,
    retry: (count, error) =>
      !(error instanceof ApiError && (error.status === 403 || error.status === 404)) && count < 2,
  });
}

export function useUpdateAiSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['support', 'ai-settings', 'update'],
    mutationFn: (input: UpdateAiSettingsInput) => aiSettingsApi.update(input),
    onSuccess: (data) => {
      qc.setQueryData(supportKeys.aiSettings(), data);
    },
  });
}
