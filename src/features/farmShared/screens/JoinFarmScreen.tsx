import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert, useToast } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useVeterinarianStatus } from '@/features/auth';
import { fieldErrors } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { useJoinFarmByCode } from '../hooks';
import {
  buildJoinFarmSchema,
  farmErrorMessage,
  type JoinFarmFormValues,
} from '../validation/schemas';

/**
 * Route `/veterinarian/join-farm` — a veterinarian enters a farm's Farm-ID and
 * becomes a member. No invitation / acceptance / owner approval (§9): the
 * backend creates the VETERINARIAN membership on submit. Approved vets only
 * (route + backend both check).
 */
export default function JoinFarmScreen() {
  const theme = useTheme();
  const { t } = useTranslation('farm');
  const toast = useToast();
  const vet = useVeterinarianStatus();
  const join = useJoinFarmByCode();

  const schema = useMemo(() => buildJoinFarmSchema(t), [t]);
  const { control, handleSubmit } = useForm<JoinFarmFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { joinCode: '' },
    mode: 'onTouched',
  });
  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});

  const onSubmit = ({ joinCode }: JoinFarmFormValues) => {
    if (inFlight.current || join.isPending) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});
    join.mutate(
      { joinCode },
      {
        onSuccess: (membership) => {
          toast.show({ tone: 'success', message: t('join.success') });
          router.replace(Routes.organizationDetail(membership.organizationId));
        },
        onError: (error) => {
          setServerFields(fieldErrors(error));
          setFormError(farmErrorMessage(error, t));
        },
        onSettled: () => {
          inFlight.current = false;
        },
      },
    );
  };

  return (
    <ScrollScreen>
      <AppHeader title={t('join.title')} showBack />
      <Section spacing="xl">
        <Caption>{t('join.intro')}</Caption>

        {!vet.isApproved ? (
          <View style={{ marginTop: theme.spacing.md }}>
            <Alert tone="warning" message={t('join.errors.notApprovedVet')} />
          </View>
        ) : (
          <View style={{ marginTop: theme.spacing.lg, rowGap: theme.spacing.lg }}>
            {formError ? <Alert tone="danger" message={formError} /> : null}

            <FormField
              control={control}
              name="joinCode"
              label={t('join.codeLabel')}
              placeholder={t('join.codePlaceholder')}
              autoCapitalize="characters"
              autoCorrect={false}
              serverError={serverFields.joinCode}
            />
            <Text variant="caption" color="textMuted">
              {t('join.noApprovalNote')}
            </Text>

            <Button
              label={t('join.cta')}
              fullWidth
              loading={join.isPending}
              disabled={join.isPending}
              onPress={handleSubmit(onSubmit)}
              accessibilityLabel={t('join.cta')}
            />
          </View>
        )}
      </Section>
    </ScrollScreen>
  );
}
