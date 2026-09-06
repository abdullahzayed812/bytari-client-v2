import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorState, Loading, useToast } from '@/components/feedback';
import { OrgFormLayout } from '@/features/organizations';
import { fieldErrors } from '@/lib/apiError';
import { devDataEnabled } from '@/lib/env';
import { ApiError } from '@/services/api';

import { MedicalRecordForm } from '../components';
import { devMedicalRecordDefaults } from '../data/devDefaults';
import { useCreateMedicalRecord, useMedicalRecord, useUpdateMedicalRecord } from '../hooks';
import type { MedicalRecordInput } from '../types';
import { medicalErrorMessage, type MedicalRecordFormValues } from '../validation/schemas';

import { useMedicalRouteScope } from './useMedicalRouteScope';

/**
 * Add / edit a medical record — CLINIC context only (owners never route here).
 * `organizationId` + `animalId` come from the route; `recordedByUserId` is set
 * by the backend from the JWT. `recordId` present ⇒ edit mode.
 */
export default function MedicalRecordFormScreen() {
  const { t } = useTranslation('medical');
  const toast = useToast();
  const { animalId, organizationId, recordId } = useMedicalRouteScope();
  const orgId = organizationId ?? '';
  const isEdit = Boolean(recordId);

  const existing = useMedicalRecord({ animalId, organizationId }, recordId, { enabled: isEdit });
  const create = useCreateMedicalRecord(orgId, animalId);
  const update = useUpdateMedicalRecord(orgId, animalId);

  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const busy = create.isPending || update.isPending;

  if (isEdit && existing.isLoading) {
    return (
      <OrgFormLayout title={t('records.editTitle')}>
        <Loading fill />
      </OrgFormLayout>
    );
  }
  if (isEdit && (existing.isError || !existing.data)) {
    const notFound =
      existing.error instanceof ApiError &&
      (existing.error.status === 404 || existing.error.status === 403);
    return (
      <OrgFormLayout title={t('records.editTitle')}>
        <ErrorState
          error={existing.error}
          title={notFound ? t('records.notFoundTitle') : undefined}
          onRetry={notFound ? undefined : () => void existing.refetch()}
        />
      </OrgFormLayout>
    );
  }

  const record = existing.data;
  const defaults: Partial<MedicalRecordFormValues> = record
    ? {
        visitDate: record.visitDate ?? '',
        reason: record.reason ?? '',
        diagnosis: record.diagnosis ?? '',
        treatment: record.treatment ?? '',
        notes: record.notes ?? '',
      }
    : devDataEnabled
      ? devMedicalRecordDefaults()
      : {};

  const onSubmit = (values: MedicalRecordFormValues) => {
    if (inFlight.current || busy) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});

    // Blank optional strings → omitted (create) / null (edit clears the field).
    const trim = (s?: string) => (s?.trim() ? s.trim() : undefined);
    const createBody: MedicalRecordInput = {
      visitDate: trim(values.visitDate),
      reason: trim(values.reason),
      diagnosis: trim(values.diagnosis),
      treatment: trim(values.treatment),
      notes: trim(values.notes),
    };
    const editBody: MedicalRecordInput = {
      visitDate: trim(values.visitDate),
      reason: values.reason?.trim() ? values.reason.trim() : null,
      diagnosis: values.diagnosis?.trim() ? values.diagnosis.trim() : null,
      treatment: values.treatment?.trim() ? values.treatment.trim() : null,
      notes: values.notes?.trim() ? values.notes.trim() : null,
    };

    const onError = (error: unknown) => {
      setServerFields(fieldErrors(error));
      setFormError(medicalErrorMessage(error, t));
    };
    const onSettled = () => {
      inFlight.current = false;
    };

    if (isEdit && record) {
      update.mutate(
        { recordId: record.id, body: editBody },
        {
          onSuccess: () => {
            toast.show({ tone: 'success', message: t('records.editSuccess') });
            router.back();
          },
          onError,
          onSettled,
        },
      );
    } else {
      create.mutate(createBody, {
        onSuccess: () => {
          toast.show({ tone: 'success', message: t('records.createSuccess') });
          router.back();
        },
        onError,
        onSettled,
      });
    }
  };

  return (
    <OrgFormLayout title={isEdit ? t('records.editTitle') : t('records.addTitle')}>
      <MedicalRecordForm
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
