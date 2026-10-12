import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState, type ComponentProps, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import {
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  Loading,
  SkeletonText,
  useToast,
} from '@/components/feedback';
import { Row, ScrollScreen } from '@/components/layout';
import { ImageViewer, QrCode } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
// Deep imports (not the barrels) — keeps animals ↔ clinicDashboard / medical acyclic.
import { useClinicPermissions } from '@/features/clinicDashboard/hooks';
import { displayDateOnly, recordedByThisClinic, todayIso } from '@/features/medical/constants';
import {
  useAnimalReminders,
  useDeleteMedicalRecord,
  useDeleteReminder,
  useDeleteVaccination,
  useMedicalRecords,
  useVaccinations,
} from '@/features/medical/hooks';
import type { AnimalReminder, MedicalRecord, Vaccination } from '@/features/medical/types';
import { medicalErrorMessage } from '@/features/medical/validation/schemas';
import { orgCapabilities, useOrganization } from '@/features/organizations';
import { PetImage, petAge } from '@/features/pets';
import { formatPetCode } from '@/features/pets/petCode';
import { UserName } from '@/features/users/components';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { copyText } from '@/lib/clipboard';
import { shareText } from '@/lib/share';
import { ApiError } from '@/services/api';
import { useTheme, type Theme } from '@/theme';

import { useClinicAnimalProfile, useClinicOwnerChat, useRemoveClinicPet } from '../hooks';
import type { ClinicAnimalProfile } from '../types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type TabKey = 'records' | 'vaccinations' | 'reminders' | 'lab' | 'files' | 'notes';

/** The reference design's palette (`ملف الحيوان من لوحة تحكم العيادة.html`). */
const C = {
  brand: '#27ae60',
  brandSoft: '#e8f6eb',
  brandSoftBorder: '#c5ebd8',
  infoBg: '#e8f8f3',
  infoBorder: '#d2f0e3',
  infoDivider: '#c5ebd8',
  cardBorder: '#e9eef3',
  itemBorder: '#e8eff5',
  pillBg: '#f8fafc',
  pillBorder: '#e2e8f0',
  tabsBg: '#f2f6fa',
  tabsBorder: '#e5edf4',
  tabIdle: '#9ca3af',
  red: '#ef4444',
  title: '#111827',
  muted: '#9ca3af',
  label: '#6b7280',
  value: '#1f2937',
} as const;

/** Tinted tiles / highlighted rows: background, border, accent, label. */
const TONE = {
  green: { bg: '#e6f9f0', border: '#d1f2e1', fg: '#059669', label: '#047857' },
  mint: { bg: '#e8f8f3', border: '#d2f0e3', fg: '#047857', label: '#047857' },
  blue: { bg: '#ebf3ff', border: '#dbe8fa', fg: '#2563eb', label: '#1d4ed8' },
  orange: { bg: '#fef3eb', border: '#fcdcc7', fg: '#ea580c', label: '#ea580c' },
  purple: { bg: '#f3eeff', border: '#e2d5ff', fg: '#7c3aed', label: '#7c3aed' },
  amber: { bg: '#fffbf0', border: '#fef3c7', fg: '#d97706', label: '#b45309' },
  stat: { bg: '#fff7ed', border: '#ffedd5', fg: '#d97706', label: '#b45309' },
  neutral: { bg: '#f8fafc', border: '#e2e8f0', fg: '#059669', label: '#6b7280' },
} as const satisfies Record<string, Tone>;
interface Tone {
  bg: string;
  border: string;
  fg: string;
  label: string;
}

/** Light design colours stay as-is; in dark mode tinted surfaces become translucent accents. */
function tone(theme: Theme, t: Tone): Tone {
  if (theme.scheme !== 'dark') return t;
  return { bg: `${t.fg}14`, border: `${t.fg}55`, fg: t.fg, label: t.fg };
}

/** Record-type accent (the card's side stripe + badge). */
const RECORD_TONE: Record<MedicalRecord['recordType'], keyof typeof TONE> = {
  GENERAL: 'green',
  QUICK_REVIEW: 'amber',
  FULL_EXAM: 'green',
  LAB: 'blue',
  FILE: 'neutral',
};
const RECORD_ICON: Record<MedicalRecord['recordType'], IoniconName> = {
  GENERAL: 'medkit-outline',
  QUICK_REVIEW: 'flash',
  FULL_EXAM: 'clipboard-outline',
  LAB: 'flask-outline',
  FILE: 'folder-outline',
};

/**
 * Route `/organizations/[organizationId]/animals/[animalId]` — the clinic's
 * pet profile, laid out after the reference design: photo + name / breed with
 * back, an age · sex · weight · colour · birth strip, the ID card (copy +
 * QR), owner name / phone pills, the four clinic actions, stats, and the
 * medical sections (records · vaccinations · reminders · lab · files · notes)
 * as inline tabs.
 *
 * Medical records are this clinic's own (clinic-private). Vaccinations and
 * reminders are shared across clinics: another clinic's entry shows without
 * its clinic / doctor and can't be edited or deleted here (the backend 403s
 * it anyway). Action visibility comes from the backend-computed clinic
 * permissions (falling back to the `myRole` heuristic until they load).
 */
