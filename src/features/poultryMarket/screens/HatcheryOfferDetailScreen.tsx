import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { Button } from '@/components/actions';
import { Card, Divider } from '@/components/content';
import {
  Alert,
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  SkeletonText,
  useToast,
} from '@/components/feedback';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useAuthStore } from '@/features/auth/store';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';
import { formatDate, openPhone } from '@/utils';

import { MarketAccessGate } from '../components/MarketAccessGate';
import { useDeleteHatcheryOffer, useHatcheryOffer } from '../hooks';
import type { HatcheryOffer } from '../types';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Row justify="space-between" align="center">
      <Caption>{label}</Caption>
      <Text variant="bodyMedium" numberOfLines={1} style={{ maxWidth: '60%' }}>
        {value}
      </Text>
    </Row>
  );
}

/** Route `/(app)/poultry/hatchery-market/[offerId]` — hatchery offer detail (عروض المفاقس). */
export default function HatcheryOfferDetailScreen() {
  const { t } = useTranslation('poultryMarket');
  return (
    <MarketAccessGate title={t('hatcheryMarket.title')}>
      <HatcheryOfferDetailContent />
    </MarketAccessGate>
  );
}

function HatcheryOfferDetailContent() {
  const theme = useTheme();
  const { t } = useTranslation('poultryMarket');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const { isAdmin, isSupervisorOf } = useCapabilities();
  const user = useAuthStore((s) => s.user);
  const { offerId } = useLocalSearchParams<{ offerId: string }>();

  const q = useHatcheryOffer(offerId);
  const del = useDeleteHatcheryOffer();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const notFound =
    q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 403);
  if (notFound) {
    return (
      <ScrollScreen>
        <AppHeader title={t('hatcheryMarket.title')} showBack />
        <EmptyState icon="help-circle-outline" title={t('hatcheryMarket.notFound')} />
      </ScrollScreen>
    );
  }
  if (q.isError) {
    return (
      <ScrollScreen>
        <AppHeader title={t('hatcheryMarket.title')} showBack />
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </ScrollScreen>
    );
  }

  const offer: HatcheryOffer | undefined = q.data;
  const canManage =
    Boolean(offer) && (offer!.traderUserId === user?.id || isAdmin || isSupervisorOf('MARKET'));

  return (
    <ScrollScreen>
      <AppHeader title={t(`hatcheryMarket.chickType.${offer?.chickType ?? 'OTHER'}`)} showBack />

      {q.isLoading || !offer ? (
        <Section spacing="xl">
          <SkeletonText lines={6} />
        </Section>
      ) : (
        <>
          {offer.imageUrls[0] ? (
            <Section spacing="lg">
              <Image
                source={offer.imageUrls[0]}
                style={{ width: '100%', height: 220, borderRadius: theme.radius.xl }}
                contentFit="cover"
              />
            </Section>
          ) : null}

          {canManage && offer.moderationStatus && offer.moderationStatus !== 'APPROVED' ? (
            <Section spacing="lg">
              <Alert
                tone={offer.moderationStatus === 'REJECTED' ? 'danger' : 'info'}
                message={[
                  t(`hatcheryMarket.moderation.${offer.moderationStatus}`),
                  offer.moderationStatus === 'REJECTED' ? offer.rejectionReason : null,
                ]
                  .filter(Boolean)
                  .join(' — ')}
              />
            </Section>
          ) : null}

          <Section spacing="xl">
            <Label>{t('hatcheryMarket.detailTitle')}</Label>
            <Card variant="outlined">
              <Field
                label={t('hatcheryMarket.fieldChickType')}
                value={t(`hatcheryMarket.chickType.${offer.chickType}`)}
              />
              {offer.breed ? (
                <>
                  <Divider spacing="sm" />
                  <Field label={t('hatcheryMarket.breedLabel')} value={offer.breed} />
                </>
              ) : null}
              <Divider spacing="sm" />
              <Field
                label={t('hatcheryMarket.ageLabel')}
                value={t('hatcheryMarket.ageValue', { days: offer.chickAgeDays })}
              />
              <Divider spacing="sm" />
              <Field
                label={t('hatcheryMarket.productionDateLabel')}
                value={formatDate(offer.productionDate)}
              />
              {offer.quantity != null ? (
                <>
                  <Divider spacing="sm" />
                  <Field label={t('hatcheryMarket.quantityLabel')} value={String(offer.quantity)} />
                </>
              ) : null}
              {offer.pricePerChick != null ? (
                <>
                  <Divider spacing="sm" />
                  <Field
                    label={t('hatcheryMarket.pricePerChickLabel')}
                    value={`${offer.pricePerChick} ${t('hatcheryMarket.currency')}`}
                  />
                </>
              ) : null}
            </Card>
          </Section>

          <Section spacing="xl">
            <Label>{t('hatcheryMarket.locationTitle')}</Label>
            <Card variant="outlined">
              <Field label={t('hatcheryMarket.governorateLabel')} value={offer.governorate} />
              {offer.district ? (
                <>
                  <Divider spacing="sm" />
                  <Field label={t('hatcheryMarket.districtLabel')} value={offer.district} />
                </>
              ) : null}
            </Card>
          </Section>

          {offer.notes ? (
            <Section spacing="xl">
              <Label>{t('hatcheryMarket.notesLabel')}</Label>
              <Card variant="outlined" padding="md">
                <Text variant="body">{offer.notes}</Text>
              </Card>
            </Section>
          ) : null}

          <Section spacing="xl">
            <Label>{t('hatcheryMarket.sellerTitle')}</Label>
            <Card variant="outlined">
              <Field label={t('hatcheryMarket.phoneLabel')} value={offer.phone} />
              {offer.whatsapp ? (
                <>
                  <Divider spacing="sm" />
                  <Field label={t('hatcheryMarket.whatsappLabel')} value={offer.whatsapp} />
                </>
              ) : null}
            </Card>
          </Section>

          <Section spacing="xl">
            <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
              <View style={{ flex: 1 }}>
                <Button
                  label={t('actions.call')}
                  variant="primary"
                  fullWidth
                  leftIcon="call-outline"
                  onPress={() => void openPhone(offer.phone)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label={t('actions.whatsapp')}
                  variant="primary"
                  fullWidth
                  leftIcon="logo-whatsapp"
                  onPress={() =>
                    void Linking.openURL(
                      `https://wa.me/${(offer.whatsapp ?? offer.phone).replace(/\D/g, '')}`,
                    )
                  }
                />
              </View>
            </View>
            {canManage ? (
              <View style={{ marginTop: theme.spacing.md }}>
                <Button
                  label={t('actions.delete')}
                  variant="danger"
                  fullWidth
                  leftIcon="trash-outline"
                  onPress={() => setConfirmDelete(true)}
                />
              </View>
            ) : null}
          </Section>

          <ConfirmationDialog
            visible={confirmDelete}
            title={t('deleteConfirm.title')}
            message={t('deleteConfirm.body')}
            confirmLabel={t('actions.delete')}
            cancelLabel={tc('actions.cancel')}
            destructive
            loading={del.isPending}
            onConfirm={() => {
              setConfirmDelete(false);
              del.mutate(
                { offerId: offer.id },
                {
                  onSuccess: () => {
                    toast.show({ tone: 'success', message: t('hatcheryMarket.deleteSuccess') });
                    router.replace(Routes.hatcheryMarket);
                  },
                  onError: (error) =>
                    toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
                },
              );
            }}
            onCancel={() => setConfirmDelete(false)}
          />
        </>
      )}
    </ScrollScreen>
  );
}
