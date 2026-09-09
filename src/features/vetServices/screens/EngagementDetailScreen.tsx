import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Avatar, Card } from '@/components/content';
import { ConfirmationDialog, EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useAuth } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';

import { EngagementStatusBadge, InfoGrid, type InfoItem } from '../components';
import { formatPrice, formatVetServiceDate } from '../constants';
import { useListingRequest, useListingRequestAction, useOffer, useOfferAction } from '../hooks';

type Kind = 'offer' | 'listing-request';

/** Route `/(app)/vet-services/engagements/[kind]/[engagementId]`. */
export default function EngagementDetailScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation('vetServices');
  const toast = useToast();
  const { user } = useAuth();
  const { kind: kindParam, engagementId } = useLocalSearchParams<{ kind: string; engagementId: string }>();
  const kind: Kind = kindParam === 'offer' ? 'offer' : 'listing-request';
  const id = engagementId ?? '';

  const offerQ = useOffer(kind === 'offer' ? id : undefined);
  const lrQ = useListingRequest(kind === 'listing-request' ? id : undefined);
  const offerAction = useOfferAction();
  const lrAction = useListingRequestAction();
  const [confirm, setConfirm] = useState<null | 'reject' | 'cancel' | 'withdraw' | 'complete'>(null);

  const q = kind === 'offer' ? offerQ : lrQ;
  const busy = offerAction.isPending || lrAction.isPending;

  const notFound = q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 403);
  if (notFound) {
    return (
      <ScrollScreen>
        <AppHeader title={t('engagement.title')} showBack />
        <EmptyState
          icon="lock-closed-outline"
          title={t('detail.notFoundTitle')}
          message={t('detail.notFoundBody')}
          actionLabel={t('common.back')}
          onAction={() => router.back()}
        />
      </ScrollScreen>
    );
  }
  if (q.isError) {
    return (
      <ScrollScreen>
        <AppHeader title={t('engagement.title')} showBack />
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </ScrollScreen>
    );
  }
  if (q.isLoading || !q.data) {
    return (
      <ScrollScreen padded={false}>
        <Loading fill />
      </ScrollScreen>
    );
  }

  const uid = user?.id;
  const run = (action: 'accept' | 'reject' | 'withdraw' | 'cancel' | 'complete') => {
    const onSuccess = () => toast.show({ tone: 'success', message: t(`engagement.${action}Done`) });
    const onError = (error: unknown) => toast.show({ tone: 'danger', message: apiErrorMessage(error) });
    if (kind === 'offer') {
      offerAction.mutate({ id, action: action as 'accept' | 'reject' | 'withdraw' | 'complete' }, { onSuccess, onError });
    } else {
      lrAction.mutate({ id, action: action as 'accept' | 'reject' | 'cancel' | 'complete' }, { onSuccess, onError });
    }
  };

  let counterpartName = '';
  let subjectTitle = '';
  let status: string;
  let conversationId: string | null;
  let info: InfoItem[];
  let canDecide = false; // accept / reject
  let canCancel = false; // owner cancel (LR) / vet withdraw (offer)

  if (kind === 'offer') {
    const o = offerQ.data!;
    status = o.status;
    conversationId = o.conversationId;
    counterpartName = `${o.veterinarian.firstName} ${o.veterinarian.lastName}`;
    subjectTitle = o.request?.title ?? o.request?.requestNumber ?? '';
    canDecide = o.status === 'PENDING' && o.request?.petOwnerUserId === uid;
    canCancel = o.status === 'PENDING' && o.veterinarianUserId === uid;
    info = [
      { icon: 'cash-outline', label: t('fields.proposedAmount'), value: formatPrice(o.proposedAmount) },
      ...(o.executionDate
        ? [{ icon: 'calendar-outline' as const, label: t('fields.executionDate'), value: formatVetServiceDate(o.executionDate, i18n.language) }]
        : []),
      ...(o.expectedDuration
        ? [{ icon: 'hourglass-outline' as const, label: t('fields.expectedDuration'), value: o.expectedDuration }]
        : []),
      {
        icon: 'home-outline',
        label: t('fields.includesFieldVisit'),
        value: o.includesFieldVisit ? t('common.yes') : t('common.no'),
      },
    ];
  } else {
    const lr = lrQ.data!;
    status = lr.status;
    conversationId = lr.conversationId;
    counterpartName = `${lr.petOwner.firstName} ${lr.petOwner.lastName}`;
    subjectTitle = lr.listing?.title ?? lr.requestNumber;
    canDecide = lr.status === 'PENDING' && lr.listing?.veterinarianUserId === uid;
    canCancel = lr.status === 'PENDING' && lr.petOwnerUserId === uid;
    info = [
      { icon: 'paw-outline', label: t('fields.animalType'), value: t(`animalType.${lr.animalType}`) },
      ...(lr.animalCount
        ? [{ icon: 'apps-outline' as const, label: t('fields.animalCount'), value: String(lr.animalCount) }]
        : []),
      ...(lr.governorate
        ? [{ icon: 'location-outline' as const, label: t('fields.location'), value: [lr.governorate, lr.district].filter(Boolean).join(' - ') }]
        : []),
      { icon: 'cash-outline', label: t('fields.budget'), value: formatPrice(lr.budgetAmount) },
      {
        icon: 'home-outline',
        label: t('fields.needsFieldVisit'),
        value: lr.needsFieldVisit ? t('common.yes') : t('common.no'),
      },
      ...(lr.preferredDatetime
        ? [{ icon: 'time-outline' as const, label: t('fields.preferredDatetime'), value: formatVetServiceDate(lr.preferredDatetime, i18n.language) }]
        : []),
    ];
  }

  const details = kind === 'offer' ? offerQ.data?.details : lrQ.data?.notes;
  const cancelAction = kind === 'offer' ? 'withdraw' : 'cancel';

  return (
    <ScrollScreen>
      <AppHeader title={t('engagement.title')} showBack />

      <Section spacing="lg">
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
          <Avatar name={counterpartName} size="avatarMd" />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">{counterpartName}</Text>
            <Caption color="textSecondary">{subjectTitle}</Caption>
          </View>
          <EngagementStatusBadge status={status as never} size="md" />
        </View>
      </Section>

      <Section spacing="lg">
        <InfoGrid items={info} />
      </Section>

      {details ? (
        <Section spacing="lg">
          <Card variant="outlined" padding="md">
            <Text variant="bodyStrong" style={{ marginBottom: 4 }}>
              {t('engagement.notesTitle')}
            </Text>
            <Text color="textSecondary">{details}</Text>
          </Card>
        </Section>
      ) : null}

      <Section spacing="huge">
        <View style={{ rowGap: theme.spacing.sm }}>
          {canDecide ? (
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Button
                  label={t('actions.reject')}
                  variant="danger"
                  fullWidth
                  leftIcon="close"
                  disabled={busy}
                  onPress={() => setConfirm('reject')}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label={t('actions.approve')}
                  variant="primary"
                  fullWidth
                  leftIcon="checkmark"
                  loading={busy}
                  onPress={() => run('accept')}
                />
              </View>
            </View>
          ) : null}

          {canCancel ? (
            <Button
              label={t(`actions.${cancelAction}`)}
              variant="outline"
              fullWidth
              leftIcon="close-circle-outline"
              disabled={busy}
              onPress={() => setConfirm(cancelAction)}
            />
          ) : null}

          {status === 'ACCEPTED' && conversationId ? (
            <>
              <Button
                label={t('actions.openConversation')}
                variant="primary"
                fullWidth
                leftIcon="chatbubbles-outline"
                onPress={() => router.push(Routes.vetServiceDeal(conversationId as string))}
              />
              <Button
                label={t('actions.completeDeal')}
                variant="outline"
                fullWidth
                leftIcon="checkmark-done-outline"
                disabled={busy}
                onPress={() => setConfirm('complete')}
              />
            </>
          ) : null}
        </View>
      </Section>

      <ConfirmationDialog
        visible={confirm !== null}
        title={t(`engagement.confirm.${confirm ?? 'reject'}.title`)}
        message={t(`engagement.confirm.${confirm ?? 'reject'}.body`)}
        confirmLabel={t(`actions.${confirm === 'complete' ? 'completeDeal' : confirm ?? 'reject'}`)}
        cancelLabel={t('common.cancel')}
        destructive={confirm !== 'complete'}
        loading={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const action = confirm;
          setConfirm(null);
          if (action) run(action);
        }}
      />
    </ScrollScreen>
  );
}