export default function OrganizationAnimalDetailScreen() {
  const theme = useTheme();
  const nav = useRouter();
  const { t } = useTranslation('orgAnimals');
  const { isAdmin } = useCapabilities();
  const { organizationId, animalId: animalIdParam } = useLocalSearchParams<{
    organizationId: string;
    animalId: string;
  }>();
  const orgId = organizationId ?? '';
  const animalId = animalIdParam ?? '';

  const detail = useOrganization(orgId);
  const caps = orgCapabilities(detail.data?.myRole, isAdmin);
  const perms = useClinicPermissions(orgId);
  const can = {
    viewRecords: perms ? perms.canViewMedicalRecords : caps.canViewOrganizationMedical,
    viewVaccinations: perms ? perms.canViewVaccinations : caps.canViewOrganizationMedical,
    createRecord: perms ? perms.canCreateMedicalRecords : caps.canManageOrganizationMedical,
    createVaccination: perms ? perms.canCreateVaccinations : caps.canManageOrganizationMedical,
    manageAppointments: perms?.canManageAppointments ?? false,
    // owner / supervisor only (`animal.veterinary.access.manage`) — re-checked server-side
    removePet: perms ? perms.canManageAnimalAccess : caps.canManageOrganizationAnimalAccess,
  };

  const q = useClinicAnimalProfile(orgId, animalId);
  const animal = q.data;
  const chat = useClinicOwnerChat(orgId, animal?.owner?.id);
  const toast = useToast();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const removePet = useRemoveClinicPet(orgId);

  const tabs = useMemo(() => {
    const all: { key: TabKey; label: string; icon: IoniconName; visible: boolean }[] = [
      {
        key: 'records',
        label: t('detail.tabRecords'),
        icon: 'document-text-outline',
        visible: can.viewRecords,
      },
      {
        key: 'vaccinations',
        label: t('detail.vaccinations'),
        icon: 'shield-checkmark-outline',
        visible: can.viewVaccinations,
      },
      {
        key: 'reminders',
        label: t('detail.reminders'),
        icon: 'notifications-outline',
        visible: can.viewRecords,
      },
      { key: 'lab', label: t('detail.lab'), icon: 'flask-outline', visible: can.viewRecords },
      { key: 'files', label: t('detail.files'), icon: 'folder-outline', visible: can.viewRecords },
      {
        key: 'notes',
        label: t('detail.notes'),
        icon: 'create-outline',
        visible: can.viewRecords,
      },
    ];
    return all.filter((it) => it.visible);
  }, [t, can.viewRecords, can.viewVaccinations]);
  const [tab, setTab] = useState<TabKey>('records');
  // Permissions load after the first render — fall back to the first visible tab.
  useEffect(() => {
    const first = tabs[0];
    if (first && !tabs.some((it) => it.key === tab)) setTab(first.key);
  }, [tabs, tab]);

  const goBack = () =>
    nav.canGoBack() ? nav.back() : nav.replace(Routes.organizationAnimals(orgId));

  const onRemove = () =>
    removePet.mutate(
      { animalId },
      {
        onSuccess: () => {
          setConfirmRemove(false);
          toast.show({ message: t('remove.success'), tone: 'success' });
          router.replace(Routes.organizationAnimals(orgId));
        },
        onError: (e) => {
          setConfirmRemove(false);
          toast.show({ message: apiErrorMessage(e), tone: 'danger' });
        },
      },
    );

  const status = q.error instanceof ApiError ? q.error.status : undefined;

  if (status === 403 || status === 404) {
    const forbidden = status === 403;
    return (
      <ScrollScreen>
        <AppHeader title={t('detail.title')} showBack />
        <EmptyState
          icon={forbidden ? 'lock-closed-outline' : 'help-circle-outline'}
          title={forbidden ? t('detail.notAvailableTitle') : t('detail.notFoundTitle')}
          message={forbidden ? t('detail.notAvailableBody') : t('detail.notFoundBody')}
          actionLabel={t('detail.backToList')}
          onAction={() => router.replace(Routes.organizationAnimals(orgId))}
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

  if (q.isLoading || !animal) {
    return (
      <ScrollScreen padded={false}>
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Row gap="lg">
            <PetImage uri={null} species="OTHER" size={96} rounded="pill" />
            <View style={{ flex: 1 }}>
              <SkeletonText lines={2} />
            </View>
            <BackButton label={t('detail.back')} onPress={goBack} />
          </Row>
          <View style={{ marginTop: theme.spacing.xl }}>
            <SkeletonText lines={5} />
          </View>
        </View>
      </ScrollScreen>
    );
  }

  const isActiveAnimal = animal.status === 'ACTIVE';
  const clinicName = detail.data?.name ?? '';
  const createRecord = (type?: 'FULL_EXAM' | 'LAB' | 'FILE') => {
    const path = Routes.orgAnimalMedicalRecordCreate(orgId, animal.id);
    if (type) router.push({ pathname: path as never, params: { type } });
    else router.push(path);
  };
  const ownerName = animal.owner
    ? `${animal.owner.firstName} ${animal.owner.lastName}`.trim()
    : t('detail.ownerUnknown');
  const statLast = TONE.stat;

  return (
    <ScrollScreen padded={false}>
      <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
        {/* --- Header: photo + name / breed (start), back (end) --- */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 16, flex: 1 }}>
            <Pressable
              disabled={animal.galleryUrls.length === 0}
              onPress={() => setViewerOpen(true)}
              accessibilityRole={animal.galleryUrls.length > 0 ? 'imagebutton' : undefined}
              accessibilityLabel={t('detail.openPhoto')}
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                overflow: 'hidden',
                borderWidth: 2,
                borderColor: theme.colors.surface,
                backgroundColor: theme.colors.surface,
                ...theme.shadows.card,
              }}
            >
              <PetImage
                uri={animal.galleryUrls[0] ?? null}
                species={animal.species}
                size={92}
                rounded="pill"
              />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 32, lineHeight: 42, fontWeight: '900' }}
                numberOfLines={1}
                accessibilityRole="header"
              >
                {animal.name}
              </Text>
              <Text
                style={{ fontSize: 17, fontWeight: '500', color: theme.colors.textMuted }}
                numberOfLines={1}
              >
                {[t(`species.${animal.species}`, { defaultValue: animal.species }), animal.breed]
                  .filter(Boolean)
                  .join(' - ')}
              </Text>
              {!isActiveAnimal ? (
                <Caption style={{ marginTop: 2 }}>
                  {t(`animalStatus.${animal.status}`, { defaultValue: animal.status })}
                </Caption>
              ) : null}
            </View>
          </View>
          <BackButton label={t('detail.back')} onPress={goBack} />
        </View>

        {/* --- Info strip: العمر · الجنس · الوزن · اللون · الميلاد --- */}
        <InfoStrip animal={animal} />

        {/* --- ID card: copy + ID (start), QR (end) --- */}
        <IdCard publicCode={animal.publicCode} />
      </View>

      {/* --- Main clinical card --- */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 24,
            padding: 20,
            borderWidth: 1,
            borderColor: theme.scheme === 'dark' ? theme.colors.border : C.cardBorder,
            rowGap: 16,
            ...theme.shadows.xs,
          }}
        >
          {/* Owner name + phone pills */}
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}>
            <Pill icon="person-outline" label={ownerName} style={{ flex: 1 }} />
            {animal.owner?.phone ? (
              <Pill
                icon="call-outline"
                label={animal.owner.phone}
                ltr
                accessibilityLabel={t('detail.copyPhone')}
                onPress={() => {
                  const phone = animal.owner?.phone ?? '';
                  void copyText(phone).then((ok) =>
                    ok
                      ? toast.show({ tone: 'success', message: t('detail.phoneCopied') })
                      : void shareText(phone),
                  );
                }}
              />
            ) : null}
          </View>

          {/* 2×2 clinic actions */}
          {(isActiveAnimal && can.createRecord) || animal.owner ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              {isActiveAnimal && can.createRecord ? (
                <>
                  <ActionTile
                    tone={TONE.blue}
                    icon="flash"
                    label={t('detail.quickReview')}
                    onPress={() =>
                      router.push({
                        pathname: Routes.clinicQuickReview(orgId) as never,
                        params: { animalId: animal.id },
                      })
                    }
                  />
                  <ActionTile
                    tone={TONE.green}
                    icon="clipboard-outline"
                    label={t('detail.fullExam')}
                    onPress={() => createRecord('FULL_EXAM')}
                  />
                </>
              ) : null}
              {animal.owner ? (
                <>
                  <ActionTile
                    tone={TONE.orange}
                    icon="chatbubble-ellipses-outline"
                    label={t('detail.chatOwner')}
                    disabled={chat.busy}
                    onPress={chat.openChat}
                  />
                  <ActionTile
                    tone={TONE.purple}
                    icon={chat.paused ? 'play-circle-outline' : 'pause-circle-outline'}
                    label={chat.paused ? t('detail.resumeChat') : t('detail.pauseChat')}
                    disabled={chat.busy}
                    onPress={chat.togglePaused}
                  />
                </>
              ) : null}
            </View>
          ) : null}

          {/* Stats */}
          <View style={{ flexDirection: 'row', columnGap: 8 }}>
            <StatTile
              tone={TONE.green}
              value={String(animal.stats.vaccinationsCount)}
              label={t('detail.statVaccinations')}
            />
            <StatTile
              tone={TONE.blue}
              value={String(animal.stats.medicalRecordsCount)}
              label={t('detail.statVisits')}
            />
            <StatTile
              tone={statLast}
              small
              value={displayDateOnly(animal.stats.lastVisitDate)}
              label={t('detail.statLastVisit')}
            />
          </View>

          {/* Medical sections */}
          {tabs.length > 0 ? (
            <>
              <TabsBar tabs={tabs} active={tab} onChange={setTab} label={t('detail.tabsLabel')} />
              <TabPanel
                tab={tab}
                organizationId={orgId}
                animalId={animal.id}
                clinicName={clinicName}
                canWriteRecords={isActiveAnimal && can.createRecord}
                canWriteVaccinations={isActiveAnimal && can.createVaccination}
                createRecord={createRecord}
              />
            </>
          ) : null}
        </View>

        {/* --- Clinic extras (not in the reference design, kept functional) --- */}
        {(isActiveAnimal && can.manageAppointments) || (can.removePet && animal.relationship) ? (
          <View style={{ marginTop: 16, rowGap: 8 }}>
            {isActiveAnimal && can.manageAppointments ? (
              <Button
                label={t('detail.bookAppointment')}
                variant="outline"
                leftIcon="calendar-outline"
                fullWidth
                onPress={() =>
                  router.push({
                    pathname: Routes.clinicDashboardAppointmentNew(orgId) as never,
                    params: { animalId: animal.id },
                  })
                }
              />
            ) : null}
            {can.removePet && animal.relationship ? (
              <Button
                label={t('remove.cta')}
                variant="ghost"
                leftIcon="remove-circle-outline"
                fullWidth
                onPress={() => setConfirmRemove(true)}
              />
            ) : null}
          </View>
        ) : null}
      </View>

      <ImageViewer
        visible={viewerOpen}
        images={animal.galleryUrls}
        onClose={() => setViewerOpen(false)}
      />
      <ConfirmationDialog
        visible={confirmRemove}
        title={t('remove.title', { name: animal.name })}
        message={t('remove.body')}
        confirmLabel={t('remove.confirm')}
        cancelLabel={t('remove.cancel')}
        destructive
        loading={removePet.isPending}
        onConfirm={onRemove}
        onCancel={() => setConfirmRemove(false)}
      />
    </ScrollScreen>
  );
}

