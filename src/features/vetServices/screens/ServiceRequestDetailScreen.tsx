import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Card, Icon } from '@/components/content';
import { ConfirmationDialog, EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { ScrollScreen, Section } from '@/components/layout';
import { Caption, Heading, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { ImageCarousel } from '@/features/organizations';
import { useAuth, useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';

import { InfoGrid, ModerationStatusBadge, OfferCard, UrgencyBadge } from '../components';
import { formatPrice, formatVetServiceDate } from '../constants';
import {
  useCloseServiceRequest,
  useDeleteServiceRequest,
  useOfferAction,
  useRequestOffers,
  useServiceRequest,
  useStartRequestConversation,
} from '../hooks';

/** Route `/(app)/vet-services/requests/[requestId]` — request details + offers. */
export default function ServiceRequestDetailScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation('vetServices');
  const toast = useToast();
  const { user } = useAuth();
  const caps = useCapabilities();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const id = requestId ?? '';

  const q = useServiceRequest(id);
  const isOwner = q.data?.petOwnerUserId === user?.id;
  const offersQ = useRequestOffers(isOwner ? id : undefined);
  const offerAction = useOfferAction();
  const startChat = useStartRequestConversation();
  const closeReq = useCloseServiceRequest();
  const del = useDeleteServiceRequest();

  const [pendingReject, setPendingReject] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const notFound = q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 403);
  if (notFound) {
    return (
      <ScrollScreen>
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

  const r = q.data;
  const canOffer = !isOwner && caps.isApprovedVeterinarian && r.status === 'APPROVED' && !r.closedAt;

  const info = [
    { icon: 'medkit-outline' as const, label: t('fields.serviceType'), value: t(`serviceType.${r.serviceType}`) },
    { icon: 'paw-outline' as const, label: t('fields.animalType'), value: t(`animalType.${r.animalType}`) },
    ...(r.animalCount
      ? [{ icon: 'apps-outline' as const, label: t('fields.animalCount'), value: String(r.animalCount) }]
      : []),
    ...(r.animalAge
      ? [{ icon: 'calendar-outline' as const, label: t('fields.animalAge'), value: r.animalAge }]
      : []),
    {
      icon: 'location-outline' as const,
      label: t('fields.location'),
      value: [r.governorate, r.district].filter(Boolean).join(' - '),
    },
    { icon: 'cash-outline' as const, label: t('fields.budget'), value: formatPrice(r.budgetAmount) },
    {
      icon: 'home-outline' as const,
      label: t('fields.needsFieldVisit'),
      value: r.needsFieldVisit ? t('common.yes') : t('common.no'),
    },
    ...(r.preferredDate
      ? [
          {
            icon: 'time-outline' as const,
            label: t('fields.preferredDate'),
            value: formatVetServiceDate(r.preferredDate, i18n.language),
          },
        ]
      : []),
  ];

  const openChat = () => {
    startChat.mutate(id, {
      onSuccess: ({ conversationId }) => router.push(Routes.vetServiceDeal(conversationId)),
      onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
    });
  };

  const runOffer = (offerId: string, action: 'accept' | 'reject') => {
    offerAction.mutate(
      { id: offerId, action },
      {
        onSuccess: () => toast.show({ tone: 'success', message: t(`offer.${action}Done`) }),
        onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
      },
    );
  };

  return (
    <ScrollScreen padded={false}>
      {r.imageUrls.length > 0 ? <ImageCarousel images={r.imageUrls} /> : null}

      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.lg }}>
        <Section spacing="lg">
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
            <UrgencyBadge urgency={r.urgency} />
            {isOwner ? <ModerationStatusBadge status={r.status} size="md" /> : null}
          </View>
          <Heading level={2} style={{ color: theme.colors.requestAccent }}>
            {r.title}
          </Heading>
          <Caption color="textMuted">
            {t('detail.requestNumber', { number: r.requestNumber })} ·{' '}
            {formatVetServiceDate(r.createdAt, i18n.language)}
          </Caption>
          <Text color="textSecondary" style={{ marginTop: theme.spacing.sm }}>
            {r.description}
          </Text>
        </Section>

        {isOwner && r.status === 'REJECTED' && r.rejectionReason ? (
          <Section spacing="lg">
            <Card variant="outlined" padding="md">
              <Caption color="textSecondary">{t('detail.rejectionReason')}</Caption>
              <Text color="danger">{r.rejectionReason}</Text>
            </Card>
          </Section>
        ) : null}

        <Section spacing="lg">
          <InfoGrid items={info} />
        </Section>

        {r.detailedAddress ? (
          <Section spacing="lg">
            <Card variant="outlined" padding="md">
              <Text variant="bodyStrong" style={{ marginBottom: 4 }}>
                {t('fields.detailedAddress')}
              </Text>
              <Text color="textSecondary">{r.detailedAddress}</Text>
            </Card>
          </Section>
        ) : null}

        {r.extraNotes ? (
          <Section spacing="lg">
            <Card variant="outlined" padding="md">
              <Text variant="bodyStrong" style={{ marginBottom: 4 }}>
                {t('fields.extraNotes')}
              </Text>
              <Text color="textSecondary">{r.extraNotes}</Text>
            </Card>
          </Section>
        ) : null}

        {canOffer ? (
          <Section spacing="lg">
            <View style={{ rowGap: theme.spacing.sm }}>
              <Button
                label={t('actions.submitOffer')}
                variant="primary"
                fullWidth
                leftIcon="paper-plane-outline"
                onPress={() => router.push(Routes.vetServiceOfferNew(id))}
              />
              <Button
                label={t('actions.contactOwner')}
                variant="outline"
                fullWidth
                leftIcon="chatbubbles-outline"
                loading={startChat.isPending}
                onPress={openChat}
              />
            </View>
          </Section>
        ) : null}

        {isOwner ? (
          <Section spacing="lg">
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text variant="bodyStrong">{t('detail.offersTitle')}</Text>
              <Icon name="pricetags-outline" size="iconSm" color="serviceAccent" />
            </View>
            {offersQ.isLoading ? (
              <Loading label={t('common.loading')} />
            ) : offersQ.offers.length === 0 ? (
              <Card variant="outlined" padding="md">
                <Text color="textSecondary">{t('detail.noOffers')}</Text>
              </Card>
            ) : (
              <View style={{ rowGap: theme.spacing.md, marginTop: theme.spacing.sm }}>
                {offersQ.offers.map((o) => (
                  <OfferCard
                    key={o.id}
                    offer={o}
                    busy={offerAction.isPending}
                    onPress={() => router.push(Routes.vetServiceEngagement('offer', o.id))}
                    onAccept={() => runOffer(o.id, 'accept')}
                    onReject={() => setPendingReject(o.id)}
                  />
                ))}
              </View>
            )}
          </Section>
        ) : null}

        {isOwner ? (
          <Section spacing="huge">
            <View style={{ rowGap: theme.spacing.sm }}>
              {!r.closedAt ? (
                <Button
                  label={t('actions.closeRequest')}
                  variant="outline"
                  fullWidth
                  leftIcon="lock-closed-outline"
                  loading={closeReq.isPending}
                  onPress={() => setConfirmClose(true)}
                />
              ) : null}
              <Button
                label={t('actions.deleteRequest')}
                variant="danger"
                fullWidth
                leftIcon="trash-outline"
                loading={del.isPending}
                onPress={() => setConfirmDelete(true)}
              />
            </View>
          </Section>
        ) : null}
      </View>

      <ConfirmationDialog
        visible={pendingReject !== null}
        title={t('offer.rejectTitle')}
        message={t('offer.rejectBody')}
        confirmLabel={t('actions.reject')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={offerAction.isPending}
        onCancel={() => setPendingReject(null)}
        onConfirm={() => {
          const oid = pendingReject;
          setPendingReject(null);
          if (oid) runOffer(oid, 'reject');
        }}
      />
      <ConfirmationDialog
        visible={confirmClose}
        title={t('actions.closeRequest')}
        message={t('detail.closeRequestBody')}
        confirmLabel={t('actions.closeRequest')}
        cancelLabel={t('common.cancel')}
        loading={closeReq.isPending}
        onCancel={() => setConfirmClose(false)}
        onConfirm={() =>
          closeReq.mutate(id, {
            onSuccess: () => {
              setConfirmClose(false);
              toast.show({ tone: 'success', message: t('detail.closeRequestDone') });
            },
            onError: (error) => {
              setConfirmClose(false);
              toast.show({ tone: 'danger', message: apiErrorMessage(error) });
            },
          })
        }
      />
      <ConfirmationDialog
        visible={confirmDelete}
        title={t('actions.deleteRequest')}
        message={t('detail.deleteRequestBody')}
        confirmLabel={t('actions.deleteRequest')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={del.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          del.mutate(id, {
            onSuccess: () => {
              setConfirmDelete(false);
              toast.show({ tone: 'success', message: t('detail.deleteRequestDone') });
              router.back();
            },
            onError: (error) => {
              setConfirmDelete(false);
              toast.show({ tone: 'danger', message: apiErrorMessage(error) });
            },
          })
        }
      />
    </ScrollScreen>
  );
}
