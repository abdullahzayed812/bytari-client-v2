import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Card } from '@/components/content';
import { Alert, ConfirmationDialog, useToast } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useUserSummary } from '@/features/users/hooks';
import { useAuth } from '@/hooks';
import { fieldErrors } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { PetFormLayout } from '../components';
import { usePet, useTransferOwnership } from '../hooks';
import {
  buildTransferSchema,
  transferErrorMessage,
  type TransferFormValues,
} from '../validation/schemas';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Route `/pets/[petId]/transfer` — transfer ownership to another user (§8).
 * There is NO backend user directory / search, so the recipient is entered as a
 * user id; the screen resolves it to a name via `GET /users/:id` and requires a
 * confirmation before the (irreversible, no-acceptance-step) transfer.
 */
export default function TransferOwnershipScreen() {
  const theme = useTheme();
  const { t } = useTranslation('pets');
  const toast = useToast();
  const { user } = useAuth();
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const id = petId ?? '';

  const pet = usePet(id);
  const transfer = useTransferOwnership(id);
  const schema = useMemo(() => buildTransferSchema(t), [t]);
  const { control, handleSubmit, watch } = useForm<TransferFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { toUserId: '', reason: '' },
    mode: 'onTouched',
  });

  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<TransferFormValues | null>(null);

  const toUserId = watch('toUserId').trim();
  const idLooksValid = UUID_RE.test(toUserId);
  const isSelf = idLooksValid && user?.id === toUserId;
  const recipient = useUserSummary(toUserId, { enabled: idLooksValid && !isSelf });

  const isOwner = Boolean(pet.data && user && pet.data.currentOwnerUserId === user.id);
  const canTransfer = isOwner && pet.data?.status === 'ACTIVE';

  const recipientName = recipient.data
    ? `${recipient.data.firstName} ${recipient.data.lastName}`.trim()
    : null;

  const submit = (values: TransferFormValues) => {
    if (inFlight.current || transfer.isPending) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});
    transfer.mutate(
      { toUserId: values.toUserId.trim(), reason: values.reason?.trim() || undefined },
      {
        onSuccess: () => {
          toast.show({ tone: 'success', message: t('transfer.success') });
          router.replace(Routes.pets);
        },
        onError: (error) => {
          setServerFields(fieldErrors(error));
          setFormError(transferErrorMessage(error, t));
        },
        onSettled: () => {
          inFlight.current = false;
        },
      },
    );
  };

  if (!pet.isLoading && !canTransfer) {
    return (
      <PetFormLayout title={t('transfer.title')}>
        <Alert tone="warning" message={t('transfer.notAllowed')} />
        <Button label={t('transfer.back')} variant="outline" onPress={() => router.back()} />
      </PetFormLayout>
    );
  }

  return (
    <PetFormLayout title={t('transfer.title')}>
      <Text variant="body">{t('transfer.intro', { name: pet.data?.name ?? '' })}</Text>

      {formError ? <Alert tone="danger" message={formError} /> : null}

      <FormField
        control={control}
        name="toUserId"
        label={t('transfer.recipientLabel')}
        placeholder={t('transfer.recipientPlaceholder')}
        hint={t('transfer.recipientHint')}
        autoCapitalize="none"
        autoCorrect={false}
        serverError={serverFields.toUserId}
      />

      {idLooksValid ? (
        <Card variant="outlined" padding="md">
          {isSelf ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.danger }}>
              {t('transfer.errors.selfTarget')}
            </Text>
          ) : recipient.isLoading ? (
            <Caption>{t('transfer.resolving')}</Caption>
          ) : recipientName ? (
            <View style={{ rowGap: 2 }}>
              <Caption>{t('transfer.recipientResolved')}</Caption>
              <Text variant="bodyStrong">{recipientName}</Text>
            </View>
          ) : (
            <Text variant="bodyMedium" style={{ color: theme.colors.danger }}>
              {t('transfer.errors.recipientNotFound')}
            </Text>
          )}
        </Card>
      ) : null}

      <FormField
        control={control}
        name="reason"
        label={t('transfer.reasonLabel')}
        placeholder={t('transfer.reasonPlaceholder')}
        multiline
        numberOfLines={3}
        serverError={serverFields.reason}
      />

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          label={t('transfer.submit')}
          fullWidth
          loading={transfer.isPending}
          disabled={transfer.isPending || isSelf || !recipientName}
          onPress={handleSubmit((values) => setConfirm(values))}
          accessibilityLabel={t('transfer.submit')}
        />
      </View>

      <ConfirmationDialog
        visible={confirm !== null}
        title={t('transfer.confirmTitle')}
        message={t('transfer.confirmBody', {
          name: recipientName ?? '',
          animal: pet.data?.name ?? '',
        })}
        confirmLabel={t('transfer.submit')}
        cancelLabel={t('transfer.cancel')}
        destructive
        loading={transfer.isPending}
        onConfirm={() => {
          const values = confirm;
          setConfirm(null);
          if (values) submit(values);
        }}
        onCancel={() => setConfirm(null)}
      />
    </PetFormLayout>
  );
}
