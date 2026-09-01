import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorState, Loading, useToast } from '@/components/feedback';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';
import { ApiError } from '@/services/api';

import { OrganizationForm, OrgFormLayout } from '../components';
import { useOrganization, useUpdateOrganization } from '../hooks';
import type { UpdateOrganizationInput } from '../types';

/**
 * Route `/organizations/[organizationId]/edit` — profile fields only (name,
 * description). `type`, `status`, ownership and approval are never sent. The
 * backend enforces `organization.update`; a caller without it gets a 403 that
 * is mapped to a safe Arabic message.
 */
export default function OrganizationEditScreen() {
  const { t } = useTranslation('organizations');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const q = useOrganization(organizationId);
  const update = useUpdateOrganization(organizationId ?? '');

  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});

  if (q.isLoading) {
    return (
      <OrgFormLayout title={t('form.editTitle')}>
        <Loading fill />
      </OrgFormLayout>
    );
  }
  if (q.isError || !q.data) {
    const denied =
      q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 403);
    return (
      <OrgFormLayout title={t('form.editTitle')}>
        <ErrorState
          error={q.error}
          title={denied ? t('detail.notAvailableTitle') : undefined}
          onRetry={denied ? undefined : () => void q.refetch()}
        />
      </OrgFormLayout>
    );
  }

  const org = q.data;

  const onSubmit = (values: { name: string; description: string }) => {
    if (inFlight.current || update.isPending) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});
    const payload: UpdateOrganizationInput = {
      name: values.name.trim(),
      description: values.description.trim() ? values.description.trim() : null,
    };
    update.mutate(payload, {
      onSuccess: () => {
        toast.show({ tone: 'success', message: t('form.editSuccess') });
        router.back();
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
    <OrgFormLayout title={t('form.editTitle')}>
      <OrganizationForm
        mode="edit"
        defaultValues={{ name: org.name, description: org.description ?? '' }}
        submitting={update.isPending}
        formError={formError}
        serverFields={serverFields}
        onSubmit={onSubmit}
      />
    </OrgFormLayout>
  );
}