// --- header pieces -----------------------------------------------------

function BackButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: C.brand,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {/* The design's arrow points left (toward the button's edge) in both directions. */}
      <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
    </Pressable>
  );
}

function InfoStrip({ animal }: { animal: ClinicAnimalProfile }) {
  const theme = useTheme();
  const { t } = useTranslation('orgAnimals');
  const { t: tPets } = useTranslation('pets');
  const none = '—';
  const age = petAge(animal.dateOfBirth);
  // Same age wording as the owner's Pet Details screen.
  const ageLabel = age
    ? age.years > 0
      ? age.months > 0
        ? tPets('detail.ageYearsMonths', { years: age.years, months: age.months })
        : tPets('detail.ageYears', { count: age.years })
      : age.months > 0
        ? tPets('detail.ageMonths', { count: age.months })
        : tPets('detail.ageNewborn')
    : animal.ageEstimate
      ? t(`detail.ageEstimate.${animal.ageEstimate}`)
      : none;
  const items = [
    { label: t('detail.fieldAge'), value: ageLabel },
    { label: t('detail.fieldSex'), value: t(`detail.sex.${animal.sex}`) },
    {
      label: t('detail.fieldWeight'),
      value: animal.weightKg !== null ? t('detail.weightValue', { value: animal.weightKg }) : none,
    },
    { label: t('detail.fieldColor'), value: animal.color ?? none },
    { label: t('detail.fieldBirth'), value: animal.dateOfBirth?.slice(0, 4) ?? none },
  ];
  const c = tone(theme, TONE.mint);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'stretch',
        backgroundColor: c.bg,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 4,
        marginBottom: 20,
      }}
    >
      {items.map((it, i) => (
        <View
          key={it.label}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
            // RTL: the divider sits on each item's left (end) edge except the last.
            borderEndWidth: i < items.length - 1 ? 1 : 0,
            borderColor: theme.scheme === 'dark' ? c.border : C.infoDivider,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '500', color: theme.colors.textSecondary }}>
            {it.label}
          </Text>
          <Text
            style={{ fontSize: 14, fontWeight: '800', textAlign: 'center' }}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {it.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

function IdCard({ publicCode }: { publicCode: string }) {
  const theme = useTheme();
  const { t } = useTranslation('orgAnimals');
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    if (await copyText(publicCode)) {
      toast.show({ tone: 'success', message: t('detail.idCopied') });
      setCopied(true);
    } else {
      // A build without the native clipboard module — hand the ID to the share sheet.
      void shareText(publicCode);
    }
  };

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        columnGap: 12,
        marginBottom: 8,
        ...theme.shadows.xs,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 12, flex: 1 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('detail.copyId')}
          hitSlop={8}
          onPress={() => void copy()}
          style={({ pressed }) => ({ padding: 8, opacity: pressed ? 0.75 : 1 })}
        >
          <Ionicons
            name={copied ? 'checkmark' : 'copy-outline'}
            size={24}
            color={copied ? TONE.green.fg : C.brand}
          />
        </Pressable>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', columnGap: 6 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.textSecondary }}>
              ID:
            </Text>
            <Text
              style={{ fontSize: 16, fontWeight: '800' }}
              selectable
              accessibilityLabel={publicCode.split('').join(' ')}
            >
              {formatPetCode(publicCode)}
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary, marginTop: 2 }}>
            {publicCode}
          </Text>
        </View>
      </View>
      <View style={{ padding: 2, backgroundColor: '#FFFFFF', borderRadius: 4 }}>
        <QrCode value={publicCode} size={64} accessibilityLabel={t('detail.idSection')} />
      </View>
    </View>
  );
}

