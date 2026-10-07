import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/actions';
import { useToast } from '@/components/feedback';
import { Row } from '@/components/layout';

import { useNotifyVaccination, useUpdateVaccination } from '../hooks';
import type { Vaccination } from '../types';
import { medicalErrorMessage } from '../validation/schemas';

import { RescheduleSheet } from './RescheduleSheet';

/**
 * Legacy clinic vaccination actions (`updateVaccinationStatus`,
 * `rescheduleVaccination`, `sendVaccinationNotification`) over the v2 PATCH /
 * notify routes. Only rendered for a vaccination THIS clinic recorded — the
 * backend still 404s anything else.
 */
export function VaccinationActions({
  organizationId,
  vaccination,
  canManage,
}: {
  organizationId: string;
  vaccination: Vaccination;
  canManage: boolean;
}) {
  const { t } = useTranslation('medical');
  const toast = useToast();
  const update = useUpdateVaccination(organizationId, vaccination.animalId);
  const notify = useNotifyVaccination(organizationId);
  const [reschedule, setReschedule] = useState(false);
  const busy = update.isPending || notify.isPending;

  const patch = (body: Parameters<typeof update.mutate>[0]['body'], onDone?: () => void) =>
    update.mutate(
      { vaccinationId: vaccination.id, body },
      {
        onSuccess: () => {
          toast.show({ tone: 'success', message: t('vaccinations.statusUpdated') });
          onDone?.();
        },
        onError: (error) => toast.show({ tone: 'danger', message: medicalErrorMessage(error, t) }),
      },
    );

  return (
    <>
      <Row gap="sm" wrap>
        {canManage && vaccination.status !== 'COMPLETED' ? (
          <Button
            label={t('vaccinations.markCompleted')}
            size="sm"
            leftIcon="checkmark-done-outline"
            disabled={busy}
            onPress={() => patch({ status: 'COMPLETED' })}
          />
        ) : null}
        {canManage ? (
          <Button
            label={t('vaccinations.reschedule')}
            size="sm"
            variant="outline"
            leftIcon="calendar-outline"
            disabled={busy}
            onPress={() => setReschedule(true)}
          />
        ) : null}
        {canManage && vaccination.status === 'SCHEDULED' ? (
          <Button
            label={t('vaccinations.markCancelled')}
            size="sm"
            variant="ghost"
            disabled={busy}
            onPress={() => patch({ status: 'CANCELLED' })}
          />
        ) : null}
        {canManage ? (
          <Button
            label={t('vaccinations.notifyOwner')}
            size="sm"
            variant="ghost"
            leftIcon="notifications-outline"
            disabled={busy}
            onPress={() =>
              notify.mutate(
                { animalId: vaccination.animalId, vaccinationId: vaccination.id },
                {
                  onSuccess: () =>
                    toast.show({ tone: 'success', message: t('vaccinations.notified') }),
                  onError: (error) =>
                    toast.show({ tone: 'danger', message: medicalErrorMessage(error, t) }),
                },
              )
            }
          />
        ) : null}
      </Row>
      <RescheduleSheet
        visible={reschedule}
        title={t('vaccinations.rescheduleTitle')}
        initialDate={vaccination.nextDueOn}
        submitting={update.isPending}
        onClose={() => setReschedule(false)}
        onSubmit={(date) =>
          patch({ nextDueOn: date, status: 'SCHEDULED' }, () => setReschedule(false))
        }
      />
    </>
  );
}
