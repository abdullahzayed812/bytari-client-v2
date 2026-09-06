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
import { BIRD_TYPE_ORDER, PRICING_METHOD_ORDER } from '../constants';
import { useCreatePoultryOffer, useTraderStatus } from '../hooks';
import type { BirdType, PricingMethod } from '../types';
import { buildPoultryOfferSchema, marketErrorMessage, type PoultryOfferFormValues } from '../validation/schemas';

const TILE_SIZE = 84;
const MAX_IMAGES = 5;

const EMPTY: PoultryOfferFormValues = {
  birdType: 'BROILER',
  breed: '',
  quantity: '',
  pricingMethod: 'PER_KG',
  price: '',
  ageWeeks: '',
  weightKg: '',
  governorate: '',
  district: '',
  phone: '',
  whatsapp: '',
  notes: '',
};

/** Route `/(app)/poultry/market/create` — إضافة عرض بيع دواجن. */
export default function CreatePoultryOfferScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultryMarket');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const trader = useTraderStatus();
  const user = useAuthStore((s) => s.user);
  const create = useCreatePoultryOffer();

  const schema = useMemo(() => buildPoultryOfferSchema(t), [t]);
  const [photos, setPhotos] = useState<LocalFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const inFlight = useRef(false);

  const { control, handleSubmit, watch } = useForm<PoultryOfferFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...EMPTY,
      phone: user?.phone ?? '',
    },
    mode: 'onTouched',
  });
  const pricingMethod = watch('pricingMethod');

  if (!trader.isApproved) {
    return (
      <OrgFormLayout title={t('poultryMarket.addTitle')}>
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
      requestUpload: (file) => poultryMarketApi.poultryOffers.requestUploadUrl({
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
          birdType: values.birdType,
          breed: values.breed?.trim() || undefined,
          quantity: Number(values.quantity),
          pricingMethod: values.pricingMethod,
          price: values.price.trim(),
          ageWeeks: values.ageWeeks?.trim() ? Number(values.ageWeeks) : undefined,
          weightKg: values.weightKg?.trim() || undefined,
          governorate: values.governorate,
          district: values.district?.trim() || undefined,
          phone: values.phone.trim(),
          whatsapp: values.whatsapp?.trim() || undefined,
          notes: values.notes?.trim() || undefined,
          galleryKeys,
        },
        {
          onSuccess: () => {
            toast.show({ tone: 'success', message: t('poultryMarket.success') });
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

  const birdTypeOptions = BIRD_TYPE_ORDER.map((v: BirdType) => ({
    value: v,
    label: t(`poultryMarket.birdType.${v}`),
  }));
  const pricingMethodOptions = PRICING_METHOD_ORDER.map((v: PricingMethod) => ({
    value: v,
    label: t(`poultryMarket.pricingMethod.${v}`),
  }));
  const governorateOptions = IRAQ_GOVERNORATES.map((g) => ({ label: g, value: g }));

  return (
    <OrgFormLayout title={t('poultryMarket.addTitle')}>
      {formError ? <Alert tone="danger" message={formError} /> : null}

      <Controller
        control={control}
        name="birdType"
        render={({ field: { value, onChange }, fieldState }) => (
          <TileOptionGroup
            options={birdTypeOptions}
            value={value}
            onChange={onChange}
            error={fieldState.error?.message}
          />
        )}
      />

      <FormField
        control={control}
        name="breed"
        label={t('poultryMarket.fieldBreed')}
        placeholder={t('poultryMarket.breedPlaceholder')}
        serverError={serverFields.breed}
      />

      <FormField
        control={control}
        name="quantity"
        label={t('poultryMarket.fieldQuantity')}
        keyboardType="number-pad"
        serverError={serverFields.quantity}
      />

      <Controller
        control={control}
        name="pricingMethod"
        render={({ field: { value, onChange } }) => (
          <TileOptionGroup options={pricingMethodOptions} value={value} onChange={onChange} />
        )}
      />

      <FormField
        control={control}
        name="price"
        label={pricingMethod === 'PER_BIRD' ? t('poultryMarket.fieldPriceBird') : t('poultryMarket.fieldPriceKg')}
        keyboardType="decimal-pad"
        serverError={serverFields.price}
      />

      <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
        <View style={{ flex: 1 }}>
          <FormField
            control={control}
            name="ageWeeks"
            label={t('poultryMarket.fieldAgeWeeks')}
            keyboardType="number-pad"
            serverError={serverFields.ageWeeks}
          />
        </View>
        <View style={{ flex: 1 }}>
          <FormField
            control={control}
            name="weightKg"
            label={t('poultryMarket.fieldWeightKg')}
            keyboardType="decimal-pad"
            serverError={serverFields.weightKg}
          />
        </View>
      </View>

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
        label={t('poultryMarket.notesLabel')}
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
                accessibilityLabel={t('poultryMarket.photosLabel')}
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
          label={t('poultryMarket.submit')}
          fullWidth
          loading={submitting}
          disabled={submitting}
          onPress={() => void onSubmit()}
          accessibilityLabel={t('poultryMarket.submit')}
        />
      </View>
    </OrgFormLayout>
  );
}