// --- main-card pieces --------------------------------------------------

function Pill({
  icon,
  label,
  ltr,
  onPress,
  accessibilityLabel,
  style,
}: {
  icon: IoniconName;
  label: string;
  ltr?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: { flex?: number };
}) {
  const theme = useTheme();
  const c = tone(theme, TONE.neutral);
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          columnGap: 6,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 16,
          backgroundColor: c.bg,
          borderWidth: 1,
          borderColor: c.border,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={16} color={TONE.green.fg} />
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          writingDirection: ltr ? 'ltr' : undefined,
          letterSpacing: ltr ? 0.5 : 0,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ActionTile({
  tone: base,
  icon,
  label,
  onPress,
  disabled,
}: {
  tone: Tone;
  icon: IoniconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const c = tone(theme, base);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flexBasis: '47%',
        flexGrow: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: 8,
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: c.bg,
        borderWidth: 1,
        borderColor: c.border,
        opacity: disabled ? 0.6 : pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <Ionicons name={icon} size={20} color={c.fg} />
      <Text style={{ fontSize: 14, fontWeight: '800', color: c.fg }} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function StatTile({
  tone: base,
  value,
  label,
  small,
}: {
  tone: Tone;
  value: string;
  label: string;
  small?: boolean;
}) {
  const theme = useTheme();
  const c = tone(theme, base);
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 16,
        backgroundColor: c.bg,
        borderWidth: 1,
        borderColor: c.border,
      }}
    >
      <Text
        style={{ fontSize: small ? 15 : 24, fontWeight: '900', color: c.fg, marginBottom: 2 }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={{ fontSize: 12, fontWeight: '600', color: c.label }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function TabsBar({
  tabs,
  active,
  onChange,
  label,
}: {
  tabs: { key: TabKey; label: string; icon: IoniconName }[];
  active: TabKey;
  onChange: (key: TabKey) => void;
  label: string;
}) {
  const theme = useTheme();
  const dark = theme.scheme === 'dark';
  return (
    <View
      style={{
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: dark ? theme.colors.border : C.cardBorder,
        backgroundColor: theme.colors.surface,
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="tablist"
        accessibilityLabel={label}
        style={{
          borderRadius: 16,
          borderWidth: 1,
          borderColor: dark ? theme.colors.border : C.tabsBorder,
          backgroundColor: dark ? theme.colors.surfaceMuted : C.tabsBg,
        }}
        contentContainerStyle={{ padding: 6, columnGap: 6 }}
      >
        {tabs.map((it) => {
          const selected = it.key === active;
          return (
            <Pressable
              key={it.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={it.label}
              onPress={() => onChange(it.key)}
              style={{
                minWidth: 64,
                paddingVertical: 6,
                paddingHorizontal: 8,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? (dark ? `${C.brand}26` : C.brandSoft) : 'transparent',
              }}
            >
              <Ionicons name={it.icon} size={20} color={selected ? C.brand : C.tabIdle} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: selected ? '700' : '600',
                  color: selected ? C.brand : C.tabIdle,
                  marginTop: 2,
                }}
                numberOfLines={1}
              >
                {it.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// --- tab panels ----------------------------------------------------------

function TabPanel({
  tab,
  organizationId,
  animalId,
  clinicName,
  canWriteRecords,
  canWriteVaccinations,
  createRecord,
}: {
  tab: TabKey;
  organizationId: string;
  animalId: string;
  clinicName: string;
  canWriteRecords: boolean;
  canWriteVaccinations: boolean;
  createRecord: (type?: 'FULL_EXAM' | 'LAB' | 'FILE') => void;
}) {
  const scope = { animalId, organizationId };
  const isRecordView = tab === 'records' || tab === 'lab' || tab === 'files' || tab === 'notes';
  const records = useMedicalRecords(scope, { enabled: isRecordView });
  const vaccinations = useVaccinations(scope, { enabled: tab === 'vaccinations' });
  const reminders = useAnimalReminders(scope, { enabled: tab === 'reminders' });

  if (tab === 'vaccinations') {
    return (
      <VaccinationsPanel
        q={vaccinations}
        organizationId={organizationId}
        animalId={animalId}
        clinicName={clinicName}
        canWrite={canWriteVaccinations}
      />
    );
  }
  if (tab === 'reminders') {
    return (
      <RemindersPanel
        q={reminders}
        organizationId={organizationId}
        animalId={animalId}
        clinicName={clinicName}
        canWrite={canWriteRecords}
      />
    );
  }
  return (
    <RecordsPanel
      view={tab}
      q={records}
      organizationId={organizationId}
      animalId={animalId}
      clinicName={clinicName}
      canWrite={canWriteRecords}
      createRecord={createRecord}
    />
  );
}

function AddButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  const dark = theme.scheme === 'dark';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        columnGap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: dark ? `${C.brand}1f` : C.brandSoft,
        borderWidth: 1,
        borderColor: dark ? `${C.brand}55` : C.brandSoftBorder,
        opacity: pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <Ionicons name="add-circle-outline" size={20} color={C.brand} />
      <Text style={{ fontSize: 14, fontWeight: '800', color: C.brand }}>{label}</Text>
    </Pressable>
  );
}

/** One field row; `highlight` renders it as a tinted box (العلاج · النتيجة · التاريخ القادم …). */
interface Field {
  label: string;
  value: ReactNode;
  highlight?: Tone;
  icon?: IoniconName;
  ltr?: boolean;
}

function ItemCard({
  accent,
  badge,
  title,
  fields,
  note,
  onPress,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: {
  accent: string;
  badge?: { label: string; tone: Tone; icon: IoniconName };
  title?: string;
  fields: Field[];
  note?: { label: string; text: string };
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel: string;
  deleteLabel: string;
}) {
  const theme = useTheme();
  const dark = theme.scheme === 'dark';
  const badgeTone = badge ? tone(theme, badge.tone) : null;
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? title : undefined}
      style={({ pressed }) => ({
        backgroundColor: theme.colors.surface,
        borderRadius: 24,
        padding: 20,
        paddingStart: 24,
        borderWidth: 1,
        borderColor: dark ? theme.colors.border : C.itemBorder,
        overflow: 'hidden',
        opacity: pressed ? 0.9 : 1,
        ...theme.shadows.xs,
      })}
    >
      {/* side stripe on the start (right in RTL) edge */}
      <View
        style={{
          position: 'absolute',
          top: 8,
          bottom: 8,
          start: 0,
          width: 6,
          backgroundColor: accent,
          borderTopEndRadius: 999,
          borderBottomEndRadius: 999,
        }}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          columnGap: 8,
          marginBottom: badge && title ? 12 : 14,
        }}
      >
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          {badge && badgeTone ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                columnGap: 6,
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: badgeTone.bg,
                borderWidth: 1,
                borderColor: badgeTone.border,
              }}
            >
              <Ionicons name={badge.icon} size={14} color={badgeTone.fg} />
              <Text style={{ fontSize: 12, fontWeight: '900', color: badgeTone.fg }}>
                {badge.label}
              </Text>
            </View>
          ) : title ? (
            <Text style={{ fontSize: 17, fontWeight: '800', lineHeight: 24 }}>{title}</Text>
          ) : null}
        </View>
        {onEdit || onDelete ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
            {onEdit ? (
              <IconAction
                icon="create-outline"
                color={C.brand}
                label={editLabel}
                onPress={onEdit}
              />
            ) : null}
            {onDelete ? (
              <IconAction
                icon="trash-outline"
                color={C.red}
                label={deleteLabel}
                onPress={onDelete}
              />
            ) : null}
          </View>
        ) : null}
      </View>
      {badge && title ? (
        <Text style={{ fontSize: 17, fontWeight: '800', lineHeight: 24, marginBottom: 14 }}>
          {title}
        </Text>
      ) : null}
      <View style={{ rowGap: 10 }}>
        {note ? (
          <View
            style={{
              backgroundColor: dark ? theme.colors.surfaceMuted : TONE.neutral.bg,
              borderWidth: 1,
              borderColor: dark ? theme.colors.border : TONE.neutral.border,
              borderRadius: 16,
              padding: 12,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: C.muted, marginBottom: 6 }}>
              {note.label}
            </Text>
            <Text style={{ fontSize: 12, lineHeight: 20 }}>{note.text}</Text>
          </View>
        ) : null}
        {fields.map((f) => (
          <FieldRow key={f.label} field={f} />
        ))}
      </View>
    </Pressable>
  );
}

function FieldRow({ field }: { field: Field }) {
  const theme = useTheme();
  const h = field.highlight ? tone(theme, field.highlight) : null;
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          columnGap: 12,
        },
        h && {
          backgroundColor: h.bg,
          borderWidth: 1,
          borderColor: h.border,
          borderRadius: 12,
          paddingHorizontal: 10,
          paddingVertical: 6,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4, minWidth: 70 }}>
        {field.icon && h ? <Ionicons name={field.icon} size={14} color={h.fg} /> : null}
        <Text style={{ fontSize: 12, fontWeight: h ? '700' : '600', color: h ? h.label : C.muted }}>
          {field.label}
        </Text>
      </View>
      {typeof field.value === 'string' ? (
        <Text
          style={{
            flexShrink: 1,
            fontSize: 14,
            fontWeight: h ? '800' : '700',
            color: h ? h.fg : theme.scheme === 'dark' ? theme.colors.textPrimary : C.value,
            textAlign: 'left',
            writingDirection: field.ltr ? 'ltr' : undefined,
          }}
          numberOfLines={3}
        >
          {field.value}
        </Text>
      ) : (
        field.value
      )}
    </View>
  );
}

