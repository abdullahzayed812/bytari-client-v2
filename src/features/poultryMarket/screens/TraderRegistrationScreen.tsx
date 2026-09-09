import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert, EmptyState, useToast } from '@/components/feedback';
import { Checkbox, FormField, Select, TileOptionGroup } from '@/components/forms';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label } from '@/components/typography';
import { IRAQ_GOVERNORATES } from '@/constants/governorates';
import { Advertisement } from '@/features/ads';
import { useAuthStore } from '@/features/auth/store';
import { useAuth } from '@/hooks';
import { fieldErrors } from '@/lib/apiError';
import { useTheme } from '@/theme';


import { BenefitsCard } from '../components';
import { TRADER_TYPE_ORDER } from '../constants';
import { useRegisterTrader, useTraderStatus } from '../hooks';
import type { TraderType } from '../types';
import { buildRegisterTraderSchema, marketErrorMessage, type RegisterTraderFormValues } from '../validation/schemas';

/**
 * Starter values — the form opens pre-filled so registration is one review
 * away. The signed-in user's phone still takes precedence, and the user must
 * actively accept the terms.
 */
const DEFAULTS: RegisterTraderFormValues = {
  displayName: 'تاجر الدواجن النموذجي',
  traderType: 'WHOLESALE',
  governorate: 'بغداد',
  district: 'الكرادة',
  phone: '07701234567',
  whatsapp: '07701234567',
  bio: 'تاجر دواجن بالجملة في بغداد.',
  termsAccepted: false as unknown as true,
};

/** Route `/(app)/poultry/trader-register` — trader registration + status view. */
export default function TraderRegistrationScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultryMarket');
  const toast = useToast();
  const { refreshSession } = useAuth();
  const user = useAuthStore((s) => s.user);
  const trader = useTraderStatus();
  const register = useRegisterTrader();

  const schema = useMemo(() => buildRegisterTraderSchema(t), [t]);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const inFlight = useRef(false);

  const defaults: RegisterTraderFormValues = {
    ...DEFAULTS,
    phone: user?.phone ?? DEFAULTS.phone,
  };

  const { control, handleSubmit } = useForm<RegisterTraderFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
    mode: 'onTouched',
  });

  const onSubmit = handleSubmit((values) => {
    if (inFlight.current || register.isPending) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});
    register.mutate(
      {
        displayName: values.displayName.trim(),
        traderType: values.traderType,
        governorate: values.governorate,
        district: values.district?.trim() || undefined,
        phone: values.phone.trim(),
        whatsapp: values.whatsapp?.trim() || undefined,
        bio: values.bio?.trim() || undefined,
        termsAccepted: true,
      },
      {
        onSuccess: async () => {
          toast.show({ tone: 'success', message: t('register.success') });
          await refreshSession();
        },
        onError: (error) => {
          setServerFields(fieldErrors(error));
          setFormError(marketErrorMessage(error, t));
        },
        onSettled: () => {
          inFlight.current = false;
        },
      },
    );
  });

  const typeOptions = TRADER_TYPE_ORDER.map((v: TraderType) => ({
    value: v,
    label: t(`register.type.${v}`),
  }));
  const governorateOptions = IRAQ_GOVERNORATES.map((g) => ({ label: g, value: g }));

  if (trader.status !== 'NOT_REGISTERED' && trader.status !== 'REJECTED') {
    return (
      <ScrollScreen>
        <AppHeader title={t('register.title')} showBack />
        <View style={{ flex: 1, justifyContent: 'center', padding: theme.screenPadding }}>
          <EmptyState
            icon={trader.isApproved ? 'checkmark-circle-outline' : trader.isSuspended ? 'ban-outline' : 'time-outline'}
            title={
              trader.isApproved
                ? t('status.approvedTitle')
                : trader.isSuspended
                  ? t('status.suspendedTitle')
                  : t('status.pendingTitle')
            }
            message={trader.isApproved ? undefined : trader.isSuspended ? t('status.suspendedFallback') : t('status.pendingBody')}
          />
        </View>
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen>
      <AppHeader title={t('register.title')} showBack backAlign="left" />

      <Section spacing="xl" style={{ rowGap: theme.spacing.lg }}>
        <Advertisement placement="TRADER_REGISTRATION" />

        <BenefitsCard />

        {formError ? <Alert tone="danger" message={formError} /> : null}
        {trader.isRejected ? <Alert tone="warning" message={t('gate.rejectedTitle')} /> : null}

        <FormField
          control={control}
          name="displayName"
          label={t('register.displayNameLabel')}
          placeholder={t('register.displayNamePlaceholder')}
          serverError={serverFields.displayName}
        />

        <Label>{t('register.typeLabel')}</Label>
        <Controller
          control={control}
          name="traderType"
          render={({ field: { value, onChange } }) => (
            <TileOptionGroup options={typeOptions} value={value} onChange={onChange} />
          )}
        />

        <Controller
          control={control}
          name="governorate"
          render={({ field: { value, onChange }, fieldState }) => (
            <Select
              label={t('register.governorateLabel')}
              placeholder={t('register.governoratePlaceholder')}
              value={value || null}
              options={governorateOptions}
              onChange={onChange}
              error={fieldState.error?.message ?? serverFields.governorate}
            />
          )}
        />

        <FormField
          control={control}
          name="district"
          label={t('register.districtLabel')}
          serverError={serverFields.district}
        />

        <FormField
          control={control}
          name="phone"
          label={t('register.phoneLabel')}
          keyboardType="phone-pad"
          serverError={serverFields.phone}
        />

        <FormField
          control={control}
          name="whatsapp"
          label={t('register.whatsappLabel')}
          keyboardType="phone-pad"
          serverError={serverFields.whatsapp}
        />

        <FormField
          control={control}
          name="bio"
          label={t('register.bioLabel')}
          multiline
          numberOfLines={3}
          serverError={serverFields.bio}
        />

        <Controller
          control={control}
          name="termsAccepted"
          render={({ field: { value, onChange }, fieldState }) => (
            <View style={{ rowGap: 4 }}>
              <Checkbox
                label={`${t('register.termsPrefix')} ${t('register.termsLink')}`}
                checked={value === true}
                onChange={onChange}
              />
              {fieldState.error ? <Caption color="danger">{fieldState.error.message}</Caption> : null}
            </View>
          )}
        />

        <View style={{ marginTop: theme.spacing.sm }}>
          <Button
            label={t('register.submit')}
            fullWidth
            loading={register.isPending}
            disabled={register.isPending}
            onPress={onSubmit}
            accessibilityLabel={t('register.submit')}
          />
        </View>

        <View
          style={{
            alignItems: 'center',
            paddingVertical: theme.spacing.md,
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            borderColor: theme.colors.success,
            backgroundColor: theme.colors.successSoft,
          }}
        >
          <Caption style={{ color: theme.colors.success }}>{t('register.trialBanner')}</Caption>
        </View>
      </Section>
    </ScrollScreen>
  );
}
