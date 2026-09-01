import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Alert, Loading, useToast } from '@/components/feedback';
import { FormField } from '@/components/forms';
import { Caption, Label } from '@/components/typography';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { OrgFormLayout, PermissionSelector } from '../components';
import { ORG_MANAGEMENT_PERMISSION_KEYS } from '../constants';
import {
  useAssignOrganizationSupervisor,
  useOrganizationSupervisors,
  useUpdateOrganizationSupervisor,
} from '../hooks';
import { buildUserIdSchema } from '../validation/schemas';

/**
 * Route `/organizations/[organizationId]/supervisors/assign`.
 *
 *  - No `membershipId` param → CREATE: `{ userId: uuid, permissions: string[] }`.
 *    The backend requires the target to be an APPROVED veterinarian, not the
 *    owner, and the actor to hold `supervisor.assign`. None of that is
 *    re-implemented here — the client only collects input.
 *  - With `membershipId` → EDIT: PATCH just `{ permissions: string[] }`.
 *
 * Permission keys are the presentation grouping of the backend
 * `ORG_PERMISSION_KEYS`; the backend re-validates every key.
 */
export default function AssignSupervisorScreen() {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const toast = useToast();
  const { organizationId, membershipId } = useLocalSearchParams<{
    organizationId: string;
    membershipId?: string;
  }>();
  const orgId = organizationId ?? '';
  const isEdit = Boolean(membershipId);

  const supervisors = useOrganizationSupervisors(orgId, { enabled: isEdit });
  const existing = isEdit ? supervisors.data?.find((s) => s.id === membershipId) : undefined;

  const assign = useAssignOrganizationSupervisor(orgId);
  const patch = useUpdateOrganizationSupervisor(orgId);

  const schema = useMemo(() => buildUserIdSchema(t), [t]);
  const { control, handleSubmit } = useForm<{ userId: string }>({
    resolver: zodResolver(schema),
    defaultValues: { userId: '' },
    mode: 'onTouched',
  });

  // Selection state is fully owned here after first load, so unchecking every
  // permission in edit mode actually sends `[]` (rather than snapping back to
  // the stored set).
  const manageable: readonly string[] = ORG_MANAGEMENT_PERMISSION_KEYS;
  const [permissions, setPermissions] = useState<string[]>([]);
  const seededFor = useRef<string | null>(null);
  useEffect(() => {
    if (isEdit && existing && seededFor.current !== existing.id) {
      seededFor.current = existing.id;
      setPermissions(existing.permissions.filter((p) => manageable.includes(p)));
    }
  }, [isEdit, existing, manageable]);
  const effectivePermissions = permissions;

  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const busy = assign.isPending || patch.isPending;

  const finish = (message: string) => {
    toast.show({ tone: 'success', message });
    router.back();
  };
  const fail = (error: unknown) => {
    setServerFields(fieldErrors(error));
    setFormError(apiErrorMessage(error));
  };
  const done = () => {
    inFlight.current = false;
  };

  const submitCreate = ({ userId }: { userId: string }) => {
    if (inFlight.current || busy) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});
    assign.mutate(
      { userId: userId.trim(), permissions: effectivePermissions },
      {
        onSuccess: () => finish(t('supervisors.assignSuccess')),
        onError: fail,
        onSettled: done,
      },
    );
  };

  const submitEdit = () => {
    if (inFlight.current || busy || !membershipId) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});
    patch.mutate(
      { membershipId, input: { permissions: effectivePermissions } },
      {
        onSuccess: () => finish(t('supervisors.updateSuccess')),
        onError: fail,
        onSettled: done,
      },
    );
  };

  if (isEdit && supervisors.isLoading) {
    return (
      <OrgFormLayout title={t('supervisors.editTitle')}>
        <Loading fill />
      </OrgFormLayout>
    );
  }

  return (
    <OrgFormLayout title={isEdit ? t('supervisors.editTitle') : t('supervisors.assignTitle')}>
      {formError ? <Alert tone="danger" message={formError} /> : null}

      {isEdit && existing ? (
        <View style={{ rowGap: 4 }}>
          <Label>{t('supervisors.editingFor')}</Label>
          <Caption>
            {`${existing.user.firstName} ${existing.user.lastName}`.trim()} · {existing.user.email}
          </Caption>
        </View>
      ) : isEdit ? (
        <Alert tone="warning" message={t('supervisors.notFound')} />
      ) : (
        <>
          <FormField
            control={control}
            name="userId"
            label={t('supervisors.userIdLabel')}
            placeholder={t('supervisors.userIdPlaceholder')}
            autoCapitalize="none"
            autoCorrect={false}
            serverError={serverFields.userId}
          />
          <Caption>{t('supervisors.userIdHint')}</Caption>
        </>
      )}

      <Label>{t('supervisors.permissionsLabel')}</Label>
      <PermissionSelector
        key={isEdit ? (existing ? existing.id : 'loading') : 'create'}
        value={effectivePermissions}
        onChange={setPermissions}
        disabled={busy}
      />

      <View style={{ marginTop: theme.spacing.sm }}>
        <Button
          label={isEdit ? t('supervisors.savePermissions') : t('supervisors.assignCta')}
          fullWidth
          loading={busy}
          disabled={busy || (isEdit && !existing)}
          onPress={isEdit ? submitEdit : handleSubmit(submitCreate)}
          accessibilityLabel={
            isEdit ? t('supervisors.savePermissions') : t('supervisors.assignCta')
          }
        />
      </View>
    </OrgFormLayout>
  );
}
