import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/actions';
import { ConfirmationDialog, useToast } from '@/components/feedback';
import { Row } from '@/components/layout';
import { Routes } from '@/constants/routes';

import { useDeleteReminder, useNotifyReminder, useSaveReminder } from '../hooks';
import type { AnimalReminder } from '../types';
import { medicalErrorMessage } from '../validation/schemas';

import { RescheduleSheet } from './RescheduleSheet';

/**
 * Clinic reminder actions (the creating clinic only): edit · complete /
 * reopen · reschedule · notify owner · delete. Nothing renders for the owner —
 * clinic-created reminders are read-only for them. Every call is re-authorized
 * by the backend.
 */
export function ReminderActions({
  reminder,
  organizationId,
  canManage,
}: {
  reminder: AnimalReminder;
  /** The clinic context — without it nothing is rendered. */
  organizationId?: string;
  canManage: boolean;
}) {
  const { t } = useTranslation('medical');
  const toast = useToast();
  const orgId = organizationId ?? '';
  const save = useSaveReminder(orgId, reminder.animalId);
  const del = useDeleteReminder(organizationId, reminder.animalId);
  const notify = useNotifyReminder(orgId);
  const [reschedule, setReschedule] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const busy = save.isPending || del.isPending || notify.isPending;
  const onError = (error: unknown) =>
    toast.show({ tone: 'danger', message: medicalErrorMessage(error, t) });

  const patch = (body: Parameters<typeof save.mutate>[0]['body'], onDone?: () => void) =>
    save.mutate(
      { reminderId: reminder.id, body },
      {
        onSuccess: () => {
          toast.show({ tone: 'success', message: t('reminders.editSuccess') });
          onDone?.();
        },
        onError,
      },
    );

  if (!canManage || !organizationId) return null;

  return (
    <>
      <Row gap="sm" wrap>
        {organizationId ? (
          <>
            <Button
              label={reminder.isCompleted ? t('reminders.reopen') : t('reminders.markDone')}
              size="sm"
              leftIcon={reminder.isCompleted ? 'refresh-outline' : 'checkmark-done-outline'}
              disabled={busy}
              onPress={() => patch({ isCompleted: !reminder.isCompleted })}
            />
            <Button
              label={t('reminders.reschedule')}
              size="sm"
              variant="outline"
              leftIcon="calendar-outline"
              disabled={busy}
              onPress={() => setReschedule(true)}
            />
            <Button
              label={t('reminders.notifyOwner')}
              size="sm"
              variant="ghost"
              leftIcon="notifications-outline"
              disabled={busy}
              onPress={() =>
                notify.mutate(
                  { animalId: reminder.animalId, reminderId: reminder.id },
                  {
                    onSuccess: () =>
                      toast.show({ tone: 'success', message: t('reminders.notified') }),
                    onError,
                  },
                )
              }
            />
            <Button
              label={t('records.editCta')}
              size="sm"
              variant="ghost"
              leftIcon="create-outline"
              disabled={busy}
              onPress={() =>
                router.push(Routes.orgAnimalReminderEdit(orgId, reminder.animalId, reminder.id))
              }
            />
          </>
        ) : null}
        <Button
          label={t('reminders.deleteCta')}
          size="sm"
          variant="ghost"
          leftIcon="trash-outline"
          disabled={busy}
          onPress={() => setConfirmDelete(true)}
        />
      </Row>

      <RescheduleSheet
        visible={reschedule}
        title={t('reminders.rescheduleTitle')}
        initialDate={reminder.reminderDate}
        submitting={save.isPending}
        onClose={() => setReschedule(false)}
        onSubmit={(date) => patch({ reminderDate: date }, () => setReschedule(false))}
      />
      <ConfirmationDialog
        visible={confirmDelete}
        title={t('reminders.deleteConfirmTitle')}
        message={t('reminders.deleteConfirmBody')}
        confirmLabel={t('reminders.deleteCta')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={del.isPending}
        onConfirm={() => {
          setConfirmDelete(false);
          del.mutate(
            { reminderId: reminder.id },
            {
              onSuccess: () =>
                toast.show({ tone: 'success', message: t('reminders.deleteSuccess') }),
              onError,
            },
          );
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