function IconAction({
  icon,
  color,
  label,
  onPress,
}: {
  icon: IoniconName;
  color: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => ({ padding: 4, borderRadius: 8, opacity: pressed ? 0.7 : 1 })}
    >
      <Ionicons name={icon} size={20} color={color} />
    </Pressable>
  );
}

function Doctor({ userId }: { userId: string | null }) {
  const theme = useTheme();
  if (!userId) {
    return <Text style={{ fontSize: 14, fontWeight: '700' }}>—</Text>;
  }
  return (
    <UserName
      userId={userId}
      fallback="—"
      numberOfLines={1}
      style={{
        flexShrink: 1,
        fontSize: 14,
        fontWeight: '700',
        color: theme.scheme === 'dark' ? theme.colors.textPrimary : C.value,
      }}
    />
  );
}

function PanelBody({
  loading,
  error,
  onRetry,
  empty,
  emptyLabel,
  emptyIcon,
  children,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  empty: boolean;
  emptyLabel: string;
  emptyIcon: IoniconName;
  children: ReactNode;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}) {
  const { t } = useTranslation('orgAnimals');
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (empty) return <EmptyState icon={emptyIcon} title={emptyLabel} />;
  return (
    <>
      {children}
      {hasMore ? (
        <Button
          label={t('detail.loadMore')}
          variant="ghost"
          size="sm"
          loading={loadingMore}
          onPress={onLoadMore}
        />
      ) : null}
    </>
  );
}

