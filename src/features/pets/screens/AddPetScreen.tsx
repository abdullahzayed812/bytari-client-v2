import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useToast } from '@/components/feedback';
import { Routes } from '@/constants/routes';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';
import { devDataEnabled } from '@/lib/env';

import { PetForm, PetFormLayout } from '../components';
import { devPetDefaults } from '../data/devDefaults';
import { useCreatePet } from '../hooks';
import { toCreateInput, type PetFormValues } from '../validation/schemas';

/** Route `/pets/create` — Add Pet (§7). Owner is derived by the backend from the JWT. */
export default function AddPetScreen() {
  const { t } = useTranslation('pets');
  const toast = useToast();
  const create = useCreatePet();
  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});

  const onSubmit = (values: PetFormValues) => {
    if (inFlight.current || create.isPending) return; // synchronous duplicate-submit guard
    inFlight.current = true;
    setFormError(null);
    setServerFields({});
    create.mutate(toCreateInput(values), {
      onSuccess: (pet) => {
        toast.show({ tone: 'success', message: t('form.successAdd') });
        router.replace(Routes.petDetail(pet.id));
      },
      onError: (error) => {
        setServerFields(fieldErrors(error));
        setFormError(apiErrorMessage(error));
      },
      onSettled: () => {
        inFlight.current = false;
      },
    });
  };

  return (
    <PetFormLayout title={t('form.addTitle')}>
      <PetForm
        mode="add"
        defaultValues={devDataEnabled ? devPetDefaults() : undefined}
        submitting={create.isPending}
        formError={formError}
        serverFields={serverFields}
        onSubmit={onSubmit}
      />
    </PetFormLayout>
  );
}
