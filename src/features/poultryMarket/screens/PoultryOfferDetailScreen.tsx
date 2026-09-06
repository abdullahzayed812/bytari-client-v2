import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { Button } from '@/components/actions';
import { Card, Divider } from '@/components/content';
import { ConfirmationDialog, EmptyState, ErrorState, SkeletonText, useToast } from '@/components/feedback';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useAuthStore } from '@/features/auth/store';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';

import { useDeletePoultryOffer, usePoultryOffer } from '../hooks';
import type { PoultryOffer } from '../types';

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

/** Route `/(app)/poultry/market/[offerId]` — poultry offer detail. */
export default function PoultryOfferDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultryMarket');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const { isAdmin, isSupervisorOf } = useCapabilities();
  const user = useAuthStore((s) => s.user);
  const { offerId } = useLocalSearchParams<{ offerId: string }>();

  const q = usePoultryOffer(offerId);
  const del = useDeletePoultryOffer();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const notFound = q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 403);
  if (notFound) {
    return (
      <ScrollScreen>
        <AppHeader title={t('poultryMarket.title')} showBack />
        <EmptyState icon="help-circle-outline" title={t('poultryMarket.notFound')} />
      </ScrollScreen>
    );
  }
  if (q.isError) {
    return (
      <ScrollScreen>
        <AppHeader title={t('poultryMarket.title')} showBack />
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </ScrollScreen>
    );
  }

  const offer: PoultryOffer | undefined = q.data;
  const canManage = Boolean(offer) && (offer!.traderUserId === user?.id || isAdmin || isSupervisorOf('MARKET'));

  return (
    <ScrollScreen>
      <AppHeader title={t(`poultryMarket.birdType.${offer?.birdType ?? 'OTHER'}`)} showBack />

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

          <Section spacing="xl">
            <Label>{t('poultryMarket.detailTitle')}</Label>
            <Card variant="outlined">
              {offer.breed ? (
                <>
                  <Field label={t('poultryMarket.strainLabel')} value={offer.breed} />
                  <Divider spacing="sm" />
                </>
              ) : null}
              <Field
                label={t('poultryMarket.quantityLabel')}
                value={`${offer.quantity} ${t('poultryMarket.unitBird')}`}
              />
              <Divider spacing="sm" />
              <Field
                label={t(`poultryMarket.pricingMethod.${offer.pricingMethod}`)}
                value={`${offer.price} ${t('poultryMarket.currency')}`}
              />
              {offer.ageWeeks != null ? (
                <>
                  <Divider spacing="sm" />
                  <Field
                    label={t('poultryMarket.ageLabel')}
                    value={`${offer.ageWeeks} ${t('poultryMarket.unitWeek')}`}
                  />
                </>
              ) : null}
              {offer.weightKg != null ? (
                <>
                  <Divider spacing="sm" />
                  <Field label={t('poultryMarket.weightLabel')} value={offer.weightKg} />
                </>
              ) : null}
            </Card>
          </Section>

          <Section spacing="xl">
            <Label>{t('poultryMarket.locationTitle')}</Label>
            <Card variant="outlined">
              <Field label={t('poultryMarket.governorateLabel')} value={offer.governorate} />
              {offer.district ? (
                <>
                  <Divider spacing="sm" />
                  <Field label={t('poultryMarket.districtLabel')} value={offer.district} />
                </>
              ) : null}
            </Card>
          </Section>

          {offer.notes ? (
            <Section spacing="xl">
              <Label>{t('poultryMarket.notesLabel')}</Label>
              <Card variant="outlined" padding="md">
                <Text variant="body">{offer.notes}</Text>
              </Card>
            </Section>
          ) : null}

          <Section spacing="xl">
            <Label>{t('poultryMarket.sellerTitle')}</Label>
            <Card variant="outlined">
              <Field label={t('poultryMarket.phoneLabel')} value={offer.phone} />
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
                  onPress={() => void Linking.openURL(`tel:${offer.phone}`)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label={t('actions.whatsapp')}
                  variant="primary"
                  fullWidth
                  leftIcon="logo-whatsapp"
                  onPress={() =>
                    void Linking.openURL(`https://wa.me/${(offer.whatsapp ?? offer.phone).replace(/\D/g, '')}`)
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
                    toast.show({ tone: 'success', message: t('poultryMarket.deleteSuccess') });
                    router.replace(Routes.poultryMarket);
                  },
                  onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
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
