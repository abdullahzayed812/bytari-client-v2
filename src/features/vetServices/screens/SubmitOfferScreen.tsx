import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/actions';
import { EmptyState, useToast } from '@/components/feedback';
import { Input, Switch } from '@/components/forms';
import { Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { DateTimeField } from '@/features/clinicAppointments';
import { OrgFormLayout } from '@/features/organizations';
import { AnimalGalleryPicker } from '@/features/publications';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';

import { TermsAcceptField } from '../components';
import { formatVetServiceDate } from '../constants';
import { useCreateOffer, useServiceRequest, useVetServiceImageProvider } from '../hooks';
import type { CreateOfferInput } from '../types';

/** Route `/(app)/vet-services/requests/[requestId]/offer` — vet-only "تقديم عرض". */
export default function SubmitOfferScreen() {
  const { t, i18n } = useTranslation('vetServices');
  const toast = useToast();
  const caps = useCapabilities();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const id = requestId ?? '';

  const requestQ = useServiceRequest(id);
  const imageProvider = useVetServiceImageProvider();
  const create = useCreateOffer(id);

  const [proposedAmount, setProposedAmount] = useState('');
  const [hasExecDate, setHasExecDate] = useState(false);
  const [executionDate, setExecutionDate] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [expectedDuration, setExpectedDuration] = useState('');
  const [includesFieldVisit, setIncludesFieldVisit] = useState(false);
  const [details, setDetails] = useState('');
  const [imageKeys, setImageKeys] = useState<string[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!caps.isApprovedVeterinarian) {
    return (
      <OrgFormLayout title={t('submitOffer.title')}>
        <EmptyState icon="lock-closed-outline" title={t('submitOffer.vetOnly')} message={t('submitOffer.vetOnlyHint')} />
      </OrgFormLayout>
    );
  }

  const serverFields = create.error ? fieldErrors(create.error) : {};

  const onSubmit = () => {
    setSubmitted(true);
    if (!accepted || create.isPending) return;

    const input: CreateOfferInput = {
      proposedAmount: proposedAmount.trim() || undefined,
      executionDate: hasExecDate ? executionDate.toISOString().slice(0, 10) : undefined,
      expectedDuration: expectedDuration.trim() || undefined,
      includesFieldVisit,
      details: details.trim() || undefined,
      imageKeys,
    };

    create.mutate(input, {
      onSuccess: (o) => {
        toast.show({ tone: 'success', message: t('submitOffer.success') });
        router.replace(Routes.vetServiceEngagement('offer', o.id));
      },
      onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
    });
  };

  return (
    <OrgFormLayout title={t('submitOffer.title')}>
      {requestQ.data ? (
        <Text color="textSecondary">{t('submitOffer.forRequest', { title: requestQ.data.title })}</Text>
      ) : null}

      <Input
        label={t('fields.proposedAmount')}
        value={proposedAmount}
        onChangeText={setProposedAmount}
        keyboardType="numeric"
        hint={t('fields.priceHint')}
        error={serverFields.proposedAmount}
      />
      <Switch label={t('fields.hasExecutionDate')} value={hasExecDate} onValueChange={setHasExecDate} />
      {hasExecDate ? (
        <DateTimeField
          label={t('fields.executionDate')}
          mode="date"
          value={executionDate}
          onChange={setExecutionDate}
          minimumDate={new Date()}
          display={formatVetServiceDate(executionDate.toISOString(), i18n.language)}
          accessibilityLabel={t('fields.executionDate')}
        />
      ) : null}
      <Input
        label={t('fields.expectedDuration')}
        value={expectedDuration}
        onChangeText={setExpectedDuration}
        maxLength={120}
      />
      <Switch
        label={t('fields.includesFieldVisit')}
        value={includesFieldVisit}
        onValueChange={setIncludesFieldVisit}
      />
      <Input
        label={t('fields.offerDetails')}
        value={details}
        onChangeText={setDetails}
        multiline
        numberOfLines={4}
        maxLength={2000}
      />

      <AnimalGalleryPicker
        provider={imageProvider}
        onChange={setImageKeys}
        max={4}
        label={t('fields.images')}
        hint={t('fields.imagesHint')}
      />

      <TermsAcceptField termsKey="SUBMIT_OFFER" accepted={accepted} onChange={setAccepted} />
      {submitted && !accepted ? <Text variant="caption" color="danger">{t('validation.terms')}</Text> : null}

      <Button
        label={t('submitOffer.submit')}
        fullWidth
        leftIcon="paper-plane-outline"
        loading={create.isPending}
        disabled={!accepted || create.isPending}
        onPress={onSubmit}
      />
    </OrgFormLayout>
  );
}
