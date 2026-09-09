import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { Button } from '@/components/actions';
import { Card, Icon } from '@/components/content';
import { ConfirmationDialog, EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { ScrollScreen, Section } from '@/components/layout';
import { Caption, Heading, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { ImageCarousel } from '@/features/organizations';
import { useAuth } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';

import { InfoGrid, ModerationStatusBadge } from '../components';
import { formatPrice } from '../constants';
import {
  useCloseServiceListing,
  useDeleteServiceListing,
  useServiceListing,
  useStartListingConversation,
} from '../hooks';

/** Route `/(app)/vet-services/listings/[listingId]` — service details (screenshot 2B). */
export default function ServiceListingDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('vetServices');
  const toast = useToast();
  const { user } = useAuth();
  const { listingId, manage } = useLocalSearchParams<{ listingId: string; manage?: string }>();
  const id = listingId ?? '';
  const isManage = manage === '1';

  const q = useServiceListing(id, { manage: isManage });
  const startChat = useStartListingConversation();
  const closeListing = useCloseServiceListing();
  const del = useDeleteServiceListing();
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

  const l = q.data;
  const isOwner = l.veterinarianUserId === user?.id;
  const canEngage = !isOwner && l.status === 'APPROVED' && !l.closedAt;

  const info = [
    { icon: 'medkit-outline' as const, label: t('fields.serviceType'), value: t(`serviceType.${l.serviceType}`) },
    { icon: 'paw-outline' as const, label: t('fields.animalType'), value: t(`animalType.${l.animalType}`) },
    {
      icon: 'location-outline' as const,
      label: t('fields.location'),
      value: [l.governorate, l.district].filter(Boolean).join(' - '),
    },
    { icon: 'cash-outline' as const, label: t('fields.price'), value: formatPrice(l.priceAmount) },
    { icon: 'pricetag-outline' as const, label: t('fields.priceType'), value: t(`priceType.${l.priceType}`) },
    { icon: 'business-outline' as const, label: t('fields.locationMode'), value: t(`locationMode.${l.locationMode}`) },
    ...(l.specialty ? [{ icon: 'ribbon-outline' as const, label: t('fields.specialty'), value: l.specialty }] : []),
    ...(l.availability
      ? [{ icon: 'time-outline' as const, label: t('fields.availability'), value: l.availability }]
      : []),
    ...(l.executionDuration
      ? [{ icon: 'hourglass-outline' as const, label: t('fields.executionDuration'), value: l.executionDuration }]
      : []),
    ...(l.arrivalTime
      ? [{ icon: 'walk-outline' as const, label: t('fields.arrivalTime'), value: l.arrivalTime }]
      : []),
  ];

  const openChat = () => {
    startChat.mutate(id, {
      onSuccess: ({ conversationId }) => router.push(Routes.vetServiceDeal(conversationId)),
      onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
    });
  };

  return (
    <ScrollScreen padded={false}>
      <ImageCarousel images={l.imageUrls} />

      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.lg }}>
        {(isManage || isOwner) && l.status !== 'APPROVED' ? (
          <Section spacing="lg">
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
              <ModerationStatusBadge status={l.status} size="md" />
              <Text variant="bodyMedium">{t(`ownerStatusLine.${l.status}`)}</Text>
            </View>
            {l.status === 'REJECTED' && l.rejectionReason ? (
              <View style={{ marginTop: theme.spacing.sm, rowGap: 4 }}>
                <Caption color="textSecondary">{t('detail.rejectionReason')}</Caption>
                <Text color="danger">{l.rejectionReason}</Text>
              </View>
            ) : null}
          </Section>
        ) : null}

        <Section spacing="lg">
          <Heading level={2} style={{ color: theme.colors.serviceAccent }}>
            {l.title}
          </Heading>
          <Text color="textSecondary">
            {t('common.doctorPrefix', {
              name: `${l.veterinarian.firstName} ${l.veterinarian.lastName}`,
            })}
          </Text>
          <Text color="textSecondary" style={{ marginTop: theme.spacing.sm }}>
            {l.description}
          </Text>
        </Section>

        <Section spacing="lg">
          <InfoGrid items={info} />
        </Section>

        {l.details.length > 0 ? (
          <Section spacing="lg">
            <Card variant="outlined" padding="md">
              <Text variant="bodyStrong" style={{ marginBottom: theme.spacing.sm }}>
                {t('detail.detailsTitle')}
              </Text>
              <View style={{ rowGap: theme.spacing.xs }}>
                {l.details.map((d, i) => (
                  <View key={i} style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
                    <Icon name="checkmark-circle-outline" size="iconSm" color="serviceAccent" />
                    <Text style={{ flex: 1 }}>{d}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </Section>
        ) : null}

        {(l.contactPhone || l.contactWhatsapp) && canEngage ? (
          <Section spacing="lg">
            <Card variant="outlined" padding="md">
              <Text variant="bodyStrong" style={{ marginBottom: theme.spacing.sm }}>
                {t('detail.contactTitle')}
              </Text>
              {l.contactPhone ? (
                <Button
                  label={l.contactPhone}
                  variant="ghost"
                  leftIcon="call-outline"
                  onPress={() => void Linking.openURL(`tel:${l.contactPhone ?? ''}`)}
                />
              ) : null}
              {l.contactWhatsapp ? (
                <Button
                  label={l.contactWhatsapp}
                  variant="ghost"
                  leftIcon="logo-whatsapp"
                  onPress={() => void Linking.openURL(`https://wa.me/${(l.contactWhatsapp ?? '').replace(/\D/g, '')}`)}
                />
              ) : null}
            </Card>
          </Section>
        ) : null}

        <Section spacing="huge">
          {canEngage ? (
            <View style={{ rowGap: theme.spacing.sm }}>
              <Button
                label={t('actions.requestService')}
                variant="primary"
                fullWidth
                leftIcon="clipboard-outline"
                onPress={() => router.push(Routes.vetServiceListingRequest(id))}
              />
              <Button
                label={t('actions.contactVet')}
                variant="outline"
                fullWidth
                leftIcon="chatbubbles-outline"
                loading={startChat.isPending}
                onPress={openChat}
              />
            </View>
          ) : null}

          {isOwner ? (
            <View style={{ rowGap: theme.spacing.sm }}>
              {!l.closedAt && l.status === 'APPROVED' ? (
                <Button
                  label={t('actions.closeListing')}
                  variant="outline"
                  fullWidth
                  leftIcon="lock-closed-outline"
                  loading={closeListing.isPending}
                  onPress={() => setConfirmClose(true)}
                />
              ) : null}
              <Button
                label={t('actions.deleteListing')}
                variant="danger"
                fullWidth
                leftIcon="trash-outline"
                loading={del.isPending}
                onPress={() => setConfirmDelete(true)}
              />
            </View>
          ) : null}
        </Section>
      </View>

      <ConfirmationDialog
        visible={confirmClose}
        title={t('actions.closeListing')}
        message={t('detail.closeListingBody')}
        confirmLabel={t('actions.closeListing')}
        cancelLabel={t('common.cancel')}
        loading={closeListing.isPending}
        onCancel={() => setConfirmClose(false)}
        onConfirm={() =>
          closeListing.mutate(id, {
            onSuccess: () => {
              setConfirmClose(false);
              toast.show({ tone: 'success', message: t('detail.closeListingDone') });
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
        title={t('actions.deleteListing')}
        message={t('detail.deleteListingBody')}
        confirmLabel={t('actions.deleteListing')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={del.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() =>
          del.mutate(id, {
            onSuccess: () => {
              setConfirmDelete(false);
              toast.show({ tone: 'success', message: t('detail.deleteListingDone') });
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
