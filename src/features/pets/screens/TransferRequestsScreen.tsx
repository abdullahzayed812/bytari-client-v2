import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/actions';
import { Card, Icon, type IconName } from '@/components/content';
import {
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  Loading,
  useToast,
} from '@/components/feedback';
import { FormField, Select, SegmentedControl } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { BackButton } from '@/components/navigation';
import { BottomSheet } from '@/components/overlays/BottomSheet';
import { Caption, Heading, Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { devDataEnabled } from '@/lib/env';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import {
  useAcceptTransferRequest,
  useCancelTransferRequest,
  useCreateTransferRequest,
  usePets,
  useReceivedTransferRequests,
  useRejectTransferRequest,
  useSentTransferRequests,
} from '../hooks';
import type { AnimalTransferRequest, TransferRequestStatus } from '../types';
import {
  buildTransferRequestSchema,
  transferRequestErrorMessage,
  type TransferRequestFormValues,
} from '../validation/schemas';

type Tab = 'received' | 'sent';

const STATUS_COLOR: Record<TransferRequestStatus, 'warning' | 'success' | 'danger' | 'textMuted'> =
  {
    PENDING: 'warning',
    ACCEPTED: 'success',
    REJECTED: 'danger',
    CANCELLED: 'textMuted',
  };

const SPECIES_ICON: Record<string, IconName> = {
  DOG: 'paw-outline',
  CAT: 'paw-outline',
  BIRD: 'egg-outline',
  RABBIT: 'paw-outline',
  REPTILE: 'paw-outline',
  FISH: 'fish-outline',
  HORSE: 'paw-outline',
  OTHER: 'paw-outline',
};

type PendingAction = { requestId: string; kind: 'accept' | 'reject' | 'cancel' } | null;

/**
 * Route `/pets/transfer-requests` — "نقل الملكية". The only way to move an
 * animal's ownership now — there is no instant transfer. Two always-separate
 * lists (never client-filtered from one query): requests I sent (awaiting the
 * recipient) and requests I received (mine to accept/reject). Accepting is the
 * only action that actually moves ownership — `POST
 * /animal-transfer-requests/:id/accept`. Reject/cancel never touch ownership.
 *
 * Opened two ways: from Pets Landing (general — browse sent/received), or
 * from a pet's own "نقل الملكية" button with `?petId=`, which jumps straight
 * into the create sheet with that pet preselected.
 */
export default function TransferRequestsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('pets');
  const toast = useToast();
  const { petId: preselectedPetId } = useLocalSearchParams<{ petId?: string }>();
  const [tab, setTab] = useState<Tab>('received');
  const [pending, setPending] = useState<PendingAction>(null);
  const [showCreate, setShowCreate] = useState(false);

  const sent = useSentTransferRequests({ enabled: tab === 'sent' });
  const received = useReceivedTransferRequests({ enabled: tab === 'received' });
  const q = tab === 'sent' ? sent : received;

  const accept = useAcceptTransferRequest();
  const reject = useRejectTransferRequest();
  const cancel = useCancelTransferRequest();
  const acting = accept.isPending || reject.isPending || cancel.isPending;

  const myPets = usePets({ status: 'ACTIVE', pageSize: 50, enabled: showCreate });
  const create = useCreateTransferRequest();
  const [createAnimalId, setCreateAnimalId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const requestSchema = useMemo(() => buildTransferRequestSchema(t), [t]);
  const createForm = useForm<TransferRequestFormValues>({
    resolver: zodResolver(requestSchema),
    // DEV-ONLY: pre-filled so the form doesn't need retyping on every test run.
    // `toUserId` is a real recipient's account id and can't be faked, so it's
    // left blank even in dev.
    defaultValues: {
      toUserId: '',
      reason: devDataEnabled ? 'رغبة في نقل ملكية الحيوان لصديق موثوق' : '',
    },
    mode: 'onTouched',
  });

  const openCreate = (petId: string | null = null) => {
    setCreateAnimalId(petId);
    setCreateError(null);
    createForm.reset({
      toUserId: '',
      reason: devDataEnabled ? 'رغبة في نقل ملكية الحيوان لصديق موثوق' : '',
    });
    setShowCreate(true);
  };

  // Opened from a specific pet's details ("نقل الملكية") — jump straight to
  // "propose a transfer" for that pet instead of the sent/received lists.
  useEffect(() => {
    if (!preselectedPetId) return;
    setCreateAnimalId(preselectedPetId);
    setShowCreate(true);
  }, [preselectedPetId]);

  const submitCreate = createForm.handleSubmit((values) => {
    if (!createAnimalId || create.isPending) return;
    setCreateError(null);
    create.mutate(
      { animalId: createAnimalId, input: { toUserId: values.toUserId, reason: values.reason } },
      {
        onSuccess: () => {
          toast.show({ tone: 'success', message: t('transferRequests.sendSuccess') });
          setShowCreate(false);
          setTab('sent');
        },
        onError: (error) => setCreateError(transferRequestErrorMessage(error, t)),
      },
    );
  });

  const runPending = () => {
    if (!pending) return;
    const { requestId, kind } = pending;
    const onError = (error: unknown) =>
      toast.show({ message: apiErrorMessage(error), tone: 'danger' });
    if (kind === 'accept') {
      accept.mutate(requestId, {
        onSuccess: () => {
          toast.show({ tone: 'success', message: t('transferRequests.acceptSuccess') });
          setPending(null);
        },
        onError: (e) => {
          onError(e);
          setPending(null);
        },
      });
      return;
    }
    if (kind === 'reject') {
      reject.mutate(
        { requestId },
        {
          onSuccess: () => {
            toast.show({ tone: 'success', message: t('transferRequests.rejectSuccess') });
            setPending(null);
          },
          onError: (e) => {
            onError(e);
            setPending(null);
          },
        },
      );
      return;
    }
    cancel.mutate(requestId, {
      onSuccess: () => {
        toast.show({ tone: 'success', message: t('transferRequests.cancelSuccess') });
        setPending(null);
      },
      onError: (e) => {
        onError(e);
        setPending(null);
      },
    });
  };

  return (
    <SafeAreaScreen>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.screenPadding,
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
          <BackButton />
          <Heading level={3}>{t('transferRequests.title')}</Heading>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('transferRequests.newRequest')}
          onPress={() => openCreate()}
          hitSlop={8}
          style={({ pressed }) => [
            {
              width: theme.sizes.controlHeightSm,
              height: theme.sizes.controlHeightSm,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Icon name="add" size="iconSm" color="onPrimary" />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: theme.screenPadding, paddingBottom: theme.spacing.md }}>
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'received', label: t('transferRequests.tabReceived') },
            { value: 'sent', label: t('transferRequests.tabSent') },
          ]}
        />
      </View>

      <View
        style={{
          flex: 1,
          paddingHorizontal: theme.screenPadding,
          rowGap: theme.spacing.sm,
        }}
      >
        {q.isLoading ? (
          <Loading fill />
        ) : q.isError ? (
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        ) : q.data && q.data.items.length > 0 ? (
          q.data.items.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              tab={tab}
              busy={acting && pending?.requestId === request.id}
              onAccept={() => setPending({ requestId: request.id, kind: 'accept' })}
              onReject={() => setPending({ requestId: request.id, kind: 'reject' })}
              onCancel={() => setPending({ requestId: request.id, kind: 'cancel' })}
            />
          ))
        ) : (
          <EmptyState
            icon="swap-horizontal-outline"
            title={
              tab === 'sent' ? t('transferRequests.emptySent') : t('transferRequests.emptyReceived')
            }
          />
        )}
      </View>

      <ConfirmationDialog
        visible={pending !== null}
        title={t(`transferRequests.confirm.${pending?.kind ?? 'accept'}Title`)}
        message={t(`transferRequests.confirm.${pending?.kind ?? 'accept'}Body`)}
        confirmLabel={t(`transferRequests.confirm.${pending?.kind ?? 'accept'}Action`)}
        cancelLabel={t('transferRequests.confirm.cancelButton')}
        destructive={pending?.kind !== 'accept'}
        loading={acting}
        onConfirm={runPending}
        onCancel={() => setPending(null)}
      />

      <BottomSheet
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        title={t('transferRequests.newRequest')}
      >
        <View style={{ rowGap: theme.spacing.md }}>
          <Select<string>
            label={t('transferRequests.petLabel')}
            placeholder={t('transferRequests.petPlaceholder')}
            value={createAnimalId}
            options={myPets.pets.map((p) => ({ value: p.id, label: p.name }))}
            onChange={setCreateAnimalId}
          />
          <FormField
            control={createForm.control}
            name="toUserId"
            label={t('transferRequests.recipientLabel')}
            placeholder={t('transferRequests.recipientPlaceholder')}
            hint={t('transferRequests.recipientHint')}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <FormField
            control={createForm.control}
            name="reason"
            label={t('transferRequests.reasonLabel')}
            placeholder={t('transferRequests.reasonPlaceholder')}
            multiline
            numberOfLines={3}
          />
          {createError ? (
            <Text variant="body" style={{ color: theme.colors.danger }}>
              {createError}
            </Text>
          ) : null}
          <Button
            label={t('transferRequests.send')}
            fullWidth
            loading={create.isPending}
            disabled={create.isPending || !createAnimalId}
            onPress={() => void submitCreate()}
            accessibilityLabel={t('transferRequests.send')}
          />
        </View>
      </BottomSheet>
    </SafeAreaScreen>
  );
}

