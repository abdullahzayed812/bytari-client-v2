import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card } from '@/components/content';
import { ErrorState, Loading, useToast } from '@/components/feedback';
import { Caption, Text } from '@/components/typography';
import { OrgFormLayout } from '@/features/organizations';
import { usePet } from '@/features/pets/hooks';
import { fieldErrors } from '@/lib/apiError';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';

import { PublicationForm } from '../components';
import { publicationKindFromSlug } from '../constants';
import { useCreatePublication } from '../hooks';
import type { CreatePublicationInput } from '../types';
import { publicationErrorMessage } from '../validation/schemas';

/**
 * Route `/pets/[petId]/publish/[kind]` — publish an owned animal as Lost / for
 * Adoption / for Mating. The animal comes from the route (never a typed id);
 * the backend derives the owner and rejects a non-owner with `404`. The
 * publication starts PENDING — the form always says so (§7).
 */
export default function PublishAnimalScreen() {
  const theme = useTheme();
  const { t } = useTranslation('publications');
  const toast = useToast();
  const { petId, kind: kindSlug } = useLocalSearchParams<{ petId: string; kind: string }>();
  const kind = publicationKindFromSlug(kindSlug);

  const pet = usePet(petId);
  const create = useCreatePublication(petId ?? '');
  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});

  const title = kind ? t(`form.title.${kind}`) : t('form.title.ADOPTION');

  if (!kind) {
    return (
      <OrgFormLayout title={title}>
        <ErrorState error={undefined} title={t('browse.unknownKind')} />
      </OrgFormLayout>
    );
  }
  if (pet.isLoading) {
    return (
      <OrgFormLayout title={title}>
        <Loading fill />
      </OrgFormLayout>
    );
  }
  if (pet.isError || !pet.data) {
    const notFound = pet.error instanceof ApiError && pet.error.status === 404;
    return (
      <OrgFormLayout title={title}>
        <ErrorState
          error={pet.error}
          title={notFound ? t('form.petNotFound') : undefined}
          onRetry={notFound ? undefined : () => void pet.refetch()}
        />
      </OrgFormLayout>
    );
  }

  const onSubmit = (input: CreatePublicationInput) => {
    if (inFlight.current || create.isPending) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});
    create.mutate(input, {
      onSuccess: () => {
        toast.show({ tone: 'success', message: t('form.success') });
        router.back();
      },
      onError: (error) => {
        setServerFields(fieldErrors(error));
        setFormError(publicationErrorMessage(error, t));
      },
      onSettled: () => {
        inFlight.current = false;
      },
    });
  };

  return (
    <OrgFormLayout title={title}>
      <Card variant="outlined" padding="md">
        <Caption>{t('form.forAnimal')}</Caption>
        <Text variant="bodyMedium">{pet.data.name}</Text>
      </Card>
      <View style={{ height: theme.spacing.xs }} />

      <PublicationForm
        kind={kind}
        submitting={create.isPending}
        formError={formError}
        serverFields={serverFields}
        onSubmit={onSubmit}
      />
    </OrgFormLayout>
  );
}
