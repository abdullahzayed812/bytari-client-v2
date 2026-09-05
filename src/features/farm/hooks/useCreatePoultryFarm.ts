import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { orgKeys } from '@/features/organizations';
import type { OrganizationWithDetails } from '@/features/organizations/types';
import { FileUploadService } from '@/services/files';
import type { LocalFile, PresignProvider } from '@/services/files/types';

import { farmApi, poultryOpsApi } from '../api';
import type { CreatePoultryFarmInput } from '../types';

export interface CreatePoultryFarmVars {
  input: CreatePoultryFarmInput;
  /** Optional farm photo picked locally — uploaded AFTER the farm exists. */
  image?: LocalFile | null;
}

/**
 * "Add Poultry Farm": one `POST /organizations/farms` (backend does the whole
 * organization + `farm_details` + OWNER-membership transaction), then — if a
 * photo was picked — a presigned upload against the new farm id. An image
 * failure never fails the farm creation (the screen surfaces it as a warning).
 * Invalidates the farms lists so the new farm shows up without a manual refresh.
 */
export function useCreatePoultryFarm(): UseMutationResult<
  { organization: OrganizationWithDetails; imageFailed: boolean },
  unknown,
  CreatePoultryFarmVars
> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['poultry-farms', 'create'],
    mutationFn: async ({ input, image }) => {
      const organization = await farmApi.createFarm(input);
      let imageFailed = false;
      if (image) {
        try {
          const provider: PresignProvider = {
            requestUpload: (file) =>
              poultryOpsApi.requestFarmImageUploadUrl(organization.id, {
                filename: file.name,
                mimeType: file.mimeType,
                size: file.size ?? 0,
              }),
            finalizeUpload: async (storageKey, file) => {
              await poultryOpsApi.registerFarmImage(organization.id, {
                storageKey,
                mimeType: file.mimeType,
              });
            },
          };
          await new FileUploadService(provider).upload(image);
        } catch {
          imageFailed = true;
        }
      }
      return { organization, imageFailed };
    },
    onSuccess: ({ organization }) => {
      void qc.invalidateQueries({ queryKey: ['poultry-farms'] });
      void qc.invalidateQueries({ queryKey: orgKeys.lists() });
      qc.setQueryData(orgKeys.detail(organization.id), { ...organization, myRole: 'OWNER' });
    },
  });
}