function RequestCard({
  request,
  tab,
  busy,
  onAccept,
  onReject,
  onCancel,
}: {
  request: AnimalTransferRequest;
  tab: Tab;
  busy: boolean;
  onAccept: () => void;
  onReject: () => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('pets');
  const counterpart = tab === 'received' ? request.fromUser : request.toUser;
  const counterpartName = `${counterpart.firstName} ${counterpart.lastName}`.trim();
  const statusColor = STATUS_COLOR[request.status];
  const isPending = request.status === 'PENDING';

  return (
    <Card variant="outlined" padding="md">
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.colors.surfaceAccent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon
            name={SPECIES_ICON[request.animal.species] ?? 'paw-outline'}
            size="iconMd"
            color="primary"
          />
        </View>
        <View style={{ flex: 1, rowGap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {request.animal.name}
          </Text>
          <Caption numberOfLines={1}>
            {t(tab === 'received' ? 'transferRequests.fromLabel' : 'transferRequests.toLabel', {
              name: counterpartName,
            })}
          </Caption>
        </View>
        <Text variant="label" color={statusColor}>
          {t(`transferRequests.status.${request.status}`)}
        </Text>
      </View>

      {request.reason ? (
        <Text
          variant="body"
          color="textSecondary"
          style={{ marginTop: theme.spacing.sm }}
          numberOfLines={2}
        >
          {request.reason}
        </Text>
      ) : null}

      {request.status === 'REJECTED' && request.responseReason ? (
        <Text
          variant="caption"
          color="danger"
          style={{ marginTop: theme.spacing.xs }}
          numberOfLines={2}
        >
          {t('transferRequests.declinedWithReason', { reason: request.responseReason })}
        </Text>
      ) : null}

      <Caption style={{ marginTop: theme.spacing.sm }}>{formatDate(request.createdAt)}</Caption>

      {isPending && tab === 'received' ? (
        <View
          style={{
            flexDirection: 'row',
            columnGap: theme.spacing.sm,
            marginTop: theme.spacing.md,
          }}
        >
          <Button
            label={t('transferRequests.accept')}
            variant="primary"
            loading={busy}
            disabled={busy}
            onPress={onAccept}
            accessibilityLabel={t('transferRequests.accept')}
          />
          <Button
            label={t('transferRequests.reject')}
            variant="outline"
            loading={busy}
            disabled={busy}
            onPress={onReject}
            accessibilityLabel={t('transferRequests.reject')}
          />
        </View>
      ) : null}

      {isPending && tab === 'sent' ? (
        <View style={{ marginTop: theme.spacing.md }}>
          <Button
            label={t('transferRequests.cancel')}
            variant="outline"
            loading={busy}
            disabled={busy}
            onPress={onCancel}
            accessibilityLabel={t('transferRequests.cancel')}
          />
        </View>
      ) : null}
    </Card>
  );
}
