import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useToast } from '@/components/feedback';
import { Routes } from '@/constants/routes';
import { useAuthStore } from '@/features/auth/store';
import { OrgFormLayout } from '@/features/organizations';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';
import { devDataEnabled } from '@/lib/env';
import type { LocalFile } from '@/services/media';

import { PoultryFarmForm } from '../components';
import { devPoultryFarmDefaults } from '../data/devDefaults';
import { useCreatePoultryFarm } from '../hooks';
import type { CreatePoultryFarmInput } from '../types';
import type { CreatePoultryFarmFormValues } from '../validation/schemas';

const toCount = (v: string | undefined): number | undefined => {
  const s = v?.trim();
  return s ? Number(s) : undefined;
};
const orNull = (v: string | undefined): string | undefined => {
  const s = v?.trim();
  return s ? s : undefined;
};

/**
 * Route `/(app)/poultry/create` — "إضافة حقل دواجن جديد". A domain-specific
 * form: the user never sees "create organization". One `POST /organizations/farms`
 * does the whole backend transaction; on success we go to the new Farm Details.
 */
export default function PoultryFarmCreateScreen() {
  const { t } = useTranslation('poultry');
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const create = useCreatePoultryFarm();
  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});

  // DEV-ONLY: pre-filled so the form doesn't need retyping on every test run.
  // Real user contact info still wins over the dummy fallback when present.
  const dev = devDataEnabled ? devPoultryFarmDefaults() : {};
  const defaults: Partial<CreatePoultryFarmFormValues> = {
    ...dev,
    contactName: user ? `${user.firstName} ${user.lastName}`.trim() : (dev.contactName ?? ''),
    contactPhone: user?.phone ?? dev.contactPhone ?? '',
    contactEmail: user?.email ?? dev.contactEmail ?? '',
  };

  const onSubmit = (values: CreatePoultryFarmFormValues, image: LocalFile | null): void => {
    if (inFlight.current || create.isPending) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});

    const input: CreatePoultryFarmInput = {
      name: values.name.trim(),
      location: values.location.trim(),
      governorate: values.governorate,
      poultryProductionType: values.poultryProductionType,
      description: orNull(values.description) ?? null,
      address: orNull(values.address) ?? null,
      capacity: toCount(values.capacity) ?? null,
      currentBirdCount: toCount(values.currentBirdCount) ?? null,
      contactName: orNull(values.contactName) ?? null,
      contactPhone: orNull(values.contactPhone) ?? null,
      contactEmail: orNull(values.contactEmail) ?? null,
    };

    create.mutate(
      { input, image },
      {
        onSuccess: ({ organization, imageFailed }) => {
          toast.show({ tone: 'success', message: t('create.success') });
          if (imageFailed) {
            toast.show({ tone: 'warning', message: t('create.imageFailed') });
          }
          router.replace(Routes.poultryFarmDetail(organization.id));
        },
        onError: (error) => {
          setServerFields(fieldErrors(error));
          setFormError(apiErrorMessage(error));
        },
        onSettled: () => {
          inFlight.current = false;
        },
      },
    );
  };

  return (
    <OrgFormLayout title={t('create.title')}>
      <PoultryFarmForm
        defaultValues={defaults}
        submitting={create.isPending}
        formError={formError}
        serverFields={serverFields}
        onSubmit={onSubmit}
      />
    </OrgFormLayout>
  );
}
