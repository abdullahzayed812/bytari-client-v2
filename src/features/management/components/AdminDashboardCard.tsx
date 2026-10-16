import { Pressable, View, type DimensionValue } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/colors';

export interface DashboardTint {
  surface: keyof ColorTokens;
  accent: keyof ColorTokens;
}

/** 8-colour pastel cycle applied to the dashboard's category tiles by index. */
const DASHBOARD_TINTS_TUPLE = [
  { surface: 'dashboardAmberSurface', accent: 'dashboardAmberAccent' },
  { surface: 'dashboardPinkSurface', accent: 'dashboardPinkAccent' },
  { surface: 'dashboardVioletSurface', accent: 'dashboardVioletAccent' },
  { surface: 'dashboardMintSurface', accent: 'dashboardMintAccent' },
  { surface: 'dashboardBlueSurface', accent: 'dashboardBlueAccent' },
  { surface: 'dashboardRoseSurface', accent: 'dashboardRoseAccent' },
  { surface: 'dashboardTealSurface', accent: 'dashboardTealAccent' },
  { surface: 'dashboardSlateSurface', accent: 'dashboardSlateAccent' },
] as const satisfies readonly DashboardTint[];

export const DASHBOARD_TINTS: readonly DashboardTint[] = DASHBOARD_TINTS_TUPLE;

/** A card's light-theme colours (background, border, icon/arrow accent). */
export interface DashboardPalette {
  bg: string;
  border: string;
  accent: string;
}

/** Safe cyclic lookup — plain array indexing trips `noUncheckedIndexedAccess`. */
export function dashboardTint(index: number): DashboardTint {
  const i =
    ((index % DASHBOARD_TINTS_TUPLE.length) + DASHBOARD_TINTS_TUPLE.length) %
    DASHBOARD_TINTS_TUPLE.length;
  // Always in bounds — `i` is a non-negative modulo of a fixed-length tuple.
  return DASHBOARD_TINTS_TUPLE[i] as DashboardTint;
}

export interface AdminDashboardCardProps {
  icon: IconName;
  palette: DashboardPalette;
  /** Dark-theme colours — the reference palette is light-only. */
  tint: DashboardTint;
  title: string;
  subtitle: string;
  /** New/unseen items — rendered as the red pill, hidden once 0. */
  count: number;
  /** Active/approved/live items in this section — the card's main stat. */
  activeCount: number;
  unit: string;
  /** Optional secondary pill (e.g. "طلبات تجديد: 3") — hidden when absent. */
  secondaryLabel?: string;
  /** Column width from the grid (3 per row on a phone). */
  width: DimensionValue;
  onPress: () => void;
  loading?: boolean;
}

const BADGE_CAP = 99;

function formatBadgeCount(count: number): string {
  return count > BADGE_CAP ? `${BADGE_CAP}+` : String(count);
}

/** The reference's notification-pill red (Tailwind red-500). */
const RED = '#ef4444';

/**
 * One category tile, matching the `لوحة التحكم.html` reference: pastel card
 * (bg + border), accent icon disc and red "new" pill on top, title/subtitle,
 * then the arrow disc and the main stat at the bottom. Logical layout, so
 * RTL puts the icon/arrow on the right and the stat on the left as designed.
 */
export function AdminDashboardCard({
  icon,
  palette,
  tint,
  title,
  subtitle,
  count,
  activeCount,
  unit,
  secondaryLabel,
  width,
  onPress,
  loading,
}: AdminDashboardCardProps) {
  const theme = useTheme();
  const dark = theme.scheme === 'dark';
  const bg = dark ? theme.colors[tint.surface] : palette.bg;
  const border = dark ? theme.colors.border : palette.border;
  const accent = dark ? theme.colors[tint.accent] : palette.accent;
  const ink = dark ? theme.colors.textPrimary : '#1e293b';
  const muted = dark ? theme.colors.textSecondary : '#64748b';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={count > 0 ? `${title} (${formatBadgeCount(count)})` : title}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width,
          minHeight: 136,
          justifyContent: 'space-between',
          padding: 10,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: bg,
          ...theme.shadows.xs,
        },
        pressed && { transform: [{ scale: 0.95 }] },
      ]}
    >
      <View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: accent,
              alignItems: 'center',
              justifyContent: 'center',
              ...theme.shadows.xs,
            }}
          >
            <Icon name={icon} size={14} color="textInverse" style={{ color: '#ffffff' }} />
          </View>
          {!loading && count > 0 ? (
            <View
              style={{
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 2,
                backgroundColor: RED,
              }}
            >
              <Text
                weight="bold"
                style={{ fontSize: 10, lineHeight: 14, color: '#ffffff', padding: 0 }}
              >
                {formatBadgeCount(count)}
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          style={{
            fontFamily: theme.fontFamily.displayBold,
            fontSize: 11,
            lineHeight: 15,
            color: ink,
          }}
          numberOfLines={3}
        >
          {title}
        </Text>
        <Text style={{ fontSize: 9, lineHeight: 12, color: muted, marginTop: 2 }} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginTop: 4,
          paddingTop: 2,
        }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: dark ? theme.colors.surface : '#ffffff',
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.shadows.xs,
          }}
        >
          <Icon
            name="arrow-forward"
            directional
            size={12}
            color="textPrimary"
            style={{ color: accent }}
          />
        </View>
        <View style={{ alignItems: 'flex-end', flexShrink: 1, marginStart: 4 }}>
          <Text
            style={{
              fontFamily: theme.fontFamily.displayBold,
              fontSize: 16,
              lineHeight: 18,
              color: ink,
              // Digits only — they fit the line box, so skip the Cairo glyph padding.
              padding: 0,
            }}
          >
            {loading ? '—' : activeCount}
          </Text>
          <Text
            style={{
              fontFamily: theme.fontFamily.displaySemiBold,
              fontSize: 8.5,
              lineHeight: 12,
              color: muted,
              marginTop: 2,
            }}
            numberOfLines={2}
          >
            {unit}
          </Text>
          {!loading && secondaryLabel ? (
            <Text
              weight="bold"
              style={{ fontSize: 8.5, lineHeight: 12, color: theme.colors.warning, marginTop: 2 }}
              numberOfLines={2}
            >
              {secondaryLabel}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
