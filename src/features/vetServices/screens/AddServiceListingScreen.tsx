import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Chip } from '@/components/content';
import { EmptyState, useToast } from '@/components/feedback';
import { Input, Select, Switch } from '@/components/forms';
import { Label, Text } from '@/components/typography';
import { OrgFormLayout } from '@/features/organizations';
import { AnimalGalleryPicker } from '@/features/publications';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { TermsAcceptField } from '../components';
import { IRAQ_GOVERNORATES } from '../constants';
import { useCreateServiceListing, useVetServiceImageProvider } from '../hooks';
import {
  VET_SERVICE_ANIMAL_TYPES,
  VET_SERVICE_LOCATION_MODES,
  VET_SERVICE_PRICE_TYPES,
  VET_SERVICE_TYPES,
  type CreateServiceListingInput,
  type VetServiceAnimalType,
  type VetServiceLocationMode,
  type VetServicePriceType,
  type VetServiceType,
} from '../types';

/** Route `/(app)/vet-services/listings/new` — vet-only "أضف خدمة". */
export default function AddServiceListingScreen() {
  const theme = useTheme();
  const { t } = useTranslation('vetServices');
  const toast = useToast();
  const caps = useCapabilities();
  const imageProvider = useVetServiceImageProvider();
  const create = useCreateServiceListing();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [serviceType, setServiceType] = useState<VetServiceType | null>(null);
  const [animalType, setAnimalType] = useState<VetServiceAnimalType | null>(null);
  const [specialty, setSpecialty] = useState('');
  const [governorate, setGovernorate] = useState<string | null>(null);
  const [district, setDistrict] = useState('');
  const [priceAmount, setPriceAmount] = useState('');
  const [priceType, setPriceType] = useState<VetServicePriceType>('APPROXIMATE');
  const [locationMode, setLocationMode] = useState<VetServiceLocationMode>('CLINIC');
  const [availability, setAvailability] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [executionDuration, setExecutionDuration] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [detailsText, setDetailsText] = useState('');
  const [imageKeys, setImageKeys] = useState<string[]>([]);
  const [showArrival, setShowArrival] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!caps.isApprovedVeterinarian) {
    return (
      <OrgFormLayout title={t('listings.addCta')}>
        <EmptyState icon="lock-closed-outline" title={t('addListing.vetOnly')} message={t('addListing.vetOnlyHint')} />
      </OrgFormLayout>
    );
  }

  const serverFields = create.error ? fieldErrors(create.error) : {};
  const missing = (v: string | null) => submitted && !v;

  const onSubmit = () => {
    setSubmitted(true);
    if (!title.trim() || !description.trim() || !serviceType || !animalType || !governorate || !accepted) return;
    if (create.isPending) return;

    const input: CreateServiceListingInput = {
      title: title.trim(),
      description: description.trim(),
      serviceType,
      animalType,
      specialty: specialty.trim() || undefined,
      governorate,
      district: district.trim() || undefined,
      priceAmount: priceAmount.trim() || undefined,
      priceType,
      locationMode,
      availability: availability.trim() || undefined,
      contactPhone: contactPhone.trim() || undefined,
      contactWhatsapp: contactWhatsapp.trim() || undefined,
      executionDuration: executionDuration.trim() || undefined,
      arrivalTime: showArrival ? arrivalTime.trim() || undefined : undefined,
      details: detailsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12),
      imageKeys,
    };

    create.mutate(input, {
      onSuccess: () => {
        toast.show({ tone: 'success', message: t('addListing.success') });
        router.back();
      },
      onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
    });
  };

  return (
    <OrgFormLayout title={t('listings.addCta')}>
      <Text color="textSecondary">{t('addListing.intro')}</Text>

      <Input
        label={t('fields.title')}
        value={title}
        onChangeText={setTitle}
        required
        maxLength={120}
        error={missing(title.trim() ? title : null) ? t('validation.required') : serverFields.title}
      />
      <Input
        label={t('fields.description')}
        value={description}
        onChangeText={setDescription}
        required
        multiline
        numberOfLines={4}
        maxLength={2000}
        error={missing(description.trim() ? description : null) ? t('validation.required') : serverFields.description}
      />
      <Select<VetServiceType>
        label={t('fields.serviceType')}
        placeholder={t('fields.selectPlaceholder')}
        value={serviceType}
        onChange={setServiceType}
        error={missing(serviceType) ? t('validation.required') : serverFields.serviceType}
        options={VET_SERVICE_TYPES.map((v) => ({ value: v, label: t(`serviceType.${v}`) }))}
      />
      <Select<VetServiceAnimalType>
        label={t('fields.animalType')}
        placeholder={t('fields.selectPlaceholder')}
        value={animalType}
        onChange={setAnimalType}
        error={missing(animalType) ? t('validation.required') : serverFields.animalType}
        options={VET_SERVICE_ANIMAL_TYPES.map((v) => ({ value: v, label: t(`animalType.${v}`) }))}
      />
      <Select<string>
        label={t('fields.governorate')}
        placeholder={t('fields.selectPlaceholder')}
        value={governorate}
        onChange={setGovernorate}
        error={missing(governorate) ? t('validation.required') : serverFields.governorate}
        options={IRAQ_GOVERNORATES.map((v) => ({ value: v, label: v }))}
      />
      <Input label={t('fields.district')} value={district} onChangeText={setDistrict} maxLength={120} />
      <Input label={t('fields.specialty')} value={specialty} onChangeText={setSpecialty} maxLength={120} />

      <Input
        label={t('fields.price')}
        value={priceAmount}
        onChangeText={setPriceAmount}
        keyboardType="numeric"
        hint={t('fields.priceHint')}
        error={serverFields.priceAmount}
      />
      <View style={{ rowGap: theme.spacing.sm }}>
        <Label>{t('fields.priceType')}</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {VET_SERVICE_PRICE_TYPES.map((v) => (
            <Chip key={v} label={t(`priceType.${v}`)} selected={priceType === v} onPress={() => setPriceType(v)} />
          ))}
        </View>
      </View>
      <View style={{ rowGap: theme.spacing.sm }}>
        <Label>{t('fields.locationMode')}</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {VET_SERVICE_LOCATION_MODES.map((v) => (
            <Chip
              key={v}
              label={t(`locationMode.${v}`)}
              selected={locationMode === v}
              onPress={() => setLocationMode(v)}
            />
          ))}
        </View>
      </View>

      <Input label={t('fields.availability')} value={availability} onChangeText={setAvailability} maxLength={200} />
      <Input
        label={t('fields.executionDuration')}
        value={executionDuration}
        onChangeText={setExecutionDuration}
        maxLength={120}
      />
      <Switch label={t('fields.showArrivalTime')} value={showArrival} onValueChange={setShowArrival} />
      {showArrival ? (
        <Input label={t('fields.arrivalTime')} value={arrivalTime} onChangeText={setArrivalTime} maxLength={120} />
      ) : null}

      <Input
        label={t('fields.contactPhone')}
        value={contactPhone}
        onChangeText={setContactPhone}
        keyboardType="phone-pad"
        maxLength={40}
      />
      <Input
        label={t('fields.contactWhatsapp')}
        value={contactWhatsapp}
        onChangeText={setContactWhatsapp}
        keyboardType="phone-pad"
        maxLength={40}
      />
      <Input
        label={t('fields.details')}
        value={detailsText}
        onChangeText={setDetailsText}
        multiline
        numberOfLines={4}
        hint={t('fields.detailsHint')}
      />

      <AnimalGalleryPicker
        provider={imageProvider}
        onChange={setImageKeys}
        max={6}
        label={t('fields.images')}
        hint={t('fields.imagesHint')}
      />

      <TermsAcceptField termsKey="PUBLISH_LISTING" accepted={accepted} onChange={setAccepted} />
      {submitted && !accepted ? <Text variant="caption" color="danger">{t('validation.terms')}</Text> : null}

      <Button
        label={t('addListing.submit')}
        fullWidth
        leftIcon="cloud-upload-outline"
        loading={create.isPending}
        disabled={!accepted || create.isPending}
        onPress={onSubmit}
      />
      <Text variant="caption" color="textMuted">
        {t('addListing.moderationNote')}
      </Text>
    </OrgFormLayout>
  );
}
