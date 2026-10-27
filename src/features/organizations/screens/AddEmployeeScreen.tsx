import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert, Loading, useToast } from '@/components/feedback';
import { FormField, Select } from '@/components/forms';
import { Caption, Label } from '@/components/typography';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { OrgFormLayout, PermissionSelector } from '../components';
import { orgCapabilities, permissionGroupsFor } from '../constants';
import {
  useAddOrganizationMember,
  useAssignOrganizationSupervisor,
  useOrganization,
} from '../hooks';
import { EMPLOYEE_ROLES, type EmployeeRole } from '../types';
import {
  buildMemberIdentifierSchema,
  memberIdentifierToInput,
  type MemberIdentifierFormValues,
} from '../validation/schemas';

/**
 * Route `/organizations/[organizationId]/employees/add` — the single "add a
 * person" form of the unified Employees page (clinic + veterinary office).
 * The person is identified by the email of an existing account and given one
 * role: STAFF / VETERINARIAN go through `POST /members`, SUPERVISOR through
 * `POST /supervisors` with the permissions picked here. Only the roles the
 * caller may grant are offered; the backend re-checks every rule.
 *
 * Optional params `email` + `role` prefill the form (e.g. "make supervisor"
 * from the Employees list for an existing member).
 */
export default function AddEmployeeScreen() {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const toast = useToast();
  const { isAdmin } = useCapabilities();
  const params = useLocalSearchParams<{ organizationId: string; email?: string; role?: string }>();
  const orgId = params.organizationId ?? '';

  const org = useOrganization(orgId);
  const caps = orgCapabilities(org.data?.myRole, isAdmin, org.data?.myPermissions);
  const roleOptions = EMPLOYEE_ROLES.filter((r) =>
    r === 'SUPERVISOR' ? caps.canAssignSupervisors : caps.canAddMembers,
  );
  const groups = permissionGroupsFor(org.data?.type);

  const addMember = useAddOrganizationMember(orgId);
  const assign = useAssignOrganizationSupervisor(orgId);
  const busy = addMember.isPending || assign.isPending;

  const schema = useMemo(() => buildMemberIdentifierSchema(t), [t]);
  const { control, handleSubmit } = useForm<MemberIdentifierFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: params.email ?? '' },
    mode: 'onTouched',
  });

  const requested = EMPLOYEE_ROLES.find((r) => r === params.role);
  const [role, setRole] = useState<EmployeeRole>(requested ?? 'STAFF');
  // Fall back to the first role the caller may grant once capabilities load.
  useEffect(() => {
    const first = roleOptions[0];
    if (first && !roleOptions.includes(role)) setRole(first);
  }, [roleOptions, role]);
  const [permissions, setPermissions] = useState<string[]>([]);

  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});

  const onSubmit = ({ identifier }: MemberIdentifierFormValues) => {
    if (inFlight.current || busy) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});
    const callbacks = {
      onSuccess: () => {
        toast.show({ tone: 'success', message: t('employees.addSuccess') });
        router.back();
      },
      onError: (error: unknown) => {
        setServerFields(fieldErrors(error));
        setFormError(apiErrorMessage(error));
      },
      onSettled: () => {
        inFlight.current = false;
      },
    };
    const who = memberIdentifierToInput(identifier);
    if (role === 'SUPERVISOR') {
      assign.mutate({ ...who, permissions }, callbacks);
    } else {
      addMember.mutate({ ...who, role }, callbacks);
    }
  };

  if (org.isLoading) {
    return (
      <OrgFormLayout title={t('employees.addTitle')}>
        <Loading fill />
      </OrgFormLayout>
    );
  }

  return (
    <OrgFormLayout title={t('employees.addTitle')}>
      {formError ? <Alert tone="danger" message={formError} /> : null}
      {roleOptions.length === 0 ? (
        <Alert tone="warning" message={t('employees.noAddPermission')} />
      ) : null}

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

      <Select<EmployeeRole>
        label={t('members.roleLabel')}
        placeholder={t('members.rolePlaceholder')}
        value={role}
        options={roleOptions.map((r) => ({
          value: r,
          label: t(`employees.role.${r}`),
          description: t(`employees.roleHint.${r}`),
        }))}
        onChange={setRole}
        error={serverFields.role}
      />

      {role === 'SUPERVISOR' ? (
        <>
          <Label>{t('supervisors.permissionsLabel')}</Label>
          <PermissionSelector
            value={permissions}
            onChange={setPermissions}
            disabled={busy}
            groups={groups}
          />
        </>
      ) : null}

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          label={t('employees.addCta')}
          fullWidth
          loading={busy}
          disabled={busy || roleOptions.length === 0}
          onPress={handleSubmit(onSubmit)}
          accessibilityLabel={t('employees.addCta')}
        />
      </View>
    </OrgFormLayout>
  );
}
