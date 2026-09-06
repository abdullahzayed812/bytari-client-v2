import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorState, Loading, useToast } from '@/components/feedback';
import { OrgFormLayout } from '@/features/organizations';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';
import { ApiError } from '@/services/api';

import { SheepBatchForm } from '../components';
import { useCreateSheepBatch, useSheepBatch, useUpdateSheepBatch } from '../hooks';
import type { CreateSheepBatchInput, UpdateSheepBatchInput } from '../types';
import type { SheepBatchFormValues } from '../validation/schemas';

/** Add/edit a sheep batch. Mirrors `PoultryFlockFormScreen` exactly. */
export default function SheepBatchFormScreen() {
  const { t } = useTranslation('sheepCattleFarm');
  const toast = useToast();
  const { organizationId, batchId } = useLocalSearchParams<{ organizationId: string; batchId?: string }>();
  const orgId = organizationId ?? '';
  const isEdit = Boolean(batchId);

  const existing = useSheepBatch(orgId, batchId, { enabled: isEdit });
  const create = useCreateSheepBatch(orgId);
  const update = useUpdateSheepBatch(orgId);

  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const busy = create.isPending || update.isPending;

  if (isEdit && existing.isLoading) {
    return (
      <OrgFormLayout title={t('batchForm.editTitle')}>
        <Loading fill />
      </OrgFormLayout>
    );
  }
  if (isEdit && (existing.isError || !existing.data)) {
    const notFound = existing.error instanceof ApiError && (existing.error.status === 404 || existing.error.status === 403);
    return (
      <OrgFormLayout title={t('batchForm.editTitle')}>
        <ErrorState error={existing.error} title={notFound ? t('batchForm.notFoundTitle') : undefined} onRetry={notFound ? undefined : () => void existing.refetch()} />
      </OrgFormLayout>
    );
  }

  const batch = existing.data;
  const defaults: Partial<SheepBatchFormValues> = batch
    ? {
        name: batch.name,
        breed: batch.breed ?? '',
        headCount: String(batch.headCount),
        lambCount: batch.lambCount != null ? String(batch.lambCount) : '',
        maleCount: batch.maleCount != null ? String(batch.maleCount) : '',
        femaleCount: batch.femaleCount != null ? String(batch.femaleCount) : '',
        arrivalDate: batch.arrivalDate,
        notes: batch.notes ?? '',
      }
    : {};

  const onSubmit = (values: SheepBatchFormValues) => {
    if (inFlight.current || busy) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});

    const toCount = (v: string | undefined): number | null | undefined => {
      const s = v?.trim();
      return s ? Number(s) : isEdit ? null : undefined;
    };
    const notes = values.notes?.trim() ? values.notes.trim() : isEdit ? null : undefined;
    const breed = values.breed?.trim() ? values.breed.trim() : isEdit ? null : undefined;
    const base = {
      name: values.name.trim(),
      breed,
      headCount: Number(values.headCount),
      lambCount: toCount(values.lambCount),
      maleCount: toCount(values.maleCount),
      femaleCount: toCount(values.femaleCount),
      arrivalDate: values.arrivalDate.trim(),
      notes,
    };

    const onError = (error: unknown) => {
      setServerFields(fieldErrors(error));
      setFormError(apiErrorMessage(error));
    };
    const onSettled = () => {
      inFlight.current = false;
    };

    if (isEdit && batch) {
      update.mutate(
        { batchId: batch.id, body: base as UpdateSheepBatchInput },
        {
          onSuccess: () => {
            toast.show({ tone: 'success', message: t('batchForm.editSuccess') });
            router.back();
          },
          onError,
          onSettled,
        },
      );
    } else {
      create.mutate(base as CreateSheepBatchInput, {
        onSuccess: () => {
          toast.show({ tone: 'success', message: t('batchForm.createSuccess') });
          router.back();
        },
        onError,
        onSettled,
      });
    }
  };

  return (
    <OrgFormLayout title={isEdit ? t('batchForm.editTitle') : t('batchForm.addSheepTitle')}>
      <SheepBatchForm mode={isEdit ? 'edit' : 'create'} defaultValues={defaults} submitting={busy} formError={formError} serverFields={serverFields} onSubmit={onSubmit} />
    </OrgFormLayout>
  );
}
