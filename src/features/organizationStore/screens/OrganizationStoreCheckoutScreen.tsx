import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/actions';
import { Card, Icon } from '@/components/content';
import { Alert, EmptyState, Loading } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { usePublicOrganization } from '@/features/organizations';
import { useTheme } from '@/theme';

import { OrgStorePriceSummary } from '../components';
import { useOrgStoreCart, usePlaceOrgStoreOrder } from '../hooks';
import { orgStoreErrorMessage } from '../utils';

interface CheckoutForm {
  recipientName: string;
  recipientPhone: string;
  city: string;
  addressLine: string;
  note: string;
}

/** Route `/organization-store/[organizationId]/checkout` — إتمام الطلب (Cash on Delivery). */
export default function OrganizationStoreCheckoutScreen() {
  const theme = useTheme();
  const { t } = useTranslation('organizationStore');
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const store = usePublicOrganization(orgId);
  const cart = useOrgStoreCart(orgId);
  const place = usePlaceOrgStoreOrder(orgId);

  const schema = useMemo(
    () =>
      z.object({
        recipientName: z.string().trim().min(2, t('checkout.errors.name')).max(200),
        recipientPhone: z
          .string()
          .trim()
          .regex(/^[0-9+\-\s]{5,30}$/, t('checkout.errors.phone')),
        city: z.string().trim().min(1, t('checkout.errors.city')).max(120),
        addressLine: z.string().trim().min(3, t('checkout.errors.address')).max(500),
        note: z.string().trim().max(500).optional().or(z.literal('')),
      }),
    [t],
  );
  const { control, handleSubmit } = useForm<CheckoutForm>({
    resolver: zodResolver(schema),
    defaultValues: { recipientName: '', recipientPhone: '', city: '', addressLine: '', note: '' },
    mode: 'onTouched',
  });

  const onSubmit = (values: CheckoutForm) => {
    if (place.isPending) return;
    place.mutate(
      {
        paymentMethod: 'COD',
        recipientName: values.recipientName,
        recipientPhone: values.recipientPhone,
        city: values.city,
        addressLine: values.addressLine,
        note: values.note ? values.note : null,
      },
      {
        onSuccess: (order) =>
          router.replace({
            pathname: '/(app)/organization-store/orders/[orderId]',
            params: { orderId: order.id, justPlaced: '1' },
          }),
      },
    );
  };

  if (cart.isLoading) {
    return (
      <SafeAreaScreen>
        <Loading fill />
      </SafeAreaScreen>
    );
  }
  if (!cart.data || cart.data.items.length === 0) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('checkout.title')} showBack />
        <EmptyState
          icon="cart-outline"
          title={t('cart.empty')}
          actionLabel={t('cart.browse')}
          onAction={() => router.replace(Routes.veterinaryOfficeProducts(orgId))}
        />
      </SafeAreaScreen>
    );
  }

  return (
    <SafeAreaScreen>
      <AppHeader title={t('checkout.title')} subtitle={store.data?.name} showBack />
      <ScrollView
        contentContainerStyle={{
          padding: theme.screenPadding,
          rowGap: theme.spacing.lg,
          paddingBottom: theme.spacing.huge,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ rowGap: theme.spacing.md }}>
          <Label>{t('checkout.deliveryInfo')}</Label>
          <FormField
            control={control}
            name="recipientName"
            label={t('checkout.fieldName')}
            placeholder={t('checkout.fieldNamePlaceholder')}
          />
          <FormField
            control={control}
            name="recipientPhone"
            label={t('checkout.fieldPhone')}
            placeholder="07xxxxxxxxx"
            keyboardType="phone-pad"
          />
          <FormField
            control={control}
            name="city"
            label={t('checkout.fieldCity')}
            placeholder={t('checkout.fieldCityPlaceholder')}
          />
          <FormField
            control={control}
            name="addressLine"
            label={t('checkout.fieldAddress')}
            placeholder={t('checkout.fieldAddressPlaceholder')}
            multiline
            numberOfLines={3}
          />
          <FormField
            control={control}
            name="note"
            label={t('checkout.fieldNote')}
            placeholder={t('checkout.fieldNotePlaceholder')}
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={{ rowGap: theme.spacing.md }}>
          <Label>{t('checkout.paymentMethod')}</Label>
          <Card variant="outlined" padding="md">
            <View
              style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}
            >
              <Icon name="cash-outline" size="iconMd" color="primary" />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{t('checkout.cod')}</Text>
                <Caption>{t('checkout.codHint')}</Caption>
              </View>
              <Icon name="radio-button-on" size="iconSm" color="primary" />
            </View>
          </Card>
        </View>

        <View style={{ rowGap: theme.spacing.md }}>
          <Label>{t('summary.title')}</Label>
          <OrgStorePriceSummary
            subtotalAmount={cart.data.subtotalAmount}
            deliveryFee={cart.data.deliveryFee}
            totalAmount={cart.data.totalAmount}
            currency={cart.data.currency}
          />
        </View>

        {place.isError ? (
          <Alert tone="danger" message={orgStoreErrorMessage(place.error, t)} />
        ) : null}

        <Button
          label={t('checkout.confirm')}
          fullWidth
          loading={place.isPending}
          disabled={place.isPending}
          onPress={handleSubmit(onSubmit)}
        />
      </ScrollView>
    </SafeAreaScreen>
  );
}
