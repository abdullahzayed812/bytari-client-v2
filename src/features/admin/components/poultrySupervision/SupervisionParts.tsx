import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Avatar, Icon, type IconName } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/colors';
import { formatDate, fullName } from '@/utils';

import type {
  PoultrySupervisionFarm,
  PoultrySupervisionLinkedFarm,
  PoultrySupervisionVeterinarian,
  PoultrySupervisionVeterinarianRow,
} from '../../types';

/** Short, human-facing farm number ("رقم الحقل") — the first block of the farm id. */
export const farmNumber = (organizationId: string): string =>
  organizationId.slice(0, 8).toUpperCase();
/** Short veterinarian ID shown on cards (the full id is in the details view). */
export const vetNumber = (userId: string): string => `VET-${userId.slice(0, 6).toUpperCase()}`;
export const vetName = (v: PoultrySupervisionVeterinarian): string =>
  fullName(v.firstName, v.lastName) || v.email;
export const farmPlace = (f: PoultrySupervisionFarm): string =>
  [f.governorate, f.location].filter(Boolean).join(' - ');

/** White rounded card with the reference's thin slate border + soft shadow. */
export function SoftCard({ children, style }: { children: ReactNode; style?: object }) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          borderColor: theme.colors.border,
          padding: theme.spacing.lg,
          ...theme.shadows.xs,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** "حقول مرتبطة / غير مرتبطة / أطباء …" — 2×2 tappable counter cards. */
export function MetricCard({
  icon,
  iconColor,
  surface,
  value,
  label,
  onPress,
}: {
  icon: IconName;
  iconColor: keyof ColorTokens;
  surface: keyof ColorTokens;
  value: number | undefined;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flex: 1,
          alignItems: 'center',
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.xl,
          borderWidth: 1,
          borderColor: theme.colors.border,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.sm,
          rowGap: 4,
          ...theme.shadows.xs,
        },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors[surface],
        }}
      >
        <Icon name={icon} size="iconMd" color={iconColor} />
      </View>
      <Text variant="heading">{value ?? '—'}</Text>
      <Caption>{label}</Caption>
    </Pressable>
  );
}

/** The segmented tab bar: selected segment is filled brand green. */
export function SegmentTabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; icon: IconName }[];
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 5,
        columnGap: 4,
      }}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              columnGap: 6,
              paddingVertical: 9,
              paddingHorizontal: 6,
              borderRadius: theme.radius.lg,
              backgroundColor: selected ? theme.colors.primaryPressed : 'transparent',
            }}
          >
            <Icon name={o.icon} size="iconXs" color={selected ? 'onPrimary' : 'textMuted'} />
            <Text
              variant={selected ? 'bodyStrong' : 'bodyMedium'}
              color={selected ? 'textInverse' : 'textSecondary'}
              numberOfLines={1}
              style={{ fontSize: 13 }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Pill badge — "مرتبط ✓" (green) / "غير مرتبط" (rose). */
export function StatePill({ linked, label }: { linked: boolean; label: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 4,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 999,
        backgroundColor: linked ? theme.colors.successSoft : theme.colors.dangerSoft,
      }}
    >
      <Text variant="caption" color={linked ? 'success' : 'danger'} style={{ fontWeight: '700' }}>
        {label}
      </Text>
      {linked ? <Icon name="checkmark-circle" size="iconXs" color="success" /> : null}
    </View>
  );
}

/** Outlined green action ("إدارة الارتباط" / "+ ربط طبيب بالحقل" / "تحديث الارتباط"). */
export function OutlineAction({
  label,
  icon,
  onPress,
  tone = 'primary',
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  tone?: 'primary' | 'danger';
}) {
  const theme = useTheme();
  const color = tone === 'danger' ? theme.colors.danger : theme.colors.primaryPressed;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          columnGap: 6,
          paddingVertical: 8,
          paddingHorizontal: 14,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: color,
        },
        pressed && { backgroundColor: theme.colors.primarySoft },
      ]}
    >
      <Text variant="caption" style={{ color, fontWeight: '700' }}>
        {label}
      </Text>
      {icon ? (
        <Icon name={icon} size="iconXs" color={tone === 'danger' ? 'danger' : 'primary'} />
      ) : null}
    </Pressable>
  );
}

