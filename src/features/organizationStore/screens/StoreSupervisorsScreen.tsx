import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button, TextButton } from '@/components/actions';
import { Card } from '@/components/content';
import { Alert, EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { Checkbox } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { BottomSheet } from '@/components/overlays';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import {
  orgCapabilities,
  useAssignOrganizationSupervisor,
  useOrganization,
  useOrganizationMembers,
  useOrganizationSupervisors,
  useUpdateOrganizationSupervisor,
} from '@/features/organizations';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

/** The store keys an owner can hand out here (offices have no stock / inventory key). */
export const STORE_SUPERVISOR_GROUPS = [
  {
    key: 'products',
    permissions: ['product.read', 'product.create', 'product.update', 'product.delete'],
  },
  { key: 'orders', permissions: ['store.order.read', 'store.order.manage'] },
] as const;
const STORE_KEYS: readonly string[] = STORE_SUPERVISOR_GROUPS.flatMap((g) => [...g.permissions]);

type StoreKey = (typeof STORE_SUPERVISOR_GROUPS)[number]['permissions'][number];

interface Editing {
  /** Existing supervisor membership, or `null` when promoting a staff member. */
  membershipId: string | null;
  userId: string;
  name: string;
  /** Non-store grants of an existing supervisor — kept untouched on save. */
  otherPermissions: string[];
  selected: string[];
}

const fullName = (u: { firstName: string; lastName: string; email: string }) =>
  `${u.firstName} ${u.lastName}`.trim() || u.email;

/**
 * Route `/organization-store/[organizationId]/supervisors` — "مشرفو المتجر".
 *
 * The owner picks an EXISTING member (any employee — the server allows a
 * non-veterinarian here because the grant is store-only) and ticks product
 * and/or order permissions. Promotion sends `retainRolePermissions` so the
 * employee keeps their day-to-day access. Editing / "removing" only touches
 * the store keys of a supervisor's grant — their membership and any other
 * permissions are preserved. Every rule is re-checked server-side.
 */
export default function StoreSupervisorsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('organizationStore');
  const toast = useToast();
  const { isAdmin } = useCapabilities();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const org = useOrganization(orgId);
  const caps = orgCapabilities(org.data?.myRole, isAdmin, org.data?.myPermissions);
  const canAssign = caps.canAssignSupervisors;
  const supervisors = useOrganizationSupervisors(orgId, { enabled: caps.canViewSupervisors });
  const members = useOrganizationMembers(orgId, { status: 'ACTIVE', enabled: caps.canViewMembers });
  const assign = useAssignOrganizationSupervisor(orgId);
  const patch = useUpdateOrganizationSupervisor(orgId);
  const [editing, setEditing] = useState<Editing | null>(null);
  const busy = assign.isPending || patch.isPending;

  const storeSupervisors = useMemo(
    () =>
      (supervisors.data ?? []).filter(
        (s) => s.status === 'ACTIVE' && s.permissions.some((p) => STORE_KEYS.includes(p)),
      ),
    [supervisors.data],
  );
  const candidates = useMemo(
    () => members.members.filter((m) => m.roleKey === 'STAFF' || m.roleKey === 'VETERINARIAN'),
    [members.members],
  );

  const toggle = (key: StoreKey, on: boolean) =>
    setEditing((cur) =>
      cur
        ? {
            ...cur,
            selected: on
              ? [...new Set([...cur.selected, key])]
              : cur.selected.filter((k) => k !== key),
          }
        : cur,
    );

  const done = (message: string) => {
    setEditing(null);
    toast.show({ tone: 'success', message });
  };
  const fail = (e: unknown) => toast.show({ tone: 'danger', message: apiErrorMessage(e) });

  const save = () => {
    if (!editing || busy) return;
    if (editing.membershipId === null) {
      if (editing.selected.length === 0) {
        toast.show({ tone: 'warning', message: t('storeSupervisors.selectAtLeastOne') });
        return;
      }
      assign.mutate(
        { userId: editing.userId, permissions: editing.selected, retainRolePermissions: true },
        { onSuccess: () => done(t('storeSupervisors.assigned')), onError: fail },
      );
      return;
    }
    patch.mutate(
      {
        membershipId: editing.membershipId,
        input: { permissions: [...editing.otherPermissions, ...editing.selected] },
      },
      {
        onSuccess: () =>
          done(
            editing.selected.length === 0
              ? t('storeSupervisors.removed')
              : t('storeSupervisors.updated'),
          ),
        onError: fail,
      },
    );
  };

  if (org.isLoading) {
    return (
      <SafeAreaScreen>
        <Loading fill />
      </SafeAreaScreen>
    );
  }
  if (!org.data || !caps.canViewSupervisors) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('storeSupervisors.title')} showBack />
        <ErrorState error={org.error} onRetry={() => void org.refetch()} />
      </SafeAreaScreen>
    );
  }

  return (
    <SafeAreaScreen>
      <AppHeader title={t('storeSupervisors.title')} subtitle={org.data.name} showBack />
      <ScrollView
        contentContainerStyle={{
          padding: theme.screenPadding,
          rowGap: theme.spacing.lg,
          paddingBottom: theme.spacing.huge,
        }}
      >
        <Alert tone="info" message={t('storeSupervisors.intro')} />

        <View style={{ rowGap: theme.spacing.sm }}>
          <Label>{t('storeSupervisors.current')}</Label>
          {supervisors.isLoading ? (
            <Loading />
          ) : storeSupervisors.length === 0 ? (
            <Caption>{t('storeSupervisors.noneYet')}</Caption>
          ) : (
            storeSupervisors.map((s) => (
              <Card key={s.id} variant="outlined" padding="md">
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1, rowGap: 2 }}>
                    <Text variant="bodyStrong">{fullName(s.user)}</Text>
                    <Caption>
                      {s.permissions
                        .filter((p) => STORE_KEYS.includes(p))
                        .map((p) => t(`storeSupervisors.perms.${p as StoreKey}`))
                        .join('، ')}
                    </Caption>
                  </View>
                  {canAssign ? (
                    <TextButton
                      label={t('storeSupervisors.edit')}
                      onPress={() =>
                        setEditing({
                          membershipId: s.id,
                          userId: s.userId,
                          name: fullName(s.user),
                          otherPermissions: s.permissions.filter((p) => !STORE_KEYS.includes(p)),
                          selected: s.permissions.filter((p) => STORE_KEYS.includes(p)),
                        })
                      }
                    />
                  ) : null}
                </View>
              </Card>
            ))
          )}
        </View>

        {canAssign ? (
          <View style={{ rowGap: theme.spacing.sm }}>
            <Label>{t('storeSupervisors.pickStaff')}</Label>
            {members.isLoading ? (
              <Loading />
            ) : candidates.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title={t('storeSupervisors.noStaff')}
                actionLabel={t('storeSupervisors.goToEmployees')}
                onAction={() => router.push(Routes.organizationEmployees(orgId))}
              />
            ) : (
              candidates.map((m) => (
                <Card
                  key={m.id}
                  variant="outlined"
                  padding="md"
                  onPress={() =>
                    setEditing({
                      membershipId: null,
                      userId: m.userId,
                      name: fullName(m.user),
                      otherPermissions: [],
                      selected: ['product.read', 'store.order.read'],
                    })
                  }
                  accessibilityLabel={fullName(m.user)}
                >
                  <Text variant="bodyMedium">{fullName(m.user)}</Text>
                  <Caption>{m.user.email}</Caption>
                </Card>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>

      <BottomSheet
        visible={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? t('storeSupervisors.permissionsFor', { name: editing.name }) : undefined}
      >
        {editing ? (
          <View style={{ rowGap: theme.spacing.md, paddingBottom: theme.spacing.lg }}>
            {STORE_SUPERVISOR_GROUPS.map((g) => (
              <View key={g.key} style={{ rowGap: theme.spacing.xs }}>
                <Label>{t(`storeSupervisors.groups.${g.key}`)}</Label>
                {g.permissions.map((p) => (
                  <Checkbox
                    key={p}
                    label={t(`storeSupervisors.perms.${p}`)}
                    checked={editing.selected.includes(p)}
                    disabled={busy}
                    onChange={(on) => toggle(p, on)}
                  />
                ))}
              </View>
            ))}
            <Button
              label={
                editing.membershipId ? t('storeSupervisors.save') : t('storeSupervisors.assign')
              }
              fullWidth
              loading={busy}
              disabled={busy}
              onPress={save}
            />
            {editing.membershipId ? (
              <Button
                label={t('storeSupervisors.remove')}
                variant="ghost"
                fullWidth
                disabled={busy}
                onPress={() => {
                  if (!editing.membershipId) return;
                  patch.mutate(
                    {
                      membershipId: editing.membershipId,
                      input: { permissions: editing.otherPermissions },
                    },
                    { onSuccess: () => done(t('storeSupervisors.removed')), onError: fail },
                  );
                }}
              />
            ) : null}
          </View>
        ) : null}
      </BottomSheet>
    </SafeAreaScreen>
  );
}
