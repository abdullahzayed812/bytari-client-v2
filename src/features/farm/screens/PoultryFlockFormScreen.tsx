import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrorState, Loading, useToast } from '@/components/feedback';
import { farmErrorMessage } from '@/features/farmShared';
import { OrgFormLayout } from '@/features/organizations';
import { fieldErrors } from '@/lib/apiError';
import { devDataEnabled } from '@/lib/env';
import { ApiError } from '@/services/api';

import { PoultryFlockForm } from '../components';
import { devPoultryFlockDefaults } from '../data/devDefaults';
import { useCreatePoultryFlock, usePoultryFlock, useUpdatePoultryFlock } from '../hooks';
import type { CreatePoultryFlockInput, UpdatePoultryFlockInput } from '../types';
import type { PoultryFlockFormValues } from '../validation/schemas';

/**
 * Add / edit a poultry flock. `organizationId` comes from the route;
 * `createdByUserId` is set by the backend. `flockId` present ⇒ edit mode.
 * A CLOSED flock rejects content edits (backend `POULTRY_FLOCK_NOT_ACTIVE`).
 */
export default function PoultryFlockFormScreen() {
  const { t } = useTranslation('farm');
  const toast = useToast();
  const { organizationId, flockId } = useLocalSearchParams<{
    organizationId: string;
    flockId?: string;
  }>();
  const orgId = organizationId ?? '';
  const isEdit = Boolean(flockId);

  const existing = usePoultryFlock(orgId, flockId, { enabled: isEdit });
  const create = useCreatePoultryFlock(orgId);
  const update = useUpdatePoultryFlock(orgId);

  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const busy = create.isPending || update.isPending;

  if (isEdit && existing.isLoading) {
    return (
      <OrgFormLayout title={t('poultry.editTitle')}>
        <Loading fill />
      </OrgFormLayout>
    );
  }
  if (isEdit && (existing.isError || !existing.data)) {
    const notFound =
      existing.error instanceof ApiError &&
      (existing.error.status === 404 || existing.error.status === 403);
    return (
      <OrgFormLayout title={t('poultry.editTitle')}>
        <ErrorState
          error={existing.error}
          title={notFound ? t('poultry.notFoundTitle') : undefined}
          onRetry={notFound ? undefined : () => void existing.refetch()}
        />
      </OrgFormLayout>
    );
  }

  const flock = existing.data;
  const defaults: Partial<PoultryFlockFormValues> = flock
    ? {
        name: flock.name,
        birdType: flock.birdType,
        birdCount: String(flock.birdCount),
        arrivalDate: flock.arrivalDate,
        notes: flock.notes ?? '',
      }
    : devDataEnabled
      ? devPoultryFlockDefaults()
      : {};

  const onSubmit = (values: PoultryFlockFormValues) => {
    if (inFlight.current || busy) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});

    const notes = values.notes?.trim() ? values.notes.trim() : isEdit ? null : undefined;
    const base = {
      name: values.name.trim(),
      birdType: values.birdType,
      birdCount: Number(values.birdCount),
      arrivalDate: values.arrivalDate.trim(),
      notes,
    };

    const onError = (error: unknown) => {
      setServerFields(fieldErrors(error));
      setFormError(farmErrorMessage(error, t));
    };
    const onSettled = () => {
      inFlight.current = false;
    };

    if (isEdit && flock) {
      update.mutate(
        { flockId: flock.id, body: base as UpdatePoultryFlockInput },
        {
          onSuccess: () => {
            toast.show({ tone: 'success', message: t('poultry.editSuccess') });
            router.back();
          },
          onError,
          onSettled,
        },
      );
    } else {
      create.mutate(base as CreatePoultryFlockInput, {
        onSuccess: () => {
          toast.show({ tone: 'success', message: t('poultry.createSuccess') });
          router.back();
        },
        onError,
        onSettled,
      });
    }
  };

  return (
    <OrgFormLayout title={isEdit ? t('poultry.editTitle') : t('poultry.addTitle')}>
      <PoultryFlockForm
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
