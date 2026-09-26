import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorState, Loading, useToast } from '@/components/feedback';
import { OrgFormLayout, orgCapabilities, useOrganization } from '@/features/organizations';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';
import { ApiError } from '@/services/api';

import { CattleBatchForm } from '../components';
import { useCattleBatch, useCreateCattleBatch, useUpdateCattleBatch } from '../hooks';
import type { CreateCattleBatchInput, UpdateCattleBatchInput } from '../types';
import type { CattleBatchFormValues } from '../validation/schemas';

/** Add/edit a cattle batch. Mirrors `SheepBatchFormScreen` exactly. */
export default function CattleBatchFormScreen() {
  const { t } = useTranslation('sheepCattleFarm');
  const toast = useToast();
  const { organizationId, batchId } = useLocalSearchParams<{
    organizationId: string;
    batchId?: string;
  }>();
  const orgId = organizationId ?? '';
  const isEdit = Boolean(batchId);

  const existing = useCattleBatch(orgId, batchId, { enabled: isEdit });
  const create = useCreateCattleBatch(orgId);
  // The sale price is farm-financial data: only the owner / admin sees and sets it.
  const { isAdmin } = useCapabilities();
  const orgDetail = useOrganization(orgId);
  const showPrice = orgCapabilities(orgDetail.data?.myRole, isAdmin).canViewFarmFinancials;
  const update = useUpdateCattleBatch(orgId);

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
    const notFound =
      existing.error instanceof ApiError &&
      (existing.error.status === 404 || existing.error.status === 403);
    return (
      <OrgFormLayout title={t('batchForm.editTitle')}>
        <ErrorState
          error={existing.error}
          title={notFound ? t('batchForm.notFoundTitle') : undefined}
          onRetry={notFound ? undefined : () => void existing.refetch()}
        />
      </OrgFormLayout>
    );
  }

  const batch = existing.data;
  const defaults: Partial<CattleBatchFormValues> = batch
    ? {
        name: batch.name,
        breed: batch.breed ?? '',
        headCount: String(batch.headCount),
        calfCount: batch.calfCount != null ? String(batch.calfCount) : '',
        bullCount: batch.bullCount != null ? String(batch.bullCount) : '',
        cowCount: batch.cowCount != null ? String(batch.cowCount) : '',
        arrivalDate: batch.arrivalDate,
        targetPricePerKg:
          batch.targetPricePerKg != null ? String(Number(batch.targetPricePerKg)) : '',
        notes: batch.notes ?? '',
      }
    : {};

  const onSubmit = (values: CattleBatchFormValues) => {
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
      calfCount: toCount(values.calfCount),
      bullCount: toCount(values.bullCount),
      cowCount: toCount(values.cowCount),
      arrivalDate: values.arrivalDate.trim(),
      targetPricePerKg:
        showPrice && values.targetPricePerKg ? Number(values.targetPricePerKg) : undefined,
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
        { batchId: batch.id, body: base as UpdateCattleBatchInput },
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
      create.mutate(base as CreateCattleBatchInput, {
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
    <OrgFormLayout title={isEdit ? t('batchForm.editTitle') : t('batchForm.addCattleTitle')}>
      <CattleBatchForm
        showPrice={showPrice}
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
