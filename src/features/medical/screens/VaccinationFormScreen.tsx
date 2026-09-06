import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorState, Loading, useToast } from '@/components/feedback';
import { OrgFormLayout } from '@/features/organizations';
import { fieldErrors } from '@/lib/apiError';
import { devDataEnabled } from '@/lib/env';
import { ApiError } from '@/services/api';

import { VaccinationForm } from '../components';
import { devVaccinationDefaults } from '../data/devDefaults';
import { useCreateVaccination, useUpdateVaccination, useVaccination } from '../hooks';
import type { VaccinationInput } from '../types';
import { medicalErrorMessage, type VaccinationFormValues } from '../validation/schemas';

import { useMedicalRouteScope } from './useMedicalRouteScope';

/**
 * Add / edit a vaccination — CLINIC context only. `organizationId` + `animalId`
 * come from the route; `recordedByUserId` is set by the backend. `vaccinationId`
 * present ⇒ edit mode.
 */
export default function VaccinationFormScreen() {
  const { t } = useTranslation('medical');
  const toast = useToast();
  const { animalId, organizationId, vaccinationId } = useMedicalRouteScope();
  const orgId = organizationId ?? '';
  const isEdit = Boolean(vaccinationId);

  const existing = useVaccination({ animalId, organizationId }, vaccinationId, { enabled: isEdit });
  const create = useCreateVaccination(orgId, animalId);
  const update = useUpdateVaccination(orgId, animalId);

  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const busy = create.isPending || update.isPending;

  if (isEdit && existing.isLoading) {
    return (
      <OrgFormLayout title={t('vaccinations.editTitle')}>
        <Loading fill />
      </OrgFormLayout>
    );
  }
  if (isEdit && (existing.isError || !existing.data)) {
    const notFound =
      existing.error instanceof ApiError &&
      (existing.error.status === 404 || existing.error.status === 403);
    return (
      <OrgFormLayout title={t('vaccinations.editTitle')}>
        <ErrorState
          error={existing.error}
          title={notFound ? t('vaccinations.notFoundTitle') : undefined}
          onRetry={notFound ? undefined : () => void existing.refetch()}
        />
      </OrgFormLayout>
    );
  }

  const v = existing.data;
  const defaults: Partial<VaccinationFormValues> = v
    ? {
        vaccineName: v.vaccineName,
        administeredOn: v.administeredOn,
        nextDueOn: v.nextDueOn ?? '',
        notes: v.notes ?? '',
      }
    : devDataEnabled
      ? devVaccinationDefaults()
      : {};

  const onSubmit = (values: VaccinationFormValues) => {
    if (inFlight.current || busy) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});

    const body: VaccinationInput = {
      vaccineName: values.vaccineName.trim(),
      administeredOn: values.administeredOn.trim(),
      nextDueOn: values.nextDueOn?.trim() ? values.nextDueOn.trim() : isEdit ? null : undefined,
      notes: values.notes?.trim() ? values.notes.trim() : isEdit ? null : undefined,
    };

    const onError = (error: unknown) => {
      setServerFields(fieldErrors(error));
      setFormError(medicalErrorMessage(error, t));
    };
    const onSettled = () => {
      inFlight.current = false;
    };

    if (isEdit && v) {
      update.mutate(
        { vaccinationId: v.id, body },
        {
          onSuccess: () => {
            toast.show({ tone: 'success', message: t('vaccinations.editSuccess') });
            router.back();
          },
          onError,
          onSettled,
        },
      );
    } else {
      create.mutate(body, {
        onSuccess: () => {
          toast.show({ tone: 'success', message: t('vaccinations.createSuccess') });
          router.back();
        },
        onError,
        onSettled,
      });
    }
  };

  return (
    <OrgFormLayout title={isEdit ? t('vaccinations.editTitle') : t('vaccinations.addTitle')}>
      <VaccinationForm
        mode={isEdit ? 'edit' : 'create'}
        defaultValues={defaults}
        submitting={busy}
        formError={formError}
        serverFields={serverFields}
        onSubmit={onSubmit}
      />
    </OrgFormLayout>
  );
}
