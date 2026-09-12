import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/actions';
import { Alert, EmptyState, Loading, useToast } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { Label } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { PaymentMethodOption, PriceSummary, StoreHeader } from '../components';
import { useVeterinarianStoreCart, usePlaceVeterinarianStoreOrder } from '../hooks';
import {
  VET_STORE_ENABLED_PAYMENT_METHODS,
  VET_STORE_PAYMENT_METHODS,
  type VetStorePaymentMethod,
} from '../types';

interface CheckoutForm {
  recipientName: string;
  recipientPhone: string;
  city: string;
  addressLine: string;
  note: string;
}

/** Route `/veterinarian-store/checkout` — إتمام الطلب. Cash on Delivery only for now. */
export default function VeterinarianStoreCheckoutScreen() {
  const theme = useTheme();
  const { t } = useTranslation('veterinarianStore');
  const toast = useToast();

  const cart = useVeterinarianStoreCart();
  const place = usePlaceVeterinarianStoreOrder();
  const [method, setMethod] = useState<VetStorePaymentMethod>('COD');

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

  const onSubmit = (values: CheckoutForm): void => {
    place.mutate(
      {
        paymentMethod: method,
        recipientName: values.recipientName,
        recipientPhone: values.recipientPhone,
        city: values.city,
        addressLine: values.addressLine,
        note: values.note ? values.note : null,
      },
      {
        onSuccess: (order) =>
          router.replace({
            pathname: '/(app)/veterinarian-store/orders/[orderId]',
            params: { orderId: order.id, justPlaced: '1' },
          }),
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  if (cart.isLoading)
    return (
      <SafeAreaScreen>
        <Loading fill />
      </SafeAreaScreen>
    );
  if (!cart.data || cart.data.items.length === 0) {
    return (
      <SafeAreaScreen>
        <StoreHeader title={t('checkout.title')} showBack />
        <EmptyState
          icon="cart-outline"
          title={t('cart.empty')}
          actionLabel={t('cart.browse')}
          onAction={() => router.replace(Routes.veterinarianStore)}
        />
      </SafeAreaScreen>
    );
  }

  return (
    <SafeAreaScreen>
      <StoreHeader title={t('checkout.title')} subtitle={t('checkout.subtitle')} showBack />

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
            placeholder="05xxxxxxxx"
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
          {VET_STORE_PAYMENT_METHODS.map((m) => (
            <PaymentMethodOption
              key={m}
              method={m}
              selected={method === m}
              disabled={!VET_STORE_ENABLED_PAYMENT_METHODS.includes(m)}
              onSelect={() => setMethod(m)}
            />
          ))}
        </View>

        <View style={{ rowGap: theme.spacing.md }}>
          <Label>{t('summary.title')}</Label>
          <PriceSummary
            subtotalAmount={cart.data.subtotalAmount}
            deliveryFee={cart.data.deliveryFee}
            totalAmount={cart.data.totalAmount}
          />
        </View>

        {place.isError ? <Alert tone="danger" message={apiErrorMessage(place.error)} /> : null}

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
