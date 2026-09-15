import type { AdPlacement, ListAdminAdCampaignsParams } from '../types';

export const adKeys = {
  all: ['ads'] as const,
  list: (placement: AdPlacement) => [...adKeys.all, 'list', placement] as const,
  admin: () => [...adKeys.all, 'admin'] as const,
  adminList: (params: ListAdminAdCampaignsParams) =>
    [...adKeys.admin(), 'list', params] as const,
  adminCampaign: (campaignId: string) => [...adKeys.admin(), 'campaign', campaignId] as const,
};
