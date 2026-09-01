import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert, useToast } from '@/components/feedback';
import { FormField, Select } from '@/components/forms';
import { Caption } from '@/components/typography';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { OrgFormLayout } from '../components';
import { useAddOrganizationMember } from '../hooks';
import { ASSIGNABLE_MEMBER_ROLES, type AssignableMemberRole } from '../types';
import { buildUserIdSchema } from '../validation/schemas';

/**
 * Route `/organizations/[organizationId]/members/add`. The backend contract is
 * `{ userId: uuid, role: 'VETERINARIAN' | 'STAFF' }` — there is no user-directory
 * / search endpoint in scope, so the member is identified by their user id. The
 * backend validates that the id resolves to an ACTIVE account (and, for a
 * VETERINARIAN role, an APPROVED veterinarian).
 */
export default function AddMemberScreen() {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const add = useAddOrganizationMember(organizationId ?? '');

  const schema = useMemo(() => buildUserIdSchema(t), [t]);
  const { control, handleSubmit } = useForm<{ userId: string }>({
    resolver: zodResolver(schema),
    defaultValues: { userId: '' },
    mode: 'onTouched',
  });
  const [role, setRole] = useState<AssignableMemberRole>('STAFF');
  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});

  const onSubmit = ({ userId }: { userId: string }) => {
    if (inFlight.current || add.isPending) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});
    add.mutate(
      { userId: userId.trim(), role },
      {
        onSuccess: () => {
          toast.show({ tone: 'success', message: t('members.addSuccess') });
          router.back();
        },
        onError: (error) => {
          setServerFields(fieldErrors(error));
          setFormError(apiErrorMessage(error));
        },
        onSettled: () => {
          inFlight.current = false;
        },
      },
    );
  };

  return (
    <OrgFormLayout title={t('members.addTitle')}>
      {formError ? <Alert tone="danger" message={formError} /> : null}

      <FormField
        control={control}
        name="userId"
        label={t('members.userIdLabel')}
        placeholder={t('members.userIdPlaceholder')}
        autoCapitalize="none"
        autoCorrect={false}
        serverError={serverFields.userId}
      />
      <Caption>{t('members.userIdHint')}</Caption>

      <Select<AssignableMemberRole>
        label={t('members.roleLabel')}
        placeholder={t('members.rolePlaceholder')}
        value={role}
        options={ASSIGNABLE_MEMBER_ROLES.map((r) => ({
          value: r,
          label: t(`role.${r}`),
          description: t(`members.roleHint.${r}`),
        }))}
        onChange={setRole}
        error={serverFields.role}
      />

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          label={t('members.addCta')}
          fullWidth
          loading={add.isPending}
          disabled={add.isPending}
          onPress={handleSubmit(onSubmit)}
          accessibilityLabel={t('members.addCta')}
        />
      </View>
    </OrgFormLayout>
  );
}
