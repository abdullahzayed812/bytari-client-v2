import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Icon } from '@/components/content';
import { Alert, EmptyState, useToast } from '@/components/feedback';
import { FormField, Select, TileOptionGroup } from '@/components/forms';
import { ImagePreview } from '@/components/media';
import { IRAQ_GOVERNORATES } from '@/constants/governorates';
import { useAuthStore } from '@/features/auth/store';
import { OrgFormLayout } from '@/features/organizations';
import { fieldErrors } from '@/lib/apiError';
import { FileUploadService } from '@/services/files';
import type { PresignProvider } from '@/services/files/types';
import { isPermissionError, pickImages, type LocalFile } from '@/services/media';
import { useTheme } from '@/theme';

import { poultryMarketApi } from '../api';
import { EGG_TYPE_ORDER, SELL_UNIT_ORDER } from '../constants';
import { useCreateEggOffer, useTraderStatus } from '../hooks';
import type { EggType, SellUnit } from '../types';
import { buildEggOfferSchema, marketErrorMessage, type EggOfferFormValues } from '../validation/schemas';

const TILE_SIZE = 84;
const MAX_IMAGES = 4;

const EMPTY: EggOfferFormValues = {
  eggType: 'WHITE',
  sellUnit: 'TRAY_30',
  quantity: '',
  pricePerUnit: '',
  governorate: '',
  district: '',
  phone: '',
  whatsapp: '',
  notes: '',
};

/** Route `/(app)/poultry/egg-market/create` — إضافة عرض بيع بيض. */
export default function CreateEggOfferScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultryMarket');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const trader = useTraderStatus();
  const user = useAuthStore((s) => s.user);
  const create = useCreateEggOffer();

  const schema = useMemo(() => buildEggOfferSchema(t), [t]);
  const [photos, setPhotos] = useState<LocalFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const inFlight = useRef(false);

  const { control, handleSubmit } = useForm<EggOfferFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...EMPTY,
      phone: user?.phone ?? '',
    },
    mode: 'onTouched',
  });

  if (!trader.isApproved) {
    return (
      <OrgFormLayout title={t('eggMarket.addTitle')}>
        <EmptyState
          icon="lock-closed-outline"
          title={
            trader.isPending
              ? t('gate.pendingTitle')
              : trader.isRejected
                ? t('gate.rejectedTitle')
                : trader.isSuspended
                  ? t('gate.suspendedTitle')
                  : t('gate.notRegisteredTitle')
          }
          message={trader.hasRegistered ? t('gate.pendingBody') : t('gate.notRegisteredBody')}
          actionLabel={!trader.hasRegistered || trader.isRejected ? t('gate.registerCta') : undefined}
          onAction={
            !trader.hasRegistered || trader.isRejected
              ? () => router.push('/(app)/poultry/trader-register' as never)
              : undefined
          }
        />
      </OrgFormLayout>
    );
  }

  const addPhotos = async () => {
    if (photos.length >= MAX_IMAGES) return;
    try {
      const files = await pickImages({ max: MAX_IMAGES - photos.length });
      setPhotos((prev) => [...prev, ...files]);
    } catch (error) {
      toast.show({
        message: isPermissionError(error) ? tc('media.permissionBody') : marketErrorMessage(error, t),
        tone: isPermissionError(error) ? 'warning' : 'danger',
      });
    }
  };
  const removePhoto = (uri: string) => setPhotos((prev) => prev.filter((f) => f.uri !== uri));

  const uploadPhotos = async (): Promise<string[]> => {
    const provider: PresignProvider = {
      requestUpload: (file) => poultryMarketApi.eggOffers.requestUploadUrl({
        filename: file.name,
        mimeType: file.mimeType,
        size: file.size ?? 0,
      }),
    };
    const uploader = new FileUploadService(provider);
    const keys: string[] = [];
    for (const file of photos) {
      const result = await uploader.upload(file);
      keys.push(result.storageKey);
    }
    return keys;
  };

  const onSubmit = handleSubmit(async (values) => {
    if (inFlight.current || submitting) return;
    inFlight.current = true;
    setSubmitting(true);
    setFormError(null);
    setServerFields({});
    try {
      const galleryKeys = await uploadPhotos();
      create.mutate(
        {
          eggType: values.eggType,
          sellUnit: values.sellUnit,
          quantity: Number(values.quantity),
          pricePerUnit: values.pricePerUnit.trim(),
          governorate: values.governorate,
          district: values.district?.trim() || undefined,
          phone: values.phone.trim(),
          whatsapp: values.whatsapp?.trim() || undefined,
          notes: values.notes?.trim() || undefined,
          galleryKeys,
        },
        {
          onSuccess: () => {
            toast.show({ tone: 'success', message: t('eggMarket.success') });
            router.back();
          },
          onError: (error) => {
            setServerFields(fieldErrors(error));
            setFormError(marketErrorMessage(error, t));
          },
          onSettled: () => {
            setSubmitting(false);
            inFlight.current = false;
          },
        },
      );
    } catch (error) {
      setFormError(marketErrorMessage(error, t));
      setSubmitting(false);
      inFlight.current = false;
    }
  });

  const eggTypeOptions = EGG_TYPE_ORDER.map((v: EggType) => ({
    value: v,
    label: t(`eggMarket.eggType.${v}`),
  }));
  const sellUnitOptions = SELL_UNIT_ORDER.map((v: SellUnit) => ({
    value: v,
    label: t(`eggMarket.sellUnit.${v}`),
  }));
  const governorateOptions = IRAQ_GOVERNORATES.map((g) => ({ label: g, value: g }));

  return (
    <OrgFormLayout title={t('eggMarket.addTitle')}>
      {formError ? <Alert tone="danger" message={formError} /> : null}

      <Controller
        control={control}
        name="eggType"
        render={({ field: { value, onChange }, fieldState }) => (
          <TileOptionGroup
            options={eggTypeOptions}
            value={value}
            onChange={onChange}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="sellUnit"
        render={({ field: { value, onChange } }) => (
          <TileOptionGroup options={sellUnitOptions} value={value} onChange={onChange} />
        )}
      />

      <FormField
        control={control}
        name="quantity"
        label={t('eggMarket.fieldQuantity')}
        keyboardType="number-pad"
        serverError={serverFields.quantity}
      />

      <FormField
        control={control}
        name="pricePerUnit"
        label={t('eggMarket.unitPriceLabel')}
        keyboardType="decimal-pad"
        serverError={serverFields.pricePerUnit}
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
        name="notes"
        label={t('eggMarket.notesLabel')}
        multiline
        numberOfLines={3}
        serverError={serverFields.notes}
      />

      <View style={{ rowGap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
            {photos.map((file) => (
              <ImagePreview key={file.uri} uri={file.uri} size={TILE_SIZE} onRemove={() => removePhoto(file.uri)} />
            ))}
            {photos.length < MAX_IMAGES ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('eggMarket.photosLabel')}
                onPress={() => void addPhotos()}
                style={{
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  borderRadius: theme.radius.lg,
                  borderWidth: 1.5,
                  borderStyle: 'dashed',
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceAccent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="camera-outline" size="iconMd" color="primary" />
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </View>

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          label={t('eggMarket.submit')}
          fullWidth
          loading={submitting}
          disabled={submitting}
          onPress={() => void onSubmit()}
          accessibilityLabel={t('eggMarket.submit')}
        />
      </View>
    </OrgFormLayout>
  );
}
