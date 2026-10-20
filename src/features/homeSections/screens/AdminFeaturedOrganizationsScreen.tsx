import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { Button, IconButton } from '@/components/actions';
import { Badge, Card, Icon, type BadgeTone } from '@/components/content';
import {
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  Loading,
  useToast,
} from '@/components/feedback';
import { Input, SearchInput, SegmentedControl, Switch } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { BottomSheet } from '@/components/overlays';
import { Caption, Label, Text } from '@/components/typography';
import { useAdminOrganizations } from '@/features/admin/hooks';
import { useDebouncedValue } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';
import {
  compareIsoDates,
  isValidIsoDate,
  normalizeIsoDate,
  toLocalIsoDate,
} from '@/utils/localDate';

import { useAdminFeaturedOrganizations, useFeaturedOrganizationMutations } from '../hooks';
import type { AdminFeaturedOrganization, FeaturedPlacement, FeaturedState } from '../types';

const PLACEMENTS: FeaturedPlacement[] = ['PET_OWNER_HOME', 'VETERINARIAN_HOME'];
type FeaturableType = 'CLINIC' | 'VETERINARY_OFFICE';

function stateTone(state: FeaturedState): BadgeTone {
  if (state === 'ACTIVE') return 'success';
  if (state === 'SCHEDULED') return 'info';
  if (state === 'DISABLED') return 'warning';
  return 'neutral';
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toLocalIsoDate(d);
}

interface FormState {
  organization: { id: string; name: string; type: string } | null;
  placement: FeaturedPlacement;
  startsOn: string;
  endsOn: string;
  sortOrder: string;
  isEnabled: boolean;
}

/**
 * Route `/(app)/admin/featured-organizations` — "العيادات والمكاتب المميزة":
 * which existing clinics / veterinary offices the home-page carousels show,
 * on which home page, from / until when, and whether the entry is switched
 * on. Each entry shows its derived state (active / scheduled / expired /
 * disabled) and warns when the organization itself is currently hidden.
 * `home_section.manage` (ADMIN) is enforced by the backend on every call.
 */
export default function AdminFeaturedOrganizationsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const toast = useToast();
  const list = useAdminFeaturedOrganizations();
  const { create, update, remove } = useFeaturedOrganizationMutations();

  const [placementFilter, setPlacementFilter] = useState<'ALL' | FeaturedPlacement>('ALL');
  const [editing, setEditing] = useState<AdminFeaturedOrganization | 'new' | null>(null);
  const [deleting, setDeleting] = useState<AdminFeaturedOrganization | null>(null);

  const entries = (list.data ?? []).filter(
    (e) => placementFilter === 'ALL' || e.placement === placementFilter,
  );

  const onError = (e: unknown) => toast.show({ message: apiErrorMessage(e), tone: 'danger' });

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('featuredOrgs.title')}
        showBack
        right={
          <IconButton
            icon="add"
            variant="soft"
            accessibilityLabel={t('featuredOrgs.add')}
            onPress={() => setEditing('new')}
          />
        }
      />
      <ScrollView
        contentContainerStyle={{
          padding: theme.screenPadding,
          paddingBottom: theme.spacing.huge,
          rowGap: theme.spacing.md,
        }}
      >
        <Caption>{t('featuredOrgs.hint')}</Caption>
        <SegmentedControl<'ALL' | FeaturedPlacement>
          value={placementFilter}
          onChange={setPlacementFilter}
          options={[
            { value: 'ALL', label: t('featuredOrgs.allPages') },
            { value: 'PET_OWNER_HOME', label: t('featuredOrgs.pageShort.PET_OWNER_HOME') },
            { value: 'VETERINARIAN_HOME', label: t('featuredOrgs.pageShort.VETERINARIAN_HOME') },
          ]}
        />

        {list.isLoading ? (
          <Loading />
        ) : list.isError ? (
          <ErrorState error={list.error} onRetry={() => void list.refetch()} />
        ) : entries.length === 0 ? (
          <EmptyState
            icon="star-outline"
            title={t('featuredOrgs.empty')}
            message={t('featuredOrgs.emptyHint')}
            actionLabel={t('featuredOrgs.add')}
            onAction={() => setEditing('new')}
          />
        ) : (
          entries.map((e) => (
            <Card key={e.id} variant="outlined" padding="md">
              <View style={{ rowGap: theme.spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', columnGap: 8 }}>
                  <View style={{ flex: 1, rowGap: 2 }}>
                    <Text variant="bodyStrong" numberOfLines={2}>
                      {e.organization.name}
                    </Text>
                    <Caption>
                      {t(`featuredOrgs.type.${e.organization.type as FeaturableType}`, {
                        defaultValue: e.organization.type,
                      })}
                      {' · '}
                      {t(`homeSections.pages.${e.placement}`)}
                    </Caption>
                  </View>
                  <Badge label={t(`featuredOrgs.state.${e.state}`)} tone={stateTone(e.state)} />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
                  <Icon name="calendar-outline" size="iconXs" color="textMuted" />
                  <Caption>
                    {t('featuredOrgs.window', {
                      from: formatDate(e.startsOn),
                      to: formatDate(e.endsOn),
                    })}
                  </Caption>
                  <Caption>{' · '}</Caption>
                  <Caption>{t('featuredOrgs.order', { value: e.sortOrder })}</Caption>
                </View>

                {!e.organization.publiclyVisible ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
                    <Icon name="eye-off-outline" size="iconXs" color="warning" />
                    <Caption color="warning">{t('featuredOrgs.orgHidden')}</Caption>
                  </View>
                ) : null}

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    columnGap: 8,
                  }}
                >
                  <Switch
                    value={e.isEnabled}
                    label={t('featuredOrgs.enabled')}
                    disabled={update.isPending}
                    onValueChange={(isEnabled) =>
                      update.mutate({ id: e.id, input: { isEnabled } }, { onError })
                    }
                  />
                  <View style={{ flexDirection: 'row', columnGap: 4 }}>
                    <IconButton
                      icon="create-outline"
                      accessibilityLabel={t('featuredOrgs.edit')}
                      onPress={() => setEditing(e)}
                    />
                    <IconButton
                      icon="trash-outline"
                      accessibilityLabel={t('featuredOrgs.remove')}
                      onPress={() => setDeleting(e)}
                    />
                  </View>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {editing ? (
        <FeaturedForm
          entry={editing === 'new' ? null : editing}
          saving={create.isPending || update.isPending}
          onClose={() => setEditing(null)}
          onSubmit={(form) => {
            const sortOrder = Number(form.sortOrder) || 0;
            const startsOn = normalizeIsoDate(form.startsOn) ?? form.startsOn;
            const endsOn = normalizeIsoDate(form.endsOn) ?? form.endsOn;
            const done = {
              onSuccess: () => {
                setEditing(null);
                toast.show({ message: t('featuredOrgs.saved'), tone: 'success' });
              },
              onError,
            };
            if (editing === 'new') {
              if (!form.organization) return;
              create.mutate(
                {
                  organizationId: form.organization.id,
                  placement: form.placement,
                  startsOn,
                  endsOn,
                  isEnabled: form.isEnabled,
                  sortOrder,
                },
                done,
              );
            } else {
              update.mutate(
                {
                  id: editing.id,
                  input: { startsOn, endsOn, isEnabled: form.isEnabled, sortOrder },
                },
                done,
              );
            }
          }}
        />
      ) : null}

      <ConfirmationDialog
        visible={deleting !== null}
        title={t('featuredOrgs.removeTitle')}
        message={deleting ? t('featuredOrgs.removeBody', { name: deleting.organization.name }) : ''}
        confirmLabel={t('featuredOrgs.remove')}
        destructive
        loading={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onSuccess: () => setDeleting(null),
            onError,
          });
        }}
      />
    </SafeAreaScreen>
  );
}

