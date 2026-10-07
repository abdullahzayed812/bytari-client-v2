import { apiClient } from '@/services/api';

import type { ClinicDashboardSummary } from '../types';

export const clinicDashboardApi = {
  /** Stats + effective permissions. 403 for non-members, 400 for a non-CLINIC organization. */
  getSummary(organizationId: string): Promise<ClinicDashboardSummary> {
    return apiClient.get<ClinicDashboardSummary>(
      `/organizations/${organizationId}/clinic-dashboard/summary`,
    );
  },
};

export type ClinicDashboardApi = typeof clinicDashboardApi;