function useConfirmDelete() {
  const [target, setTarget] = useState<string | null>(null);
  return { target, ask: setTarget, close: () => setTarget(null) };
}

function RecordsPanel({
  view,
  q,
  organizationId,
  animalId,
  clinicName,
  canWrite,
  createRecord,
}: {
  view: 'records' | 'lab' | 'files' | 'notes';
  q: ReturnType<typeof useMedicalRecords>;
  organizationId: string;
  animalId: string;
  clinicName: string;
  canWrite: boolean;
  createRecord: (type?: 'FULL_EXAM' | 'LAB' | 'FILE') => void;
}) {
  const { t } = useTranslation('orgAnimals');
  const { t: tm } = useTranslation('medical');
  const toast = useToast();
  const del = useDeleteMedicalRecord(organizationId, animalId);
  const confirm = useConfirmDelete();

  // The legacy التحاليل / الملفات / الملاحظات tabs are views over the same records.
  const items = useMemo(() => {
    if (view === 'lab') return q.records.filter((r) => r.labNotes);
    if (view === 'files')
      return q.records.filter((r) => r.prescriptionKey || r.attachmentKeys.length > 0);
    if (view === 'notes') return q.records.filter((r) => r.notes);
    return q.records;
  }, [q.records, view]);

  const add = {
    records: { label: t('detail.addRecordCta'), onPress: () => createRecord() },
    lab: { label: t('detail.addLabCta'), onPress: () => createRecord('LAB') },
    files: { label: t('detail.addFileCta'), onPress: () => createRecord('FILE') },
    notes: { label: t('detail.addNoteCta'), onPress: () => createRecord() },
  }[view];
  const empty = {
    records: tm('records.empty'),
    lab: tm('records.labEmpty'),
    files: tm('records.filesEmpty'),
    notes: tm('records.notesEmpty'),
  }[view];

  const card = (r: MedicalRecord) => {
    const typeTone = TONE[RECORD_TONE[r.recordType]];
    const typeLabel = tm(`records.recordType.${r.recordType}`);
    const date = displayDateOnly(r.visitDate);
    const doctor = { label: t('detail.rowDoctor'), value: <Doctor userId={r.recordedByUserId} /> };
    const clinic = { label: t('detail.rowClinic'), value: clinicName || '—' };
    let title: string | undefined;
    let fields: Field[];
    let note: { label: string; text: string } | undefined;
    let badge: { label: string; tone: Tone; icon: IoniconName } | undefined;

    if (view === 'lab') {
      title = r.diagnosis || r.reason || typeLabel;
      fields = [
        { label: t('detail.rowTestType'), value: typeLabel },
        { label: t('detail.rowTestDate'), value: date, ltr: true },
        {
          label: t('detail.rowResult'),
          value: r.labNotes ?? '',
          highlight: TONE.mint,
          icon: 'checkmark-circle',
        },
        doctor,
        clinic,
      ];
    } else if (view === 'files') {
      const count = r.attachmentKeys.length + (r.prescriptionKey ? 1 : 0);
      title = r.diagnosis || r.reason || typeLabel;
      fields = [
        {
          label: t('detail.rowFileType'),
          value:
            r.prescriptionKey && r.attachmentKeys.length === 0
              ? tm('records.fieldPrescription')
              : typeLabel,
        },
        { label: t('detail.rowAddedOn'), value: date, ltr: true },
        {
          label: t('detail.rowFiles'),
          value: t('detail.filesCount', { count }),
          highlight: TONE.blue,
          icon: 'document-attach',
        },
        clinic,
      ];
    } else if (view === 'notes') {
      title = r.diagnosis || r.reason || typeLabel;
      note = { label: t('detail.rowNoteText'), text: r.notes ?? '' };
      fields = [{ label: t('detail.rowDate'), value: date, ltr: true }, doctor, clinic];
    } else {
      badge = { label: typeLabel, tone: typeTone, icon: RECORD_ICON[r.recordType] };
      title = r.diagnosis || r.reason || r.symptoms || tm('records.noSummary');
      fields = [
        { label: t('detail.rowDate'), value: date, ltr: true },
        clinic,
        doctor,
        ...(r.treatment
          ? [
              {
                label: t('detail.rowTreatment'),
                value: r.treatment,
                highlight: TONE.neutral,
              } satisfies Field,
            ]
          : []),
      ];
    }

    return (
      <ItemCard
        key={r.id}
        accent={view === 'records' ? typeTone.fg : C.brand}
        badge={badge}
        title={title}
        fields={fields}
        note={note}
        onPress={() => router.push(Routes.orgAnimalMedicalRecord(organizationId, animalId, r.id))}
        onEdit={
          canWrite
            ? () => router.push(Routes.orgAnimalMedicalRecordEdit(organizationId, animalId, r.id))
            : undefined
        }
        onDelete={canWrite ? () => confirm.ask(r.id) : undefined}
        editLabel={tm('records.editCta')}
        deleteLabel={tm('records.deleteCta')}
      />
    );
  };

  return (
    <View style={{ rowGap: 12 }}>
      {canWrite ? <AddButton label={add.label} onPress={add.onPress} /> : null}
      <PanelBody
        loading={q.isLoading}
        error={q.isError ? q.error : null}
        onRetry={() => void q.refetch()}
        empty={items.length === 0 && !q.hasNextPage}
        emptyLabel={empty}
        emptyIcon="medkit-outline"
        hasMore={q.hasNextPage}
        loadingMore={q.isFetchingNextPage}
        onLoadMore={() => void q.fetchNextPage()}
      >
        {items.map(card)}
      </PanelBody>
      <ConfirmationDialog
        visible={confirm.target !== null}
        title={tm('records.deleteConfirmTitle')}
        message={tm('records.deleteConfirmBody')}
        confirmLabel={tm('records.deleteCta')}
        cancelLabel={tm('common.cancel')}
        destructive
        loading={del.isPending}
        onConfirm={() => {
          const recordId = confirm.target;
          confirm.close();
          if (!recordId) return;
          del.mutate(
            { recordId },
            {
              onSuccess: () =>
                toast.show({ tone: 'success', message: tm('records.deleteSuccess') }),
              onError: (e) => toast.show({ tone: 'danger', message: medicalErrorMessage(e, tm) }),
            },
          );
        }}
        onCancel={confirm.close}
      />
    </View>
  );
}

