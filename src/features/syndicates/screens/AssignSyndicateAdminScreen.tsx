import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/actions';
import { Alert, useToast } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { useAssignSyndicateAdmin } from '../hooks';

/**
 * Route `/(app)/syndicates/[organizationId]/admins/new` — "إضافة مسؤول نقابة".
 * `POST /syndicates/:id/admins` assigns a SUPERVISOR membership carrying the
 * COMPLETE syndicate permission set for THIS syndicate only (the server picks
 * the permissions — the client cannot grant anything else).
 */
export default function AssignSyndicateAdminScreen() {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const assign = useAssignSyndicateAdmin(organizationId ?? '');

  const schema = useMemo(
    () => z.object({ email: z.string().trim().email(t('adminsForm.errors.email')) }),
    [t],
  );
  const { control, handleSubmit } = useForm<{ email: string }>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });

  const onSubmit = ({ email }: { email: string }): void => {
    assign.mutate(email.trim().toLowerCase(), {
      onSuccess: () => {
        toast.show({ message: t('adminsForm.assigned'), tone: 'success' });
        router.back();
      },
      onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
    });
  };

  return (
    <SafeAreaScreen>
      <AppHeader title={t('adminsForm.title')} showBack />
      <ScrollView
        contentContainerStyle={{ padding: theme.screenPadding, rowGap: theme.spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        <Alert tone="info" message={t('adminsForm.hint')} />
        <FormField
          control={control}
          name="email"
          label={t('adminsForm.emailLabel')}
          placeholder={t('adminsForm.emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {assign.isError ? <Alert tone="danger" message={apiErrorMessage(assign.error)} /> : null}
      </ScrollView>
      <View style={{ padding: theme.screenPadding }}>
        <Button
          label={assign.isPending ? t('adminsForm.submitting') : t('adminsForm.submit')}
          fullWidth
          loading={assign.isPending}
          disabled={assign.isPending}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </SafeAreaScreen>
  );
}
