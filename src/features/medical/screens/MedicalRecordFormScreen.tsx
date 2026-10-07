import { router, useLocalSearchParams } from 'expo-router';
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
import { MEDICAL_RECORD_TYPES, type MedicalRecordInput, type MedicalRecordType } from '../types';
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
  const { type } = useLocalSearchParams<{ type?: string }>();
  const orgId = organizationId ?? '';
  const isEdit = Boolean(recordId);
  const createType: MedicalRecordType = (MEDICAL_RECORD_TYPES as readonly string[]).includes(
    type ?? '',
  )
    ? (type as MedicalRecordType)
    : 'GENERAL';

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
  const recordType: MedicalRecordType = record?.recordType ?? createType;
  const defaults: Partial<MedicalRecordFormValues> = record
    ? {
        visitDate: record.visitDate ?? '',
        reason: record.reason ?? '',
        diagnosis: record.diagnosis ?? '',
        treatment: record.treatment ?? '',
        notes: record.notes ?? '',
        symptoms: record.symptoms ?? '',
        severity: record.severity ?? '',
        labNotes: record.labNotes ?? '',
      }
    : devDataEnabled && recordType === 'GENERAL'
      ? devMedicalRecordDefaults()
      : {};
  const defaultAttachments = record
    ? {
        prescription: record.prescriptionKey
          ? { key: record.prescriptionKey, url: record.prescriptionUrl }
          : null,
        attachments: record.attachmentKeys.map((key, i) => ({
          key,
          url: record.attachmentUrls[i] ?? null,
        })),
      }
    : undefined;

  const onSubmit = (body: MedicalRecordInput, { isDraft }: { isDraft: boolean }) => {
    if (inFlight.current || busy) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});

    const onError = (error: unknown) => {
      setServerFields(fieldErrors(error));
      setFormError(medicalErrorMessage(error, t));
    };
    const onSettled = () => {
      inFlight.current = false;
    };
    const successMessage = isDraft
      ? t('records.draftSuccess')
      : isEdit
        ? t('records.editSuccess')
        : t('records.createSuccess');

    if (isEdit && record) {
      update.mutate(
        { recordId: record.id, body },
        {
          onSuccess: () => {
            toast.show({ tone: 'success', message: successMessage });
            router.back();
          },
          onError,
          onSettled,
        },
      );
    } else {
      create.mutate(body, {
        onSuccess: () => {
          toast.show({ tone: 'success', message: successMessage });
          router.back();
        },
        onError,
        onSettled,
      });
    }
  };

  const title = isEdit
    ? t('records.editTitle')
    : recordType === 'FULL_EXAM'
      ? t('records.addTitleFullExam')
      : recordType === 'LAB'
        ? t('records.addTitleLab')
        : recordType === 'FILE'
          ? t('records.addTitleFile')
          : t('records.addTitle');

  return (
    <OrgFormLayout title={title}>
      <MedicalRecordForm
        mode={isEdit ? 'edit' : 'create'}
        recordType={recordType}
        organizationId={orgId}
        animalId={animalId}
        isDraft={record?.isDraft ?? false}
        defaultAttachments={defaultAttachments}
        defaultValues={defaults}
        submitting={busy}
        formError={formError}
        serverFields={serverFields}
        onSubmit={onSubmit}
      />
    </OrgFormLayout>
  );
}