/** Add (pick an organization + page) or edit (window / order / switch) one entry. */
function FeaturedForm({
  entry,
  saving,
  onClose,
  onSubmit,
}: {
  entry: AdminFeaturedOrganization | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (form: FormState) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const today = toLocalIsoDate(new Date());
  const [form, setForm] = useState<FormState>(() =>
    entry
      ? {
          organization: entry.organization,
          placement: entry.placement,
          startsOn: entry.startsOn,
          endsOn: entry.endsOn,
          sortOrder: String(entry.sortOrder),
          isEnabled: entry.isEnabled,
        }
      : {
          organization: null,
          placement: 'PET_OWNER_HOME',
          startsOn: today,
          endsOn: addDays(today, 30),
          sortOrder: '0',
          isEnabled: true,
        },
  );
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const [orgType, setOrgType] = useState<FeaturableType>('CLINIC');
  const [rawSearch, setRawSearch] = useState('');
  const search = useDebouncedValue(rawSearch, 300);
  const orgs = useAdminOrganizations({
    type: orgType,
    status: 'ACTIVE',
    search,
    pageSize: 10,
    enabled: entry === null,
  });

  const startValid = isValidIsoDate(form.startsOn);
  const endValid = isValidIsoDate(form.endsOn);
  const orderValid = /^\d{1,4}$/.test(form.sortOrder.trim());
  const windowValid = startValid && endValid && compareIsoDates(form.endsOn, form.startsOn) >= 0;
  const canSave = Boolean(form.organization) && windowValid && orderValid && !saving;

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title={entry ? t('featuredOrgs.editTitle') : t('featuredOrgs.addTitle')}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ rowGap: theme.spacing.md, paddingBottom: theme.spacing.lg }}
      >
        {entry ? (
          <View style={{ rowGap: 2 }}>
            <Label>{t('featuredOrgs.organization')}</Label>
            <Text variant="bodyStrong">{entry.organization.name}</Text>
            <Caption>{t(`homeSections.pages.${entry.placement}`)}</Caption>
          </View>
        ) : (
          <>
            <Label>{t('featuredOrgs.page')}</Label>
            <SegmentedControl<FeaturedPlacement>
              value={form.placement}
              onChange={(placement) => set({ placement })}
              options={[
                { value: PLACEMENTS[0]!, label: t('featuredOrgs.pageShort.PET_OWNER_HOME') },
                { value: PLACEMENTS[1]!, label: t('featuredOrgs.pageShort.VETERINARIAN_HOME') },
              ]}
            />
            <Label>{t('featuredOrgs.organization')}</Label>
            <SegmentedControl<FeaturableType>
              value={orgType}
              onChange={(v) => {
                setOrgType(v);
                set({ organization: null });
              }}
              options={[
                { value: 'CLINIC', label: t('featuredOrgs.type.CLINIC') },
                { value: 'VETERINARY_OFFICE', label: t('featuredOrgs.type.VETERINARY_OFFICE') },
              ]}
            />
            <SearchInput
              value={rawSearch}
              onChangeText={setRawSearch}
              onClear={() => setRawSearch('')}
              placeholder={t('featuredOrgs.searchPlaceholder')}
              accessibilityLabel={t('featuredOrgs.searchPlaceholder')}
            />
            <View style={{ rowGap: 6 }}>
              {orgs.isLoading ? (
                <Loading />
              ) : orgs.organizations.length === 0 ? (
                <Caption>{t('featuredOrgs.noOrganizations')}</Caption>
              ) : (
                orgs.organizations.map((o) => {
                  const selected = form.organization?.id === o.id;
                  return (
                    <Pressable
                      key={o.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={() =>
                        set({ organization: { id: o.id, name: o.name, type: o.type } })
                      }
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        columnGap: 8,
                        padding: theme.spacing.sm,
                        borderRadius: theme.radius.md,
                        borderWidth: 1,
                        borderColor: selected ? theme.colors.primary : theme.colors.border,
                        backgroundColor: selected
                          ? theme.colors.surfaceAccent
                          : theme.colors.surface,
                      }}
                    >
                      <Icon
                        name={selected ? 'radio-button-on' : 'radio-button-off'}
                        size="iconSm"
                        color={selected ? 'primary' : 'textMuted'}
                      />
                      <Text style={{ flex: 1 }} numberOfLines={2}>
                        {o.name}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </View>
          </>
        )}

        <Input
          label={t('featuredOrgs.startsOn')}
          value={form.startsOn}
          onChangeText={(startsOn) => set({ startsOn })}
          placeholder="2026-10-1"
          keyboardType="numbers-and-punctuation"
          autoCorrect={false}
          hint={t('featuredOrgs.dateHint')}
          error={form.startsOn && !startValid ? t('featuredOrgs.dateError') : undefined}
          required
        />
        <Input
          label={t('featuredOrgs.endsOn')}
          value={form.endsOn}
          onChangeText={(endsOn) => set({ endsOn })}
          placeholder="2026-10-31"
          keyboardType="numbers-and-punctuation"
          autoCorrect={false}
          hint={t('featuredOrgs.dateHint')}
          error={
            form.endsOn && !endValid
              ? t('featuredOrgs.dateError')
              : startValid && endValid && !windowValid
                ? t('featuredOrgs.windowError')
                : undefined
          }
          required
        />
        <Input
          label={t('featuredOrgs.sortOrder')}
          value={form.sortOrder}
          onChangeText={(sortOrder) => set({ sortOrder })}
          keyboardType="number-pad"
          hint={t('featuredOrgs.sortOrderHint')}
          error={!orderValid ? t('featuredOrgs.sortOrderError') : undefined}
        />
        <Switch
          value={form.isEnabled}
          onValueChange={(isEnabled) => set({ isEnabled })}
          label={t('featuredOrgs.enabled')}
        />
        <Button
          label={t('featuredOrgs.save')}
          onPress={() => onSubmit(form)}
          disabled={!canSave}
          loading={saving}
          fullWidth
        />
      </ScrollView>
    </BottomSheet>
  );
}
