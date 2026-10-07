export const clinicDashboardKeys = {
  all: ['clinic-dashboard'] as const,
  summary: (organizationId: string) =>
    [...clinicDashboardKeys.all, 'summary', organizationId] as const,
};