function FarmThumb({
  uri,
  onPress,
  label,
}: {
  uri: string | null;
  onPress: () => void;
  label: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        width: 56,
        height: 56,
        borderRadius: theme.radius.lg,
        overflow: 'hidden',
        backgroundColor: theme.colors.surfaceMuted,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {uri ? (
        <Image source={uri} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      ) : (
        <Icon name="home-outline" size="iconMd" color="textMuted" />
      )}
    </Pressable>
  );
}

/** A pressable name ("فتح ملف الحقل" / "فتح ملف الطبيب"). */
function NameLink({
  label,
  onPress,
  variant = 'bodyStrong',
  a11y,
}: {
  label: string;
  onPress: () => void;
  variant?: 'bodyStrong' | 'label';
  a11y: string;
}) {
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={a11y} onPress={onPress} hitSlop={6}>
      <Text variant={variant} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function FarmHeading({
  farm,
  onOpenFarm,
  extra,
}: {
  farm: PoultrySupervisionFarm;
  onOpenFarm: () => void;
  extra?: string;
}) {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
      <FarmThumb
        uri={farm.imageUrl}
        onPress={onOpenFarm}
        label={t('poultrySupervisors.openFarm')}
      />
      <View style={{ flex: 1, rowGap: 2 }}>
        <NameLink label={farm.name} onPress={onOpenFarm} a11y={farm.name} />
        <View
          style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 6 }}
        >
          {farmPlace(farm) ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 2 }}>
              <Icon name="location-outline" size="iconXs" color="textMuted" />
              <Caption>{farmPlace(farm)}</Caption>
            </View>
          ) : null}
          <Caption>|</Caption>
          <Caption>
            {t('poultrySupervisors.farmNumber')}: {farmNumber(farm.organizationId)}
          </Caption>
          {extra ? (
            <>
              <Caption>|</Caption>
              <Caption>{extra}</Caption>
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

/** "الحقول المرتبطة" card — farm + its supervising vet + date + "مرتبط" + "إدارة الارتباط". */
export function LinkedFarmCard({
  row,
  onOpenFarm,
  onOpenVet,
  onManage,
}: {
  row: PoultrySupervisionLinkedFarm;
  onOpenFarm: () => void;
  onOpenVet: (vet: PoultrySupervisionVeterinarian) => void;
  onManage: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const [primary, ...others] = row.links;
  return (
    <SoftCard style={{ rowGap: theme.spacing.md }}>
      <FarmHeading farm={row.farm} onOpenFarm={onOpenFarm} />
      <View style={{ height: 1, backgroundColor: theme.colors.border }} />
      {primary ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('poultrySupervisors.openVet')}
            onPress={() => onOpenVet(primary.veterinarian)}
          >
            <Avatar
              uri={primary.veterinarian.avatarUrl}
              name={vetName(primary.veterinarian)}
              size="avatarSm"
            />
          </Pressable>
          <View style={{ flex: 1, rowGap: 2 }}>
            <NameLink
              label={vetName(primary.veterinarian)}
              onPress={() => onOpenVet(primary.veterinarian)}
              variant="label"
              a11y={vetName(primary.veterinarian)}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
              <Icon name="calendar-outline" size="iconXs" color="textMuted" />
              <Caption>
                {t('poultrySupervisors.assignedOn', { date: formatDate(primary.assignedAt) })}
              </Caption>
            </View>
            {others.length > 0 ? (
              <Caption color="warning">
                {t('poultrySupervisors.moreVets', { count: others.length })}
              </Caption>
            ) : null}
          </View>
          <StatePill linked label={t('poultrySupervisors.linkedBadge')} />
        </View>
      ) : null}
      <OutlineAction
        label={t('poultrySupervisors.manageLink')}
        icon="settings-outline"
        onPress={onManage}
      />
    </SoftCard>
  );
}

/** "الحقول غير المرتبطة" card — farm + owner + "غير مرتبط" + "+ ربط طبيب بالحقل". */
export function UnlinkedFarmCard({
  farm,
  onOpenFarm,
  onLink,
}: {
  farm: PoultrySupervisionFarm;
  onOpenFarm: () => void;
  onLink: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  return (
    <SoftCard style={{ rowGap: theme.spacing.md }}>
      <FarmHeading
        farm={farm}
        onOpenFarm={onOpenFarm}
        extra={`${t('poultrySupervisors.owner')}: ${farm.ownerName}`}
      />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          columnGap: theme.spacing.sm,
        }}
      >
        <StatePill linked={false} label={t('poultrySupervisors.unlinkedBadge')} />
        <OutlineAction label={t('poultrySupervisors.linkVetToFarm')} icon="add" onPress={onLink} />
      </View>
    </SoftCard>
  );
}

