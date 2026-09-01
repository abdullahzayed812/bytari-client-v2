import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useToast } from '@/components/feedback';
import { Routes } from '@/constants/routes';
import { useVeterinarianStatus } from '@/features/auth';
import { useAuth } from '@/hooks';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';

import { OrganizationForm, OrgFormLayout } from '../components';
import { useCreateOrganization } from '../hooks';
import type { CreateOrganizationFormValues } from '../validation/schemas';

/**
 * Route `/organizations/create` — Add Organization. The client never sends
 * `ownerUserId` / `status` / any approval field; the backend derives the owner
 * from the JWT and starts every organization as `PENDING`.
 */
export default function CreateOrganizationScreen() {
  const { t } = useTranslation('organizations');
  const toast = useToast();
  const { refreshSession } = useAuth();
  const vet = useVeterinarianStatus();
  const create = useCreateOrganization();
  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});

  const onSubmit = (values: CreateOrganizationFormValues) => {
    if (inFlight.current || create.isPending) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});
    create.mutate(
      {
        type: values.type,
        name: values.name.trim(),
        description: values.description?.trim() ? values.description.trim() : undefined,
      },
      {
        onSuccess: (org) => {
          toast.show({ tone: 'success', message: t('form.createSuccess') });
          // A new org can change vet-side capabilities; keep the snapshot fresh.
          void refreshSession();
          router.replace(Routes.organizationDetail(org.id));
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
    <OrgFormLayout title={t('form.createTitle')}>
      <OrganizationForm
        mode="create"
        vetApproved={vet.isApproved}
        submitting={create.isPending}
        formError={formError}
        serverFields={serverFields}
        onSubmit={onSubmit}
      />
    </OrgFormLayout>
  );
}