function VaccinationsPanel({
  q,
  organizationId,
  animalId,
  clinicName,
  canWrite,
}: {
  q: ReturnType<typeof useVaccinations>;
  organizationId: string;
  animalId: string;
  clinicName: string;
  canWrite: boolean;
}) {
  const { t } = useTranslation('orgAnimals');
  const { t: tm } = useTranslation('medical');
  const toast = useToast();
  const del = useDeleteVaccination(organizationId, animalId);
  const confirm = useConfirmDelete();
  const today = todayIso();

  const card = (v: Vaccination) => {
    // Shared across clinics: another clinic's dose is read-only and anonymised.
    const mine = recordedByThisClinic(v, organizationId);
    const overdue = v.status === 'SCHEDULED' && Boolean(v.nextDueOn) && v.nextDueOn! < today;
    const fields: Field[] = [
      { label: t('detail.rowVaccineName'), value: v.vaccineName },
      { label: t('detail.rowVaccinatedOn'), value: displayDateOnly(v.administeredOn), ltr: true },
      ...(v.nextDueOn
        ? [
            {
              label: t('detail.rowNextDue'),
              value: displayDateOnly(v.nextDueOn),
              highlight: overdue ? TONE.orange : TONE.amber,
              icon: 'time',
              ltr: true,
            } satisfies Field,
          ]
        : []),
      { label: t('detail.rowStatus'), value: tm(`vaccinations.status.${v.status}`) },
      { label: t('detail.rowDoctorName'), value: <Doctor userId={v.recordedByUserId} /> },
      {
        label: t('detail.rowClinic'),
        value: mine ? clinicName || '—' : tm('vaccinations.recordedElsewhere'),
      },
    ];
    return (
      <ItemCard
        key={v.id}
        accent={mine ? C.brand : C.muted}
        title={v.vaccineName}
        fields={fields}
        onPress={() => router.push(Routes.orgAnimalVaccination(organizationId, animalId, v.id))}
        onEdit={
          canWrite && mine
            ? () => router.push(Routes.orgAnimalVaccinationEdit(organizationId, animalId, v.id))
            : undefined
        }
        onDelete={canWrite && mine ? () => confirm.ask(v.id) : undefined}
        editLabel={tm('vaccinations.editCta')}
        deleteLabel={tm('vaccinations.deleteCta')}
      />
    );
  };

  return (
    <View style={{ rowGap: 12 }}>
      {canWrite ? (
        <AddButton
          label={t('detail.addVaccinationCta')}
          onPress={() => router.push(Routes.orgAnimalVaccinationCreate(organizationId, animalId))}
        />
      ) : null}
      <PanelBody
        loading={q.isLoading}
        error={q.isError ? q.error : null}
        onRetry={() => void q.refetch()}
        empty={q.vaccinations.length === 0}
        emptyLabel={tm('vaccinations.empty')}
        emptyIcon="shield-checkmark-outline"
        hasMore={q.hasNextPage}
        loadingMore={q.isFetchingNextPage}
        onLoadMore={() => void q.fetchNextPage()}
      >
        {q.vaccinations.map(card)}
      </PanelBody>
      <ConfirmationDialog
        visible={confirm.target !== null}
        title={tm('vaccinations.deleteConfirmTitle')}
        message={tm('vaccinations.deleteConfirmBody')}
        confirmLabel={tm('vaccinations.deleteCta')}
        cancelLabel={tm('common.cancel')}
        destructive
        loading={del.isPending}
        onConfirm={() => {
          const vaccinationId = confirm.target;
          confirm.close();
          if (!vaccinationId) return;
          del.mutate(
            { vaccinationId },
            {
              onSuccess: () =>
                toast.show({ tone: 'success', message: tm('vaccinations.deleteSuccess') }),
              onError: (e) => toast.show({ tone: 'danger', message: medicalErrorMessage(e, tm) }),
            },
          );
        }}
        onCancel={confirm.close}
      />
    </View>
  );
}

