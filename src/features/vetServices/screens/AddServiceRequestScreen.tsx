import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Chip } from '@/components/content';
import { useToast } from '@/components/feedback';
import { Input, Select, Switch } from '@/components/forms';
import { MultiImagePicker } from '@/components/media';
import { Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { DateTimeField } from '@/features/clinicAppointments';
import { OrgFormLayout } from '@/features/organizations';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { TermsAcceptField } from '../components';
import { formatVetServiceDate, IRAQ_GOVERNORATES } from '../constants';
import { useCreateServiceRequest, useVetServiceImageProvider } from '../hooks';
import {
  VET_SERVICE_ANIMAL_TYPES,
  VET_SERVICE_TYPES,
  VET_SERVICE_URGENCIES,
  type CreateServiceRequestInput,
  type VetServiceAnimalType,
  type VetServiceType,
  type VetServiceUrgency,
} from '../types';

/** Route `/(app)/vet-services/requests/new` — "أضف طلب خدمة" (screenshot 3B). */
export default function AddServiceRequestScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation('vetServices');
  const toast = useToast();
  const imageProvider = useVetServiceImageProvider();
  const create = useCreateServiceRequest();

  // Sample starter values — the form opens pre-filled so it's one review away
  // from submitting; every field stays editable and terms must still be accepted.
  const [title, setTitle] = useState('كشف بيطري لقطة مريضة');
  const [description, setDescription] = useState(
    'قطة عمرها سنة تعاني من فقدان الشهية والخمول منذ يومين، أحتاج كشفاً وتشخيصاً.',
  );
  const [animalType, setAnimalType] = useState<VetServiceAnimalType | null>('CAT');
  const [serviceType, setServiceType] = useState<VetServiceType | null>('EXAMINATION');
  const [animalCount, setAnimalCount] = useState('1');
  const [animalAge, setAnimalAge] = useState('سنة واحدة');
  const [governorate, setGovernorate] = useState<string | null>('بغداد');
  const [district, setDistrict] = useState('الكرادة');
  const [detailedAddress, setDetailedAddress] = useState('حي الكرادة، قرب ساحة الفردوس');
  const [needsFieldVisit, setNeedsFieldVisit] = useState(false);
  const [hasPreferredDate, setHasPreferredDate] = useState(false);
  const [preferredDate, setPreferredDate] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [budgetAmount, setBudgetAmount] = useState('20000');
  const [urgency, setUrgency] = useState<VetServiceUrgency>('NORMAL');
  const [extraNotes, setExtraNotes] = useState('يفضّل زيارة منزلية في المساء.');
  const [imageKeys, setImageKeys] = useState<string[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const serverFields = create.error ? fieldErrors(create.error) : {};
  const missing = (v: string | null) => submitted && !v;

  const onSubmit = () => {
    setSubmitted(true);
    if (!title.trim() || !description.trim() || !animalType || !serviceType || !governorate || !accepted) return;
    if (create.isPending) return;

    const input: CreateServiceRequestInput = {
      title: title.trim(),
      description: description.trim(),
      animalType,
      serviceType,
      animalCount: animalCount.trim() ? Number(animalCount.trim()) : undefined,
      animalAge: animalAge.trim() || undefined,
      governorate,
      district: district.trim() || undefined,
      detailedAddress: detailedAddress.trim() || undefined,
      needsFieldVisit,
      preferredDate: hasPreferredDate ? preferredDate.toISOString().slice(0, 10) : undefined,
      budgetAmount: budgetAmount.trim() || undefined,
      urgency,
      extraNotes: extraNotes.trim() || undefined,
      imageKeys,
    };

    create.mutate(input, {
      onSuccess: (r) => {
        toast.show({ tone: 'success', message: t('addRequest.success') });
        router.replace(Routes.vetServiceRequest(r.id));
      },
      onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
    });
  };

  return (
    <OrgFormLayout title={t('requests.addCta')}>
      <Text color="textSecondary">{t('addRequest.intro')}</Text>

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
      <Select<VetServiceAnimalType>
        label={t('fields.animalType')}
        placeholder={t('fields.selectPlaceholder')}
        value={animalType}
        onChange={setAnimalType}
        error={missing(animalType) ? t('validation.required') : serverFields.animalType}
        options={VET_SERVICE_ANIMAL_TYPES.map((v) => ({ value: v, label: t(`animalType.${v}`) }))}
      />
      <Select<VetServiceType>
        label={t('fields.serviceType')}
        placeholder={t('fields.selectPlaceholder')}
        value={serviceType}
        onChange={setServiceType}
        error={missing(serviceType) ? t('validation.required') : serverFields.serviceType}
        options={VET_SERVICE_TYPES.map((v) => ({ value: v, label: t(`serviceType.${v}`) }))}
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
        error={missing(governorate) ? t('validation.required') : serverFields.governorate}
        options={IRAQ_GOVERNORATES.map((v) => ({ value: v, label: v }))}
      />
      <Input label={t('fields.district')} value={district} onChangeText={setDistrict} maxLength={120} />
      <Input
        label={t('fields.detailedAddress')}
        value={detailedAddress}
        onChangeText={setDetailedAddress}
        multiline
        numberOfLines={2}
        maxLength={300}
      />

      <Switch label={t('fields.needsFieldVisit')} value={needsFieldVisit} onValueChange={setNeedsFieldVisit} />
      <Switch label={t('fields.hasPreferredDate')} value={hasPreferredDate} onValueChange={setHasPreferredDate} />
      {hasPreferredDate ? (
        <DateTimeField
          label={t('fields.preferredDate')}
          mode="date"
          value={preferredDate}
          onChange={setPreferredDate}
          minimumDate={new Date()}
          display={formatVetServiceDate(preferredDate.toISOString(), i18n.language)}
          accessibilityLabel={t('fields.preferredDate')}
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
      <View style={{ rowGap: theme.spacing.sm }}>
        <Label>{t('fields.urgency')}</Label>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          {VET_SERVICE_URGENCIES.map((v) => (
            <Chip key={v} label={t(`urgency.${v}`)} selected={urgency === v} onPress={() => setUrgency(v)} />
          ))}
        </View>
      </View>
      <Input
        label={t('fields.extraNotes')}
        value={extraNotes}
        onChangeText={setExtraNotes}
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

      <TermsAcceptField termsKey="PUBLISH_REQUEST" accepted={accepted} onChange={setAccepted} />
      {submitted && !accepted ? <Text variant="caption" color="danger">{t('validation.terms')}</Text> : null}

      <Button
        label={t('addRequest.submit')}
        fullWidth
        leftIcon="cloud-upload-outline"
        loading={create.isPending}
        disabled={!accepted || create.isPending}
        onPress={onSubmit}
      />
      <Text variant="caption" color="textMuted">
        {t('addRequest.moderationNote')}
      </Text>
    </OrgFormLayout>
  );
}
