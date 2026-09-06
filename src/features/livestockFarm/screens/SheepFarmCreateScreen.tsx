import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useToast } from '@/components/feedback';
import { Routes } from '@/constants/routes';
import { useAuthStore } from '@/features/auth/store';
import { farmOpsApi } from '@/features/farmShared';
import { OrgFormLayout } from '@/features/organizations';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';
import { FileUploadService } from '@/services/files';
import type { LocalFile, PresignProvider } from '@/services/files/types';

import { SheepFarmForm } from '../components';
import { useCreateSheepFarm } from '../hooks';
import type { CreateSheepFarmInput } from '../types';
import type { CreateSheepFarmFormValues } from '../validation/schemas';

const toCount = (v: string | undefined): number | undefined => {
  const s = v?.trim();
  return s ? Number(s) : undefined;
};
const orNull = (v: string | undefined): string | undefined => {
  const s = v?.trim();
  return s ? s : undefined;
};

/** Route `/(app)/livestock/sheep/create` — "إضافة حقل أغنام جديد". Mirrors `PoultryFarmCreateScreen`. */
export default function SheepFarmCreateScreen() {
  const { t } = useTranslation('sheepCattleFarm');
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const create = useCreateSheepFarm();
  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});

  const defaults: Partial<CreateSheepFarmFormValues> = {
    contactName: user ? `${user.firstName} ${user.lastName}`.trim() : '',
    contactPhone: user?.phone ?? '',
    contactEmail: user?.email ?? '',
  };

  const onSubmit = (values: CreateSheepFarmFormValues, image: LocalFile | null): void => {
    if (inFlight.current || create.isPending) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});

    const input: CreateSheepFarmInput = {
      name: values.name.trim(),
      location: values.location.trim(),
      governorate: values.governorate,
      sheepProductionType: values.sheepProductionType,
      description: orNull(values.description) ?? null,
      address: orNull(values.address) ?? null,
      capacity: toCount(values.capacity) ?? null,
      currentSheepCount: toCount(values.currentSheepCount) ?? null,
      contactName: orNull(values.contactName) ?? null,
      contactPhone: orNull(values.contactPhone) ?? null,
      contactEmail: orNull(values.contactEmail) ?? null,
    };

    create.mutate(input, {
      onSuccess: async (organization) => {
        toast.show({ tone: 'success', message: t('create.success') });
        if (image) {
          try {
            const provider: PresignProvider = {
              requestUpload: (file) =>
                farmOpsApi.requestFarmImageUploadUrl(organization.id, {
                  filename: file.name,
                  mimeType: file.mimeType,
                  size: file.size ?? 0,
                }),
              finalizeUpload: async (storageKey, file) => {
                await farmOpsApi.registerFarmImage(organization.id, { storageKey, mimeType: file.mimeType });
              },
            };
            await new FileUploadService(provider).upload(image);
          } catch {
            toast.show({ tone: 'warning', message: t('create.imageFailed') });
          }
        }
        router.replace(Routes.sheepFarmDetail(organization.id));
      },
      onError: (error) => {
        setServerFields(fieldErrors(error));
        setFormError(apiErrorMessage(error));
      },
      onSettled: () => {
        inFlight.current = false;
      },
    });
  };

  return (
    <OrgFormLayout title={t('create.sheepTitle')}>
      <SheepFarmForm
        defaultValues={defaults}
        submitting={create.isPending}
        formError={formError}
        serverFields={serverFields}
        onSubmit={onSubmit}
      />
    </OrgFormLayout>
  );
}
