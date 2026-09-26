import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Icon, type IconName } from '@/components/content';
import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { FormField, Input, Select, TileOptionGroup } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { useFarmProfile, useUpdateFarmProfile } from '@/features/farmShared';
import {
  buildMemberIdentifierSchema,
  memberIdentifierToInput,
  orgCapabilities,
  useAddOrganizationMember,
  useOrganization,
  useOrganizationMembers,
  useUpdateOrganization,
  type MemberIdentifierFormValues,
} from '@/features/organizations';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { FarmJoinCodeCard, FarmStaffRow } from '../components';
import { POULTRY_PRODUCTION_TYPES, type PoultryProductionType } from '../constants';
import { buildFarmSettingsInfoSchema, type FarmSettingsInfoFormValues } from '../validation/schemas';

type SettingsTab = 'info' | 'staff' | 'vets';

/** Route `/(app)/poultry/[organizationId]/settings` — Farm Settings (owner/admin only). */
export default function FarmSettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const { isAdmin } = useCapabilities();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';
  const [tab, setTab] = useState<SettingsTab>('info');

  const detail = useOrganization(orgId);
  const caps = orgCapabilities(detail.data?.myRole, isAdmin);

  if (detail.isLoading) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('settings.title')} showBack />
        <Loading label={t('common.loading')} />
      </SafeAreaScreen>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('settings.title')} showBack />
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />
        </View>
      </SafeAreaScreen>
    );
  }

  if (!caps.canEditOrganization) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('settings.title')} showBack />
        <View style={{ padding: theme.screenPadding }}>
          <EmptyState
            icon="lock-closed-outline"
            title={t('details.notAllowedTitle')}
            message={t('details.notAllowedBody')}
          />
        </View>
      </SafeAreaScreen>
    );
  }

  const tabs: { key: SettingsTab; label: string; icon: IconName }[] = [
    { key: 'info', label: t('settings.tabInfo'), icon: 'settings-outline' },
    { key: 'staff', label: t('settings.tabStaff'), icon: 'people-outline' },
    { key: 'vets', label: t('settings.tabVets'), icon: 'medkit-outline' },
  ];

  return (
    <SafeAreaScreen>
      <AppHeader title={detail.data.name} showBack />

      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
        {tabs.map((tb) => {
          const active = tab === tb.key;
          const color = active ? theme.colors.primary : theme.colors.textSecondary;
          return (
            <Pressable
              key={tb.key}
              accessibilityRole="tab"
              accessibilityLabel={tb.label}
              accessibilityState={{ selected: active }}
              onPress={() => setTab(tb.key)}
              style={({ pressed }) => [
                {
                  flex: 1,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  columnGap: theme.spacing.xs,
                  paddingVertical: theme.spacing.md,
                  borderBottomWidth: 2,
                  borderBottomColor: active ? theme.colors.primary : 'transparent',
                  marginBottom: -1,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Icon name={tb.icon} size="iconSm" color={active ? 'primary' : 'textSecondary'} />
              <Text variant="label" weight={active ? 'bold' : undefined} style={{ color }}>
                {tb.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: theme.screenPadding,
          paddingBottom: theme.spacing.huge,
          rowGap: theme.spacing.lg,
        }}
      >
        {tab === 'info' ? (
          <FarmInfoTabBySpecies orgId={orgId} orgName={detail.data.name} />
        ) : tab === 'staff' ? (
          <FarmStaffTab orgId={orgId} canManage={caps.canManageMembers} />
        ) : (
          <FarmVetsTab orgId={orgId} orgName={detail.data.name} canManage={caps.canManageMembers} />
        )}
      </ScrollView>
    </SafeAreaScreen>
  );
}

// --- Info tab ---------------------------------------------------------

const SHEEP_PRODUCTION = ['MEAT', 'DAIRY', 'WOOL', 'BREEDING', 'MIXED', 'OTHER'] as const;
const CATTLE_PRODUCTION = ['DAIRY', 'BEEF', 'BREEDING', 'MIXED', 'OTHER'] as const;

/**
 * The info tab edits the fields of THIS farm's species. Sheep / cattle farms
 * used to land on the poultry form here (and a save wrote poultry fields onto
 * them) — now they get their own editor; the backend also rejects another
 * species' fields.
 */
function FarmInfoTabBySpecies({ orgId, orgName }: { orgId: string; orgName: string }) {
  const { t } = useTranslation('poultry');
  const profile = useFarmProfile(orgId, { enabled: Boolean(orgId) });
  if (profile.isLoading) return <Loading label={t('common.loading')} />;
  if (profile.isError) {
    return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />;
  }
  const species = profile.data?.farmSpecies;
  if (species === 'SHEEP' || species === 'CATTLE') {
    return <LivestockFarmInfoTab orgId={orgId} orgName={orgName} species={species} />;
  }
  return <FarmInfoTab orgId={orgId} orgName={orgName} />;
}

function LivestockFarmInfoTab({
  orgId,
  orgName,
  species,
}: {
  orgId: string;
  orgName: string;
  species: 'SHEEP' | 'CATTLE';
}) {
  const theme = useTheme();
  const { t } = useTranslation('sheepCattleFarm');
  const { t: tp } = useTranslation('poultry');
  const toast = useToast();
  const profile = useFarmProfile(orgId, { enabled: Boolean(orgId) });
  const updateOrg = useUpdateOrganization(orgId);
  const updateProfile = useUpdateFarmProfile(orgId);
  const p = profile.data;
  const isSheep = species === 'SHEEP';

  const [name, setName] = useState(orgName);
  const [location, setLocation] = useState(p?.location ?? '');
  const [address, setAddress] = useState(p?.address ?? '');
  const [production, setProduction] = useState<string | null>(
    (isSheep ? p?.sheepProductionType : p?.cattleProductionType) ?? null,
  );
  const [capacity, setCapacity] = useState(p?.capacity != null ? String(p.capacity) : '');
  const [headCount, setHeadCount] = useState(() => {
    const v = isSheep ? p?.currentSheepCount : p?.currentCattleCount;
    return v != null ? String(v) : '';
  });
  const [contactPhone, setContactPhone] = useState(p?.contactPhone ?? '');
  const [error, setError] = useState<string | null>(null);
  const busy = updateOrg.isPending || updateProfile.isPending;

  const toCount = (v: string): number | null => (v.trim() && /^\d+$/.test(v.trim()) ? Number(v.trim()) : null);

  const save = () => {
    setError(null);
    if (!name.trim() || !location.trim()) {
      setError(t('create.errors.nameRequired'));
      return;
    }
    updateOrg.mutate(
      { name: name.trim() },
      {
        onSuccess: () =>
          updateProfile.mutate(
            {
              location: location.trim(),
              address: address.trim() || null,
              capacity: toCount(capacity),
              contactPhone: contactPhone.trim() || null,
              ...(isSheep
                ? { sheepProductionType: production, currentSheepCount: toCount(headCount) }
                : { cattleProductionType: production, currentCattleCount: toCount(headCount) }),
            },
            {
              onSuccess: () => toast.show({ tone: 'success', message: tp('settings.saveSuccess') }),
              onError: (e) => setError(apiErrorMessage(e)),
            },
          ),
        onError: (e) => setError(apiErrorMessage(e)),
      },
    );
  };

  const productionValues: readonly string[] = isSheep ? SHEEP_PRODUCTION : CATTLE_PRODUCTION;

  return (
    <View style={{ rowGap: theme.spacing.lg }}>
      {error ? <Caption style={{ color: theme.colors.danger }}>{error}</Caption> : null}
      <Input label={t('create.fields.name')} value={name} onChangeText={setName} />
      <Input label={t('create.fields.location')} value={location} onChangeText={setLocation} />
      <Input label={t('create.fields.address')} value={address} onChangeText={setAddress} multiline />
      <Select<string>
        label={t('create.fields.production')}
        value={production}
        options={productionValues.map((v) => ({
          value: v,
          label: isSheep ? t(`create.sheepProduction.${v as (typeof SHEEP_PRODUCTION)[number]}`) : t(`create.cattleProduction.${v as (typeof CATTLE_PRODUCTION)[number]}`),
        }))}
        onChange={setProduction}
      />
      <Input label={t('create.fields.capacity')} value={capacity} onChangeText={setCapacity} keyboardType="number-pad" />
      <Input
        label={isSheep ? t('create.fields.currentSheepCount') : t('create.fields.currentCattleCount')}
        value={headCount}
        onChangeText={setHeadCount}
        keyboardType="number-pad"
      />
      <Input label={t('create.fields.contactPhone')} value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
      <Button
        label={tp('settings.save')}
        leftIcon="checkmark-circle-outline"
        fullWidth
        loading={busy}
        disabled={busy}
        onPress={save}
      />
    </View>
  );
}

function FarmInfoTab({ orgId, orgName }: { orgId: string; orgName: string }) {
  const { t } = useTranslation('poultry');
  const toast = useToast();
  const profile = useFarmProfile(orgId, { enabled: Boolean(orgId) });
  const updateOrg = useUpdateOrganization(orgId);
  const updateProfile = useUpdateFarmProfile(orgId);

  const schema = useMemo(() => buildFarmSettingsInfoSchema(t), [t]);
  const inFlight = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});

  if (profile.isLoading) return <Loading label={t('common.loading')} />;
  if (profile.isError) {
    return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />;
  }

  return (
    <FarmInfoForm
      orgId={orgId}
      orgName={orgName}
      defaultValues={{
        name: orgName,
        location: profile.data?.location ?? '',
        address: profile.data?.address ?? '',
        poultryProductionType: (profile.data?.poultryProductionType ?? 'BROILER') as PoultryProductionType,
        capacity: profile.data?.capacity != null ? String(profile.data.capacity) : '',
        currentBirdCount:
          profile.data?.currentBirdCount != null ? String(profile.data.currentBirdCount) : '',
        contactPhone: profile.data?.contactPhone ?? '',
      }}
      schema={schema}
      submitting={submitting}
      formError={formError}
      serverFields={serverFields}
      onSubmit={(values) => {
        if (inFlight.current) return;
        inFlight.current = true;
        setSubmitting(true);
        setFormError(null);
        setServerFields({});
        updateOrg.mutate(
          { name: values.name.trim() },
          {
            onSuccess: () => {
              updateProfile.mutate(
                {
                  location: values.location.trim(),
                  address: values.address?.trim() || null,
                  poultryProductionType: values.poultryProductionType,
                  capacity: values.capacity?.trim() ? Number(values.capacity) : null,
                  currentBirdCount: values.currentBirdCount?.trim()
                    ? Number(values.currentBirdCount)
                    : null,
                  contactPhone: values.contactPhone?.trim() || null,
                },
                {
                  onSuccess: () => {
                    toast.show({ tone: 'success', message: t('settings.saveSuccess') });
                  },
                  onError: (error) => {
                    setServerFields(fieldErrors(error));
                    setFormError(apiErrorMessage(error));
                  },
                  onSettled: () => {
                    setSubmitting(false);
                    inFlight.current = false;
                  },
                },
              );
            },
            onError: (error) => {
              setServerFields(fieldErrors(error));
              setFormError(apiErrorMessage(error));
              setSubmitting(false);
              inFlight.current = false;
            },
          },
        );
      }}
    />
  );
}

function FarmInfoForm({
  defaultValues,
  schema,
  submitting,
  formError,
  serverFields,
  onSubmit,
}: {
  orgId: string;
  orgName: string;
  defaultValues: FarmSettingsInfoFormValues;
  schema: ReturnType<typeof buildFarmSettingsInfoSchema>;
  submitting: boolean;
  formError: string | null;
  serverFields: Record<string, string>;
  onSubmit: (values: FarmSettingsInfoFormValues) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const { control, handleSubmit } = useForm<FarmSettingsInfoFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onTouched',
  });

  const productionOptions = POULTRY_PRODUCTION_TYPES.map((v) => ({
    value: v,
    icon: (v === 'BROILER' ? 'egg-outline' : 'ellipse-outline') as IconName,
    label: v === 'BROILER' ? t('create.production.broiler') : t('create.production.layer'),
    hint: v === 'BROILER' ? t('create.production.broilerHint') : t('create.production.layerHint'),
  }));

  return (
    <View style={{ rowGap: theme.spacing.lg }}>
      {formError ? <Caption style={{ color: theme.colors.danger }}>{formError}</Caption> : null}

      <FormField
        control={control}
        name="name"
        label={t('create.fields.name')}
        placeholder={t('create.placeholders.name')}
        serverError={serverFields.name}
      />
      <FormField
        control={control}
        name="location"
        label={t('create.fields.location')}
        placeholder={t('create.placeholders.location')}
        serverError={serverFields.location}
      />
      <FormField
        control={control}
        name="address"
        label={t('create.fields.address')}
        placeholder={t('create.placeholders.address')}
        multiline
        numberOfLines={2}
        serverError={serverFields.address}
      />

      <View style={{ rowGap: theme.spacing.sm }}>
        <Label>{t('create.fields.production')}</Label>
        <Controller
          control={control}
          name="poultryProductionType"
          render={({ field: { value, onChange }, fieldState }) => (
            <TileOptionGroup
              options={productionOptions}
              value={value}
              onChange={onChange}
              error={fieldState.error?.message}
            />
          )}
        />
      </View>

      <FormField
        control={control}
        name="capacity"
        label={t('create.fields.capacity')}
        placeholder={t('create.placeholders.capacity')}
        keyboardType="number-pad"
        serverError={serverFields.capacity}
      />
      <FormField
        control={control}
        name="currentBirdCount"
        label={t('create.fields.currentCount')}
        placeholder={t('create.placeholders.currentCount')}
        keyboardType="number-pad"
        serverError={serverFields.currentBirdCount}
      />
      <FormField
        control={control}
        name="contactPhone"
        label={t('create.fields.contactPhone')}
        keyboardType="phone-pad"
        serverError={serverFields.contactPhone}
      />

      <Button
        label={t('settings.save')}
        leftIcon="checkmark-circle-outline"
        fullWidth
        loading={submitting}
        disabled={submitting}
        onPress={handleSubmit(onSubmit)}
      />
    </View>
  );
}

// --- Staff tab (STAFF role — always view-only, per backend RBAC) ------

function FarmStaffTab({ orgId, canManage }: { orgId: string; canManage: boolean }) {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const { t: to } = useTranslation('organizations');
  const toast = useToast();
  const members = useOrganizationMembers(orgId, { roleKey: 'STAFF', status: 'ACTIVE' });
  const add = useAddOrganizationMember(orgId);

  const schema = useMemo(() => buildMemberIdentifierSchema(to), [to]);
  const { control, handleSubmit, reset } = useForm<MemberIdentifierFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: '' },
    mode: 'onTouched',
  });
  const inFlight = useRef(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});

  const onAdd = ({ identifier }: MemberIdentifierFormValues) => {
    if (inFlight.current || add.isPending) return;
    inFlight.current = true;
    setFormError(null);
    setServerFields({});
    add.mutate(
      { ...memberIdentifierToInput(identifier), role: 'STAFF' },
      {
        onSuccess: () => {
          toast.show({ tone: 'success', message: to('members.addSuccess') });
          reset({ identifier: '' });
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
    <View style={{ rowGap: theme.spacing.xl }}>
      {canManage ? (
        <View
          style={{
            borderRadius: theme.radius.xl,
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            padding: theme.spacing.lg,
            rowGap: theme.spacing.md,
          }}
        >
          <Label>{t('settings.staffAddTitle')}</Label>
          {formError ? <Caption style={{ color: theme.colors.danger }}>{formError}</Caption> : null}
          <FormField
            control={control}
            name="identifier"
            label={to('members.identifierLabel')}
            placeholder={to('members.identifierPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            serverError={serverFields.identifier ?? serverFields.email ?? serverFields.userId}
          />
          <Caption>{to('members.identifierHint')}</Caption>
          <Button
            label={to('members.addCta')}
            leftIcon="person-add"
            fullWidth
            loading={add.isPending}
            disabled={add.isPending}
            onPress={handleSubmit(onAdd)}
          />
        </View>
      ) : null}

      <View style={{ rowGap: theme.spacing.sm }}>
        <Label>{`${t('settings.staffCurrentTitle')} (${members.total})`}</Label>
        {members.isLoading ? (
          <Loading label={t('common.loading')} />
        ) : members.members.length === 0 ? (
          <Caption>{t('settings.staffEmpty')}</Caption>
        ) : (
          members.members.map((m) => <FarmStaffRow key={m.id} member={m} />)
        )}
      </View>
    </View>
  );
}

// --- Vets tab (join code + linked veterinarians, VETERINARIAN role) ---

function FarmVetsTab({
  orgId,
  orgName,
  canManage,
}: {
  orgId: string;
  orgName: string;
  canManage: boolean;
}) {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const vets = useOrganizationMembers(orgId, { roleKey: 'VETERINARIAN', status: 'ACTIVE' });

  return (
    <View style={{ rowGap: theme.spacing.xl }}>
      {canManage ? <FarmJoinCodeCard organizationId={orgId} organizationName={orgName} /> : null}

      <View style={{ rowGap: theme.spacing.sm }}>
        <Label>{`${t('settings.vetsLinkedTitle')} (${vets.total})`}</Label>
        {vets.isLoading ? (
          <Loading label={t('common.loading')} />
        ) : vets.members.length === 0 ? (
          <Caption>{t('settings.vetsEmpty')}</Caption>
        ) : (
          vets.members.map((m) => <FarmStaffRow key={m.id} member={m} />)
        )}
      </View>
    </View>
  );
}
