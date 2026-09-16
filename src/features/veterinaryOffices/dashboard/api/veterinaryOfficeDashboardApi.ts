import { apiClient } from '@/services/api';

import type {
  BroadcastImageUploadUrlInput,
  BroadcastImageUploadUrlResult,
  SendFollowerBroadcastInput,
  VeterinaryOfficeDashboardSummary,
} from '../types';

export const veterinaryOfficeDashboardApi = {
  getSummary(organizationId: string): Promise<VeterinaryOfficeDashboardSummary> {
    return apiClient.get<VeterinaryOfficeDashboardSummary>(
      `/organizations/${organizationId}/office-dashboard/summary`,
    );
  },

  requestBroadcastImageUploadUrl(
    organizationId: string,
    input: BroadcastImageUploadUrlInput,
  ): Promise<BroadcastImageUploadUrlResult> {
    return apiClient.post<BroadcastImageUploadUrlResult>(
      `/organizations/${organizationId}/broadcast/image-upload-url`,
      input,
    );
  },

  sendBroadcast(
    organizationId: string,
    body: SendFollowerBroadcastInput,
  ): Promise<{ broadcastId: string }> {
    return apiClient.post<{ broadcastId: string }>(
      `/organizations/${organizationId}/broadcast`,
      body,
    );
  },
};

export const veterinaryOfficeDashboardKeys = {
  all: ['veterinary-office-dashboard'] as const,
  summary: (organizationId: string) =>
    [...veterinaryOfficeDashboardKeys.all, 'summary', organizationId] as const,
};
