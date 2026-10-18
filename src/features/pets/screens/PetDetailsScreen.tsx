import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal as RNModal, Pressable, View } from 'react-native';

import { Button } from '@/components/actions';
import { Card } from '@/components/content';
import {
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  Loading,
  SkeletonText,
  useToast,
} from '@/components/feedback';
import { Row, ScrollScreen } from '@/components/layout';
import { QrCode } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { RecordCardSkeleton, ReminderCard, VaccinationCard } from '@/features/medical/components';
import { useAnimalReminders, useVaccinations } from '@/features/medical/hooks';
import { useMarkPetSectionSeen, usePetUnseenCounts } from '@/features/notifications/hooks';
import { PublicationKindBadge, PublicationStatusBadge } from '@/features/publications/components';
import { PUBLICATION_KIND_META } from '@/features/publications/constants';
import { useAnimalPublications } from '@/features/publications/hooks';
import { UserName } from '@/features/users/components';
import { useAuth, useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { copyText } from '@/lib/clipboard';
import { shareText } from '@/lib/share';
import { ApiError } from '@/services/api';
import { useTheme, type Theme } from '@/theme';
import { formatDate } from '@/utils';

import { PetImage } from '../components';
import { petAge } from '../constants';
import { useDeactivatePet, usePet } from '../hooks';
import { formatPetCode } from '../petCode';
import type { Pet } from '../types';

import { PetClinicCard, usePetClinics } from './PetClinicsScreen';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type PetTab = 'info' | 'vaccinations' | 'reminders' | 'clinics';

/** The reference design's palette (`html (18).html`). */
const C = {
  green: '#229759',
  greenIcon: '#2e9e66',
  red: '#ea6763',
  statLabel: '#8b919d',
  subtitle: '#71717a',
  tabIdle: '#52525b',
  border: '#e5e7eb',
  cardBorder: '#e7e9ed',
  divider: '#f1f2f4',
  rowLabel: '#27272a',
  rowValue: '#3f3f46',
} as const;

/** The four quick-action tiles — tint / border / icon circle / accent per tile. */
const TILE = {
  LOST: {
    bg: '#fef6f7',
    border: '#fbd5da',
    circle: '#ffe4e6',
    fg: C.red,
    title: C.red,
    hint: C.subtitle,
  },
  ADOPTION: {
    bg: '#f3fcf8',
    border: '#b8efd5',
    circle: '#d1fae5',
    fg: C.green,
    title: C.green,
    hint: C.subtitle,
  },
  MATING: {
    bg: '#fcf9ff',
    border: '#eddcff',
    circle: '#f3e8ff',
    fg: '#9333ea',
    title: '#7e22ce',
    hint: C.subtitle,
  },
  TRANSFER: {
    bg: '#eff6ff',
    border: '#bfdbfe',
    circle: '#dbeafe',
    fg: '#2563eb',
    title: '#2563eb',
    hint: '#64748b',
  },
} as const;

/** Light design colours stay as-is; in dark mode tinted surfaces become translucent accents. */
function tileColors(theme: Theme, tile: (typeof TILE)[keyof typeof TILE]) {
  if (theme.scheme !== 'dark') return tile;
  return {
    ...tile,
    bg: `${tile.fg}14`,
    border: `${tile.fg}55`,
    circle: `${tile.fg}26`,
    hint: theme.colors.textSecondary,
  };
}

/**
 * Route `/pets/[petId]` — pet profile, laid out after the reference design:
 * photo + name/breed header with back / edit / delete, age·sex·weight stats,
 * the ID card (QR + copy; tap → QR modal), and tabs معلومات / التطعيمات /
 * التذكيرات / العيادات rendered inline. Of what clinics add, the owner sees
 * ONLY vaccinations and reminders (read-only); clinic medical records,
 * diagnoses, treatments and notes are clinic-private and have no entry here.
 */
export default function PetDetailsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('pets');
  const toast = useToast();
  const nav = useRouter();
  const { user } = useAuth();
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const q = usePet(petId);
  const pet = q.data;
  const isOwner = Boolean(pet && user && pet.currentOwnerUserId === user.id);
  // Admin / ANIMAL supervisor oversight: may see who owns the animal (the
  // backend only serves the profile + ownership history to them anyway).
  const caps = useCapabilities();
  const canSeeOwner = !isOwner && caps.isSupervisorOf('ANIMAL');
  const canPublish = isOwner && pet?.status === 'ACTIVE';
  const listings = useAnimalPublications(petId, { enabled: canPublish });
  // "New from the clinic" per section — unread pet-care notifications, owner only.
  const unseen = usePetUnseenCounts(petId, isOwner);
  const deactivate = useDeactivatePet(petId ?? '');

  const [tab, setTab] = useState<PetTab>('info');
  const [qrOpen, setQrOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
  );

  const notFound = q.error instanceof ApiError && q.error.status === 404;

  if (notFound) {
    return (
      <ScrollScreen>
        <AppHeader title={t('detail.title')} showBack />
        <EmptyState
          icon="help-circle-outline"
          title={t('detail.notFoundTitle')}
          message={t('detail.notFoundBody')}
          actionLabel={t('detail.backToList')}
          onAction={() => router.replace(Routes.pets)}
        />
      </ScrollScreen>
    );
  }

  if (q.isError) {
    return (
      <ScrollScreen>
        <AppHeader title={t('detail.title')} showBack />
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </ScrollScreen>
    );
  }

  const goBack = () => (nav.canGoBack() ? nav.back() : nav.replace(Routes.pets));

  if (q.isLoading || !pet) {
    return (
      <ScrollScreen padded={false} background="surface">
        <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
          <Row gap="lg">
            <PetImage uri={null} species="OTHER" size={96} rounded="pill" />
            <View style={{ flex: 1 }}>
              <SkeletonText lines={2} />
            </View>
          </Row>
          <View style={{ marginTop: theme.spacing.xl }}>
            <SkeletonText lines={5} />
          </View>
        </View>
      </ScrollScreen>
    );
  }

  const age = petAge(pet.dateOfBirth);
  const ageLabel = age
    ? age.years > 0
      ? age.months > 0
        ? t('detail.ageYearsMonths', { years: age.years, months: age.months })
        : t('detail.ageYears', { count: age.years })
      : age.months > 0
        ? t('detail.ageMonths', { count: age.months })
        : t('detail.ageNewborn')
    : t('detail.noValue');
  const subtitle = [t(`species.${pet.species}`), pet.breed].filter(Boolean).join(' - ');
  const photo = pet.galleryUrls?.[0] ?? null;
  // Edit stays open to any viewer of an ACTIVE pet (the backend authorizes,
  // as before); delete (soft deactivate) is the owner's.
  const canEdit = pet.status === 'ACTIVE';
  const canDelete = isOwner && canEdit;

  const copyId = async () => {
    if (!pet.publicCode) return;
    if (await copyText(pet.publicCode)) {
      toast.show({ tone: 'success', message: t('detail.idCopied') });
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 2000);
    } else {
      // A build without the native clipboard module — hand the ID to the share sheet.
      void shareText(pet.publicCode);
    }
  };

  const tabs: { key: PetTab; label: string; badge: number }[] = [
    { key: 'info', label: t('detail.tabInfo'), badge: 0 },
    ...(isOwner
      ? ([
          { key: 'vaccinations', label: t('detail.tabVaccinations'), badge: unseen.vaccinations },
          { key: 'reminders', label: t('detail.tabReminders'), badge: unseen.reminders },
          { key: 'clinics', label: t('detail.tabClinics'), badge: 0 },
        ] as const)
      : []),
  ];

  return (
    <ScrollScreen padded={false} background="surface">
      {/* --- Header: photo + name / breed (start), back + edit / delete (left) --- */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 14, flex: 1 }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: theme.scheme === 'dark' ? theme.colors.border : C.border,
              ...theme.shadows.xs,
            }}
          >
            <PetImage uri={photo} species={pet.species} size={96} rounded="pill" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 30, lineHeight: 40, fontWeight: '800' }} numberOfLines={1}>
              {pet.name}
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '500',
                color: theme.scheme === 'dark' ? theme.colors.textSecondary : C.subtitle,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
            {pet.status === 'DEACTIVATED' ? (
              <Caption style={{ marginTop: 2 }}>{t('status.DEACTIVATED')}</Caption>
            ) : null}
          </View>
        </View>

        <View style={{ alignItems: 'flex-end', rowGap: 12 }}>
          <HeaderIcon
            icon="chevron-back"
            color={C.green}
            size={26}
            label={t('detail.back')}
            onPress={goBack}
          />
          {canEdit ? (
            // Physical order (left → right) is edit, delete; RTL rows run right → left.
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 14 }}>
              {canDelete ? (
                <HeaderIcon
                  icon="trash-outline"
                  color={C.red}
                  label={t('detail.delete')}
                  onPress={() => setConfirmDelete(true)}
                />
              ) : null}
              <HeaderIcon
                icon="create-outline"
                color={C.greenIcon}
                label={t('detail.edit')}
                onPress={() => router.push(Routes.petEdit(pet.id))}
              />
            </View>
          ) : null}
        </View>
      </View>

      {/* --- Stats: العمر / الجنس / الوزن --- */}
      <View style={{ paddingHorizontal: 24, paddingTop: 20, flexDirection: 'row' }}>
        {[
          { label: t('detail.statAge'), value: ageLabel },
          { label: t('detail.statSex'), value: t(`sex.${pet.sex}`) },
          {
            label: t('detail.statWeight'),
            value:
              pet.weightKg != null
                ? t('detail.weightValue', { value: pet.weightKg })
                : t('detail.noValue'),
          },
        ].map((s) => (
          <View key={s.label} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: C.statLabel }}>{s.label}</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 4 }} numberOfLines={1}>
              {s.value}
            </Text>
          </View>
        ))}
      </View>

      {/* --- ID card: QR + ID (left), copy (right); tap → QR modal --- */}
      {isOwner && pet.publicCode ? (
        <View style={{ paddingHorizontal: 20, marginTop: 24, marginBottom: 12 }}>
          <View
            style={{
              borderWidth: 1,
              borderColor: theme.scheme === 'dark' ? theme.colors.border : C.cardBorder,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              columnGap: 12,
              backgroundColor: theme.colors.surface,
            }}
          >
            {/* RTL row: first child sits on the right. */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('detail.copyId')}
              hitSlop={8}
              onPress={() => void copyId()}
              style={{ padding: 8, borderRadius: 8 }}
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy-outline'}
                size={24}
                color={copied ? '#059669' : C.greenIcon}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('detail.qrOpen')}
              onPress={() => setQrOpen(true)}
              style={({ pressed }) => ({
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
                columnGap: 16,
                transform: [{ scale: pressed ? 0.99 : 1 }],
              })}
            >
              <View style={{ alignItems: 'flex-end' }}>
                <View
                  style={{ flexDirection: 'row-reverse', alignItems: 'baseline', columnGap: 6 }}
                >
                  <Text
                    style={{ fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary }}
                  >
                    ID:
                  </Text>
                  <Text
                    style={{ fontSize: 16, fontWeight: '700' }}
                    accessibilityLabel={pet.publicCode.split('').join(' ')}
                  >
                    {formatPetCode(pet.publicCode)}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginTop: 6 }}>
                  {pet.publicCode}
                </Text>
              </View>
              <View style={{ padding: 2, backgroundColor: '#FFFFFF', borderRadius: 4 }}>
                <QrCode
                  value={pet.publicCode}
                  size={76}
                  accessibilityLabel={t('detail.idSection')}
                />
              </View>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* --- Tabs --- */}
      <View
        accessibilityRole="tablist"
        style={{
          marginTop: 8,
          flexDirection: 'row',
          justifyContent: 'space-around',
          borderBottomWidth: 1,
          borderBottomColor: theme.scheme === 'dark' ? theme.colors.border : C.border,
          paddingHorizontal: 8,
        }}
      >
        {tabs.map((it) => {
          const active = tab === it.key;
          const badge = it.badge > 0 ? t('detail.newCount', { count: it.badge }) : null;
          return (
            <Pressable
              key={it.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={badge ? `${it.label}، ${badge}` : it.label}
              onPress={() => setTab(it.key)}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 12,
                flexDirection: 'row',
                columnGap: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: active ? '700' : '600',
                  color: active
                    ? C.green
                    : theme.scheme === 'dark'
                      ? theme.colors.textSecondary
                      : C.tabIdle,
                }}
              >
                {it.label}
              </Text>
              {badge ? (
                <View
                  style={{
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    paddingHorizontal: 4,
                    backgroundColor: C.red,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>
                    {it.badge}
                  </Text>
                </View>
              ) : null}
              {active ? (
                <View
                  style={{
                    position: 'absolute',
                    bottom: -1,
                    left: 0,
                    right: 0,
                    height: 2.5,
                    backgroundColor: C.green,
                    borderTopLeftRadius: 999,
                    borderTopRightRadius: 999,
                  }}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 }}>
        {tab === 'info' ? (
          <InfoTab
            pet={pet}
            isOwner={isOwner}
            canSeeOwner={canSeeOwner}
            canPublish={canPublish}
            listings={listings.publications}
          />
        ) : tab === 'vaccinations' ? (
          <VaccinationsTab petId={pet.id} />
        ) : tab === 'reminders' ? (
          <RemindersTab petId={pet.id} />
        ) : (
          <ClinicsTab petId={pet.id} />
        )}
      </View>

      {/* --- QR modal --- */}
      {pet.publicCode ? (
        <RNModal
          visible={qrOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setQrOpen(false)}
          statusBarTranslucent
        >
          <Pressable
            accessibilityLabel={t('detail.close')}
            onPress={() => setQrOpen(false)}
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 16,
            }}
          >
            <Pressable
              onPress={(e) => e.stopPropagation?.()}
              style={{
                width: '100%',
                maxWidth: 320,
                backgroundColor: theme.colors.surface,
                borderRadius: 24,
                padding: 24,
                alignItems: 'center',
                ...theme.shadows.overlay,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('detail.close')}
                onPress={() => setQrOpen(false)}
                hitSlop={8}
                style={{ position: 'absolute', top: 16, left: 16, padding: 6, borderRadius: 999 }}
              >
                <Ionicons name="close" size={20} color="#a3a3a3" />
              </Pressable>

              <View style={{ marginTop: 8, marginBottom: 16, alignItems: 'center' }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    overflow: 'hidden',
                    borderWidth: 2,
                    borderColor: 'rgba(16,185,129,0.2)',
                    marginBottom: 8,
                  }}
                >
                  <PetImage uri={photo} species={pet.species} size={64} rounded="pill" />
                </View>
                <Text style={{ fontSize: 20, fontWeight: '700' }}>{pet.name}</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: C.subtitle }}>
                  {t('detail.qrSubtitle')}
                </Text>
              </View>

              <View
                style={{
                  width: 224,
                  height: 224,
                  padding: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(229,229,229,0.8)',
                  backgroundColor: '#fafafa',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <QrCode
                  value={pet.publicCode}
                  size={190}
                  accessibilityLabel={t('detail.idSection')}
                />
              </View>

              {/* ID row — physical LTR: "ID: code" left, copy button right. */}
              <View
                style={{
                  marginTop: 16,
                  width: '100%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor:
                    theme.scheme === 'dark' ? theme.colors.surfaceMuted : 'rgba(245,245,245,0.8)',
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.scheme === 'dark' ? theme.colors.border : '#e5e5e5',
                }}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copied ? t('detail.copied') : t('detail.copy')}
                  onPress={() => void copyId()}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    columnGap: 6,
                    minWidth: 70,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 8,
                    backgroundColor: copied ? '#047857' : pressed ? '#1b7a48' : C.green,
                  })}
                >
                  <Ionicons
                    name={copied ? 'checkmark' : 'copy-outline'}
                    size={14}
                    color="#FFFFFF"
                  />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>
                    {copied ? t('detail.copied') : t('detail.copy')}
                  </Text>
                </Pressable>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', columnGap: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#737373' }}>ID:</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', letterSpacing: 1 }}>
                    {formatPetCode(pet.publicCode)}
                  </Text>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </RNModal>
      ) : null}

      <ConfirmationDialog
        visible={confirmDelete}
        title={t('detail.deleteConfirmTitle')}
        message={t('detail.deleteConfirmBody')}
        confirmLabel={t('detail.delete')}
        cancelLabel={t('detail.cancel')}
        destructive
        loading={deactivate.isPending}
        onConfirm={() => {
          setConfirmDelete(false);
          deactivate.mutate(undefined, {
            onSuccess: () => {
              toast.show({ tone: 'success', message: t('detail.deleted') });
              router.replace(Routes.pets);
            },
            onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
          });
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </ScrollScreen>
  );
}

