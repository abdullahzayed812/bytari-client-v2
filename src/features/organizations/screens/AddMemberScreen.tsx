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
import { useAddOrganizationMember, useOrganization } from '../hooks';
import { ASSIGNABLE_MEMBER_ROLES, type AssignableMemberRole } from '../types';
import {
  buildMemberIdentifierSchema,
  memberIdentifierToInput,
  type MemberIdentifierFormValues,
} from '../validation/schemas';

/**
 * Route `/organizations/[organizationId]/members/add`. The target is
 * identified by either their email (must already belong to an existing
 * account — resolved server-side) or their raw user id (UUID, when no email
 * lookup is convenient). The backend validates that the resolved account is
 * ACTIVE (and, for a VETERINARIAN role, an APPROVED veterinarian).
 */
export default function AddMemberScreen() {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const add = useAddOrganizationMember(organizationId ?? '');

  const schema = useMemo(() => buildMemberIdentifierSchema(t), [t]);
  const { control, handleSubmit } = useForm<MemberIdentifierFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: '' },
    mode: 'onTouched',
  });
  const [role, setRole] = useState<AssignableMemberRole>('STAFF');
  // A FARM takes veterinarians only via its join code / QR (backend-enforced),
  // so only STAFF is offered here for farms.
  const org = useOrganization(organizationId);
  const isFarm = org.data?.type === 'FARM';
  const roleOptions = isFarm
    ? ASSIGNABLE_MEMBER_ROLES.filter((r) => r === 'STAFF')
    : ASSIGNABLE_MEMBER_ROLES;
  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});

  const onSubmit = ({ identifier }: MemberIdentifierFormValues) => {
    if (inFlight.current || add.isPending) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});
    add.mutate(
      { ...memberIdentifierToInput(identifier), role },
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
        name="identifier"
        label={t('members.identifierLabel')}
        placeholder={t('members.identifierPlaceholder')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        serverError={serverFields.identifier ?? serverFields.email ?? serverFields.userId}
      />
      <Caption>{t('members.identifierHint')}</Caption>

      <Select<AssignableMemberRole>
        label={t('members.roleLabel')}
        placeholder={t('members.rolePlaceholder')}
        value={role}
        options={roleOptions.map((r) => ({
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
