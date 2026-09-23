import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { useToast } from '@/components/feedback';
import { Input, Select, Switch } from '@/components/forms';
import { MultiImagePicker } from '@/components/media';
import { Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { DateTimeField } from '@/features/clinicAppointments';
import { OrgFormLayout } from '@/features/organizations';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { TermsAcceptField } from '../components';
import { formatVetServiceDate, IRAQ_GOVERNORATES } from '../constants';
import { useCreateListingRequest, useServiceListing, useVetServiceImageProvider } from '../hooks';
import {
  VET_SERVICE_ANIMAL_TYPES,
  type CreateListingRequestInput,
  type VetServiceAnimalType,
} from '../types';

/** Route `/(app)/vet-services/listings/[listingId]/request` — "طلب الخدمة / طلب عرض". */
export default function RequestServiceScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation('vetServices');
  const toast = useToast();
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const id = listingId ?? '';

  const listingQ = useServiceListing(id);
  const imageProvider = useVetServiceImageProvider();
  const create = useCreateListingRequest(id);

  const [animalType, setAnimalType] = useState<VetServiceAnimalType | null>(null);
  const [animalCount, setAnimalCount] = useState('');
  const [animalAge, setAnimalAge] = useState('');
  const [governorate, setGovernorate] = useState<string | null>(null);
  const [district, setDistrict] = useState('');
  const [needsFieldVisit, setNeedsFieldVisit] = useState(false);
  const [previousVisit, setPreviousVisit] = useState(false);
  const [hasPreferred, setHasPreferred] = useState(false);
  const [preferred, setPreferred] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [budgetAmount, setBudgetAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [imageKeys, setImageKeys] = useState<string[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const serverFields = create.error ? fieldErrors(create.error) : {};

  const onSubmit = () => {
    setSubmitted(true);
    if (!animalType || !accepted || create.isPending) return;

    const input: CreateListingRequestInput = {
      animalType,
      animalCount: animalCount.trim() ? Number(animalCount.trim()) : undefined,
      animalAge: animalAge.trim() || undefined,
      governorate: governorate ?? undefined,
      district: district.trim() || undefined,
      needsFieldVisit,
      previousVisit,
      preferredDatetime: hasPreferred ? preferred.toISOString() : undefined,
      budgetAmount: budgetAmount.trim() || undefined,
      notes: notes.trim() || undefined,
      imageKeys,
    };

    create.mutate(input, {
      onSuccess: (r) => {
        toast.show({ tone: 'success', message: t('requestService.success') });
        router.replace(Routes.vetServiceEngagement('listing-request', r.id));
      },
      onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
    });
  };

  return (
    <OrgFormLayout title={t('requestService.title')}>
      {listingQ.data ? (
        <Text color="textSecondary">
          {t('requestService.forListing', { title: listingQ.data.title })}
        </Text>
      ) : null}

      <Select<VetServiceAnimalType>
        label={t('fields.animalType')}
        placeholder={t('fields.selectPlaceholder')}
        value={animalType}
        onChange={setAnimalType}
        error={submitted && !animalType ? t('validation.required') : serverFields.animalType}
        options={VET_SERVICE_ANIMAL_TYPES.map((v) => ({ value: v, label: t(`animalType.${v}`) }))}
      />
      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        <View style={{ flex: 1 }}>
          <Input
            label={t('fields.animalCount')}
            value={animalCount}
            onChangeText={setAnimalCount}
            keyboardType="numeric"
            maxLength={5}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Input label={t('fields.animalAge')} value={animalAge} onChangeText={setAnimalAge} maxLength={60} />
        </View>
      </View>
      <Select<string>
        label={t('fields.governorate')}
        placeholder={t('fields.selectPlaceholder')}
        value={governorate}
        onChange={setGovernorate}
        options={IRAQ_GOVERNORATES.map((v) => ({ value: v, label: v }))}
      />
      <Input label={t('fields.district')} value={district} onChangeText={setDistrict} maxLength={120} />

      <Switch label={t('fields.needsFieldVisit')} value={needsFieldVisit} onValueChange={setNeedsFieldVisit} />
      <Switch label={t('fields.previousVisit')} value={previousVisit} onValueChange={setPreviousVisit} />
      <Switch label={t('fields.hasPreferredDate')} value={hasPreferred} onValueChange={setHasPreferred} />
      {hasPreferred ? (
        <DateTimeField
          label={t('fields.preferredDatetime')}
          mode="date"
          value={preferred}
          onChange={setPreferred}
          minimumDate={new Date()}
          display={formatVetServiceDate(preferred.toISOString(), i18n.language)}
          accessibilityLabel={t('fields.preferredDatetime')}
        />
      ) : null}

      <Input
        label={t('fields.budget')}
        value={budgetAmount}
        onChangeText={setBudgetAmount}
        keyboardType="numeric"
        hint={t('fields.priceHint')}
        error={serverFields.budgetAmount}
      />
      <Input
        label={t('fields.notes')}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        maxLength={1000}
      />

      <MultiImagePicker
        provider={imageProvider}
        onChange={setImageKeys}
        max={4}
        label={t('fields.images')}
        hint={t('fields.imagesHint')}
      />

      <TermsAcceptField termsKey="REQUEST_OFFER" accepted={accepted} onChange={setAccepted} />
      {submitted && !accepted ? <Text variant="caption" color="danger">{t('validation.terms')}</Text> : null}

      <Button
        label={t('requestService.submit')}
        fullWidth
        leftIcon="paper-plane-outline"
        loading={create.isPending}
        disabled={!accepted || create.isPending}
        onPress={onSubmit}
      />
    </OrgFormLayout>
  );
}
