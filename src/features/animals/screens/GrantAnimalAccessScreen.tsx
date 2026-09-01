import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert, useToast } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { OrgFormLayout } from '@/features/organizations';
import { fieldErrors } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { useGrantOrganizationAnimalAccess } from '../hooks';
import {
  buildGrantAnimalAccessSchema,
  grantAnimalAccessErrorMessage,
  type GrantAnimalAccessFormValues,
} from '../validation/schemas';

/**
 * Route `/organizations/[organizationId]/animals/grant`.
 *
 * Backend contract: `POST /organizations/:organizationId/animal-access` with
 * `{ animalId: uuid }`. This GRANTS the clinic veterinary access — it does NOT
 * transfer ownership (§10). There is no animal search / lookup-by-identifier
 * endpoint (§54), so the animal is identified by its id, exactly like the
 * Phase 4 add-member / assign-supervisor screens. The backend validates the
 * animal exists, the org is a CLINIC, and there is no existing grant.
 */
export default function GrantAnimalAccessScreen() {
  const theme = useTheme();
  const { t } = useTranslation('orgAnimals');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';
  const grant = useGrantOrganizationAnimalAccess(orgId);

  const schema = useMemo(() => buildGrantAnimalAccessSchema(t), [t]);
  const { control, handleSubmit } = useForm<GrantAnimalAccessFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { animalId: '' },
    mode: 'onTouched',
  });
  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});

  const onSubmit = ({ animalId }: GrantAnimalAccessFormValues) => {
    if (inFlight.current || grant.isPending) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});
    grant.mutate(
      { animalId: animalId.trim() },
      {
        onSuccess: (access) => {
          toast.show({ tone: 'success', message: t('grant.success') });
          router.replace(Routes.organizationAnimalDetail(orgId, access.animalId));
        },
        onError: (error) => {
          setServerFields(fieldErrors(error));
          setFormError(grantAnimalAccessErrorMessage(error, t));
        },
        onSettled: () => {
          inFlight.current = false;
        },
      },
    );
  };

  return (
    <OrgFormLayout title={t('grant.title')}>
      {formError ? <Alert tone="danger" message={formError} /> : null}

      <FormField
        control={control}
        name="animalId"
        label={t('grant.animalIdLabel')}
        placeholder={t('grant.animalIdPlaceholder')}
        autoCapitalize="none"
        autoCorrect={false}
        serverError={serverFields.animalId}
      />
      <Caption>{t('grant.animalIdHint')}</Caption>

      <Caption>{t('grant.ownershipNote')}</Caption>

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          label={t('grant.cta')}
          fullWidth
          loading={grant.isPending}
          disabled={grant.isPending}
          onPress={handleSubmit(onSubmit)}
          accessibilityLabel={t('grant.cta')}
        />
      </View>
    </OrgFormLayout>
  );
}