function HeaderIcon({
  icon,
  color,
  label,
  onPress,
  size = 24,
}: {
  icon: IoniconName;
  color: string;
  label: string;
  onPress: () => void;
  size?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => ({ padding: 2, opacity: pressed ? 0.75 : 1 })}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

/** "معلومات" tab — general information rows + the owner's quick actions. */
function InfoTab({
  pet,
  isOwner,
  canSeeOwner = false,
  canPublish,
  listings,
}: {
  pet: Pet;
  isOwner: boolean;
  /** Admin / ANIMAL supervisor viewing someone else's animal. */
  canSeeOwner?: boolean;
  canPublish: boolean;
  listings: ReturnType<typeof useAnimalPublications>['publications'];
}) {
  const theme = useTheme();
  const { t } = useTranslation('pets');
  const { t: tp } = useTranslation('publications');
  const dark = theme.scheme === 'dark';

  const rows: { label: string; value: string; ltr?: boolean }[] = [
    { label: t('detail.fieldColor'), value: pet.color ?? t('detail.noValue') },
    {
      label: t('detail.fieldNeutered'),
      value:
        pet.isNeutered == null
          ? t('detail.noValue')
          : pet.isNeutered
            ? t('form.neuteredYes')
            : t('form.neuteredNo'),
    },
    ...(isOwner && pet.publicCode
      ? [{ label: t('detail.idSection'), value: formatPetCode(pet.publicCode), ltr: true }]
      : []),
    {
      label: t('detail.fieldDob'),
      value: pet.dateOfBirth ? pet.dateOfBirth.replace(/-/g, '/') : t('detail.noValue'),
      ltr: true,
    },
  ];

  const tiles = [
    {
      key: 'LOST' as const,
      icon: 'search-outline' as IoniconName,
      title: t('detail.actionLost'),
      hint: t('detail.actionLostHint'),
      onPress: () => router.push(Routes.petPublish(pet.id, PUBLICATION_KIND_META.LOST.slug)),
    },
    {
      key: 'ADOPTION' as const,
      icon: 'heart-outline' as IoniconName,
      title: t('detail.actionAdoption'),
      hint: t('detail.actionAdoptionHint'),
      onPress: () => router.push(Routes.petPublish(pet.id, PUBLICATION_KIND_META.ADOPTION.slug)),
    },
    {
      key: 'MATING' as const,
      icon: 'male-female-outline' as IoniconName,
      title: t('detail.actionMating'),
      hint: t('detail.actionMatingHint'),
      onPress: () => router.push(Routes.petPublish(pet.id, PUBLICATION_KIND_META.MATING.slug)),
    },
    {
      key: 'TRANSFER' as const,
      icon: 'swap-horizontal-outline' as IoniconName,
      title: t('detail.actionTransfer'),
      hint: t('detail.actionTransferHint'),
      onPress: () =>
        router.push({ pathname: Routes.petTransferRequests, params: { petId: pet.id } }),
    },
  ];

  return (
    <View>
      <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>
        {t('detail.generalInfo')}
      </Text>
      {rows.map((r, i) => (
        <View
          key={r.label}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 14,
            borderTopWidth: i === 0 ? 0 : 1,
            borderTopColor: dark ? theme.colors.border : C.divider,
          }}
        >
          <Text style={{ fontSize: 16, color: dark ? theme.colors.textPrimary : C.rowLabel }}>
            {r.label}
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '500',
              color: dark ? theme.colors.textSecondary : C.rowValue,
              letterSpacing: r.ltr ? 0.5 : 0,
              writingDirection: r.ltr ? 'ltr' : undefined,
              maxWidth: '60%',
            }}
            numberOfLines={1}
          >
            {r.value}
          </Text>
        </View>
      ))}

      {canSeeOwner && pet.currentOwnerUserId ? (
        <View
          style={{
            paddingVertical: 14,
            rowGap: 8,
            borderTopWidth: 1,
            borderTopColor: dark ? theme.colors.border : C.divider,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ fontSize: 16, color: dark ? theme.colors.textPrimary : C.rowLabel }}>
              {t('detail.ownerAdmin')}
            </Text>
            <UserName userId={pet.currentOwnerUserId} />
          </View>
          <Button
            label={t('detail.ownerAdminHistory')}
            variant="outline"
            size="sm"
            leftIcon="people-outline"
            onPress={() => router.push(Routes.petOwnership(pet.id))}
          />
        </View>
      ) : null}

      {pet.medicalHistory ? (
        <View
          style={{
            paddingVertical: 14,
            borderTopWidth: 1,
            borderTopColor: dark ? theme.colors.border : C.divider,
            rowGap: 4,
          }}
        >
          <Caption>{t('form.medicalHistoryLabel')}</Caption>
          <Text variant="body">{pet.medicalHistory}</Text>
        </View>
      ) : null}
      {pet.notes ? (
        <View
          style={{
            paddingVertical: 14,
            borderTopWidth: 1,
            borderTopColor: dark ? theme.colors.border : C.divider,
            rowGap: 4,
          }}
        >
          <Caption>{t('detail.fieldNotes')}</Caption>
          <Text variant="body">{pet.notes}</Text>
        </View>
      ) : null}

      {canPublish ? (
        <View style={{ marginTop: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {tiles.map((tile) => {
            const c = tileColors(theme, TILE[tile.key]);
            return (
              <Pressable
                key={tile.key}
                accessibilityRole="button"
                accessibilityLabel={tile.title}
                onPress={tile.onPress}
                style={({ pressed }) => ({
                  flexBasis: '47%',
                  flexGrow: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 14,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: c.border,
                  backgroundColor: c.bg,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                })}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: c.circle,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                  }}
                >
                  <Ionicons name={tile.icon} size={20} color={c.fg} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: c.title }}>
                  {tile.title}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '500', color: c.hint, marginTop: 2 }}>
                  {tile.hint}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {/* This pet's existing listings (adoption / mating / lost). */}
      {canPublish && listings.length > 0 ? (
        <View style={{ marginTop: theme.spacing.lg, rowGap: theme.spacing.sm }}>
          <Caption>{tp('detail.listingsTitle')}</Caption>
          {listings.map((pub) => (
            <Card
              key={pub.id}
              variant="outlined"
              padding="md"
              onPress={() => router.push(Routes.petPublication(pet.id, pub.id))}
              accessibilityLabel={tp('detail.listingRow', {
                kind: tp(`detail.publishAction.${pub.kind}`),
              })}
            >
              <Row gap="sm" wrap align="center">
                <PublicationKindBadge kind={pub.kind} />
                <PublicationStatusBadge status={pub.status} />
                <Caption>{formatDate(pub.createdAt)}</Caption>
              </Row>
            </Card>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** "التطعيمات" tab — the owner's read-only vaccination history. */
function VaccinationsTab({ petId }: { petId: string }) {
  const { t } = useTranslation('medical');
  const { t: tpets } = useTranslation('pets');
  const theme = useTheme();
  const q = useVaccinations({ animalId: petId });
  // Owner opened this section → clear only its "new" badge.
  useMarkPetSectionSeen(petId, 'vaccinations');

  if (q.isLoading) {
    return (
      <View style={{ rowGap: theme.spacing.md }}>
        {[0, 1].map((i) => (
          <RecordCardSkeleton key={i} />
        ))}
      </View>
    );
  }
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />;
  if (q.vaccinations.length === 0) {
    return (
      <EmptyState
        icon="shield-checkmark-outline"
        title={t('vaccinations.empty')}
        message={t('vaccinations.emptyHint')}
      />
    );
  }
  return (
    <View style={{ rowGap: theme.spacing.md }}>
      <Caption>{t('vaccinations.count', { count: q.total })}</Caption>
      {q.vaccinations.map((v) => (
        <VaccinationCard
          key={v.id}
          vaccination={v}
          onPress={() => router.push(Routes.petVaccination(petId, v.id))}
        />
      ))}
      {q.isFetchingNextPage ? (
        <Loading />
      ) : q.hasNextPage ? (
        <Button
          label={tpets('detail.loadMore')}
          variant="outline"
          fullWidth
          onPress={() => void q.fetchNextPage()}
        />
      ) : null}
    </View>
  );
}

/** "التذكيرات" tab — every clinic's reminders for the pet, read-only. */
function RemindersTab({ petId }: { petId: string }) {
  const { t } = useTranslation('medical');
  const theme = useTheme();
  const q = useAnimalReminders({ animalId: petId });
  useMarkPetSectionSeen(petId, 'reminders');

  if (q.isLoading) return <Loading />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const items = q.data?.items ?? [];
  if (items.length === 0) {
    return <EmptyState icon="notifications-outline" title={t('reminders.empty')} />;
  }
  return (
    <View style={{ rowGap: theme.spacing.md }}>
      {items.map((r) => (
        <ReminderCard key={r.id} reminder={r} />
      ))}
    </View>
  );
}

/** "العيادات" tab — clinics that added vaccinations / reminders, with chat. */
function ClinicsTab({ petId }: { petId: string }) {
  const { t } = useTranslation('pets');
  const theme = useTheme();
  const q = usePetClinics(petId);

  if (q.isLoading) return <Loading />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} />;
  const clinics = q.data ?? [];
  if (clinics.length === 0) return <EmptyState icon="medkit-outline" title={t('clinics.empty')} />;
  return (
    <View style={{ rowGap: theme.spacing.md }}>
      {clinics.map((c) => (
        <PetClinicCard key={c.organizationId} clinic={c} />
      ))}
    </View>
  );
}