function RemindersPanel({
  q,
  organizationId,
  animalId,
  clinicName,
  canWrite,
}: {
  q: ReturnType<typeof useAnimalReminders>;
  organizationId: string;
  animalId: string;
  clinicName: string;
  canWrite: boolean;
}) {
  const { t } = useTranslation('orgAnimals');
  const { t: tm } = useTranslation('medical');
  const toast = useToast();
  const del = useDeleteReminder(organizationId, animalId);
  const confirm = useConfirmDelete();
  const today = todayIso();
  const items = q.data?.items ?? [];

  const card = (r: AnimalReminder) => {
    const mine = recordedByThisClinic(r, organizationId);
    const overdue = !r.isCompleted && r.reminderDate < today;
    const fields: Field[] = [
      { label: t('detail.rowReminderType'), value: tm(`reminders.type.${r.reminderType}`) },
      {
        label: t('detail.rowReminderDate'),
        value: displayDateOnly(r.reminderDate),
        highlight: overdue ? TONE.orange : TONE.amber,
        icon: 'time',
        ltr: true,
      },
      {
        label: t('detail.rowStatus'),
        value: r.isCompleted
          ? tm('reminders.statusDone')
          : overdue
            ? tm('reminders.overdue')
            : tm('reminders.statusPending'),
      },
      { label: t('detail.rowDoctorInCharge'), value: <Doctor userId={r.recordedByUserId} /> },
      {
        label: t('detail.rowClinic'),
        value: mine ? clinicName || '—' : tm('records.recordedElsewhere'),
      },
    ];
    return (
      <ItemCard
        key={r.id}
        accent={mine ? C.brand : C.muted}
        title={r.title}
        fields={fields}
        note={
          r.description ? { label: t('detail.rowDescription'), text: r.description } : undefined
        }
        // Complete / reschedule / notify live on the full reminders list.
        onPress={() => router.push(Routes.orgAnimalReminders(organizationId, animalId))}
        onEdit={
          canWrite && mine
            ? () => router.push(Routes.orgAnimalReminderEdit(organizationId, animalId, r.id))
            : undefined
        }
        onDelete={canWrite && mine ? () => confirm.ask(r.id) : undefined}
        editLabel={tm('records.editCta')}
        deleteLabel={tm('reminders.deleteCta')}
      />
    );
  };

  return (
    <View style={{ rowGap: 12 }}>
      {canWrite ? (
        <AddButton
          label={t('detail.addReminderCta')}
          onPress={() => router.push(Routes.orgAnimalReminderCreate(organizationId, animalId))}
        />
      ) : null}
      <PanelBody
        loading={q.isLoading}
        error={q.isError ? q.error : null}
        onRetry={() => void q.refetch()}
        empty={items.length === 0}
        emptyLabel={tm('reminders.empty')}
        emptyIcon="notifications-outline"
      >
        {items.map(card)}
      </PanelBody>
      <ConfirmationDialog
        visible={confirm.target !== null}
        title={tm('reminders.deleteConfirmTitle')}
        message={tm('reminders.deleteConfirmBody')}
        confirmLabel={tm('reminders.deleteCta')}
        cancelLabel={tm('common.cancel')}
        destructive
        loading={del.isPending}
        onConfirm={() => {
          const reminderId = confirm.target;
          confirm.close();
          if (!reminderId) return;
          del.mutate(
            { reminderId },
            {
              onSuccess: () =>
                toast.show({ tone: 'success', message: tm('reminders.deleteSuccess') }),
              onError: (e) => toast.show({ tone: 'danger', message: medicalErrorMessage(e, tm) }),
            },
          );
        }}
        onCancel={confirm.close}
      />
    </View>
  );
}