/** "الأطباء" directory card — badge, ID, avatar, name, specialty, supervised farm, action. */
export function VetDirectoryCard({
  row,
  onOpenVet,
  onUpdate,
}: {
  row: PoultrySupervisionVeterinarianRow;
  onOpenVet: () => void;
  onUpdate: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const v = row.veterinarian;
  const linked = row.links.length > 0;
  return (
    <SoftCard style={{ rowGap: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <StatePill
          linked={linked}
          label={
            linked ? t('poultrySupervisors.approvedVet') : t('poultrySupervisors.availableVet')
          }
        />
        <Caption>
          {t('poultrySupervisors.vetId')}: {vetNumber(v.userId)}
        </Caption>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
        <Pressable accessibilityRole="button" accessibilityLabel={vetName(v)} onPress={onOpenVet}>
          <Avatar uri={v.avatarUrl} name={vetName(v)} size="avatarMd" />
        </Pressable>
        <View style={{ flex: 1, rowGap: 2 }}>
          <NameLink label={vetName(v)} onPress={onOpenVet} a11y={vetName(v)} />
          <Caption>{v.specialization ?? t('poultrySupervisors.noSpecialization')}</Caption>
        </View>
      </View>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          columnGap: 6,
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radius.md,
          padding: theme.spacing.sm,
        }}
      >
        <Caption>{t('poultrySupervisors.supervisedFarm')}:</Caption>
        <Text variant="label" color={linked ? 'primary' : 'textMuted'}>
          {linked ? row.links.map((l) => l.farm.name).join('، ') : t('poultrySupervisors.none')}
        </Text>
      </View>
      <OutlineAction
        label={linked ? t('poultrySupervisors.updateLink') : t('poultrySupervisors.linkToFarm')}
        icon={linked ? 'sync-outline' : 'add'}
        onPress={onUpdate}
      />
    </SoftCard>
  );
}

/** Numbered pager + page-size choice (10 / 20 / 50), as in the reference footer. */
export function Pager({
  page,
  totalPages,
  pageSize,
  onPage,
  onPageSize,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const last = Math.max(1, totalPages);
  const start = Math.max(1, Math.min(page - 2, last - 4));
  const pages = Array.from({ length: Math.min(5, last) }, (_, i) => start + i);

  const box = (selected: boolean, disabled = false) => ({
    minWidth: 36,
    height: 36,
    paddingHorizontal: 8,
    borderRadius: theme.radius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: selected ? theme.colors.primaryPressed : theme.colors.border,
    backgroundColor: selected ? theme.colors.primaryPressed : theme.colors.surface,
    opacity: disabled ? 0.4 : 1,
  });

  return (
    <View
      style={{
        rowGap: theme.spacing.sm,
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', columnGap: 6, alignItems: 'center' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('poultrySupervisors.prevPage')}
          disabled={page <= 1}
          onPress={() => onPage(page - 1)}
          style={box(false, page <= 1)}
        >
          <Text variant="label">«</Text>
        </Pressable>
        {pages.map((p) => (
          <Pressable
            key={p}
            accessibilityRole="button"
            accessibilityLabel={t('poultrySupervisors.pageN', { page: p })}
            accessibilityState={{ selected: p === page }}
            onPress={() => onPage(p)}
            style={box(p === page)}
          >
            <Text variant="label" color={p === page ? 'textInverse' : 'textPrimary'}>
              {p}
            </Text>
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('poultrySupervisors.nextPage')}
          disabled={page >= last}
          onPress={() => onPage(page + 1)}
          style={box(false, page >= last)}
        >
          <Text variant="label">»</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
        <Caption>{t('poultrySupervisors.show')}</Caption>
        {[10, 20, 50].map((s) => (
          <Pressable
            key={s}
            accessibilityRole="button"
            accessibilityLabel={t('poultrySupervisors.pageSizeN', { size: s })}
            accessibilityState={{ selected: s === pageSize }}
            onPress={() => onPageSize(s)}
            style={[box(s === pageSize), { height: 30, minWidth: 40 }]}
          >
            <Text variant="caption" color={s === pageSize ? 'textInverse' : 'textPrimary'}>
              {s}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
