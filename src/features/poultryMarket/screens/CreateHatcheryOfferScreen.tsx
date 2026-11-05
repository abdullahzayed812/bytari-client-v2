import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Icon } from '@/components/content';
import { Alert, useToast } from '@/components/feedback';
import { FormField, Select, TileOptionGroup } from '@/components/forms';
import { ImagePreview } from '@/components/media';
import { Label } from '@/components/typography';
import { IRAQ_GOVERNORATES } from '@/constants/governorates';
import { useAuthStore } from '@/features/auth/store';
import { OrgFormLayout } from '@/features/organizations';
import { fieldErrors } from '@/lib/apiError';
import { FileUploadService } from '@/services/files';
import type { PresignProvider } from '@/services/files/types';
import { isPermissionError, pickImages, type LocalFile } from '@/services/media';
import { useTheme } from '@/theme';
import { formatDate, normalizeIsoDate, toLocalIsoDate } from '@/utils';

import { poultryMarketApi } from '../api';
import { MarketAccessGate } from '../components/MarketAccessGate';
import { CHICK_TYPE_ORDER } from '../constants';
import { useCreateHatcheryOffer } from '../hooks';
import { MAX_HATCHERY_OFFER_IMAGES, type ChickType } from '../types';
import {
  buildHatcheryOfferSchema,
  marketErrorMessage,
  type HatcheryOfferFormValues,
} from '../validation/schemas';

const TILE_SIZE = 84;
const MAX_IMAGES = MAX_HATCHERY_OFFER_IMAGES;

const EMPTY: HatcheryOfferFormValues = {
  chickType: 'BROILER',
  breed: '',
  chickAgeDays: '1',
  productionDate: '',
  quantity: '',
  pricePerChick: '',
  governorate: '',
  district: '',
  phone: '',
  whatsapp: '',
  notes: '',
};

/**
 * Route `/(app)/poultry/hatchery-market/create` — إضافة عرض مفقس. Same form
 * shell, photo upload and access gate as `CreateEggOfferScreen`; the offer is
 * sent to Admin as a request (PENDING) and goes public once approved.
 */
export default function CreateHatcheryOfferScreen() {
  const { t } = useTranslation('poultryMarket');
  return (
    <MarketAccessGate title={t('hatcheryMarket.addTitle')} need="sell">
      <CreateHatcheryOfferContent />
    </MarketAccessGate>
  );
}

function CreateHatcheryOfferContent() {
  const theme = useTheme();
  const { t } = useTranslation('poultryMarket');
  const { t: tc } = useTranslation('common');
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const create = useCreateHatcheryOffer();

  const schema = useMemo(() => buildHatcheryOfferSchema(t), [t]);
  const [photos, setPhotos] = useState<LocalFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const inFlight = useRef(false);

  const { control, handleSubmit } = useForm<HatcheryOfferFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...EMPTY,
      // Today, shown as YYYY-M-D like every other date in the app.
      productionDate: formatDate(toLocalIsoDate(new Date())),
      phone: user?.phone ?? '',
    },
    mode: 'onTouched',
  });

  const addPhotos = async () => {
    if (photos.length >= MAX_IMAGES) return;
    try {
      const files = await pickImages({ max: MAX_IMAGES - photos.length });
      setPhotos((prev) => [...prev, ...files]);
    } catch (error) {
      toast.show({
        message: isPermissionError(error)
          ? tc('media.permissionBody')
          : marketErrorMessage(error, t),
        tone: isPermissionError(error) ? 'warning' : 'danger',
      });
    }
  };
  const removePhoto = (uri: string) => setPhotos((prev) => prev.filter((f) => f.uri !== uri));

  const uploadPhotos = async (): Promise<string[]> => {
    const provider: PresignProvider = {
      requestUpload: (file) =>
        poultryMarketApi.hatcheryOffers.requestUploadUrl({
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
          chickType: values.chickType,
          breed: values.breed?.trim() || undefined,
          chickAgeDays: Number(values.chickAgeDays),
          productionDate: normalizeIsoDate(values.productionDate) ?? values.productionDate.trim(),
          quantity: values.quantity?.trim() ? Number(values.quantity) : undefined,
          pricePerChick: values.pricePerChick?.trim() || undefined,
          governorate: values.governorate,
          district: values.district?.trim() || undefined,
          phone: values.phone.trim(),
          whatsapp: values.whatsapp?.trim() || undefined,
          notes: values.notes?.trim() || undefined,
          galleryKeys,
        },
        {
          onSuccess: () => {
            toast.show({ tone: 'success', message: t('hatcheryMarket.success') });
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

  const chickTypeOptions = CHICK_TYPE_ORDER.map((v: ChickType) => ({
    value: v,
    label: t(`hatcheryMarket.chickType.${v}`),
  }));
  const governorateOptions = IRAQ_GOVERNORATES.map((g) => ({ label: g, value: g }));

  return (
    <OrgFormLayout title={t('hatcheryMarket.addTitle')}>
      <Alert tone="info" message={t('hatcheryMarket.reviewNotice')} />
      {formError ? <Alert tone="danger" message={formError} /> : null}

      <Label>{t('hatcheryMarket.fieldChickType')}</Label>
      <Controller
        control={control}
        name="chickType"
        render={({ field: { value, onChange }, fieldState }) => (
          <TileOptionGroup
            options={chickTypeOptions}
            value={value}
            onChange={onChange}
            error={fieldState.error?.message}
          />
        )}
      />

      <FormField
        control={control}
        name="breed"
        label={t('hatcheryMarket.breedLabel')}
        placeholder={t('hatcheryMarket.breedPlaceholder')}
        serverError={serverFields.breed}
      />

      <FormField
        control={control}
        name="chickAgeDays"
        label={t('hatcheryMarket.ageFieldLabel')}
        keyboardType="number-pad"
        serverError={serverFields.chickAgeDays}
      />

      <FormField
        control={control}
        name="productionDate"
        label={t('hatcheryMarket.productionDateLabel')}
        placeholder="2026-11-5"
        hint={t('hatcheryMarket.dateHint')}
        keyboardType="numbers-and-punctuation"
        autoCorrect={false}
        serverError={serverFields.productionDate}
      />

      <FormField
        control={control}
        name="quantity"
        label={t('hatcheryMarket.quantityOptionalLabel')}
        keyboardType="number-pad"
        serverError={serverFields.quantity}
      />

      <FormField
        control={control}
        name="pricePerChick"
        label={t('hatcheryMarket.priceOptionalLabel')}
        keyboardType="decimal-pad"
        serverError={serverFields.pricePerChick}
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
        label={t('hatcheryMarket.notesLabel')}
        multiline
        numberOfLines={3}
        serverError={serverFields.notes}
      />

      <View style={{ rowGap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
            {photos.map((file) => (
              <ImagePreview
                key={file.uri}
                uri={file.uri}
                size={TILE_SIZE}
                onRemove={() => removePhoto(file.uri)}
              />
            ))}
            {photos.length < MAX_IMAGES ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('hatcheryMarket.photosLabel')}
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
          label={t('hatcheryMarket.submit')}
          fullWidth
          loading={submitting}
          disabled={submitting}
          onPress={() => void onSubmit()}
          accessibilityLabel={t('hatcheryMarket.submit')}
        />
      </View>
    </OrgFormLayout>
  );
}
