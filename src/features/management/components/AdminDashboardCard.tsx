import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { Caption, Text } from '@/components/typography';
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

/** Safe cyclic lookup — plain array indexing trips `noUncheckedIndexedAccess`. */
export function dashboardTint(index: number): DashboardTint {
  const i = ((index % DASHBOARD_TINTS_TUPLE.length) + DASHBOARD_TINTS_TUPLE.length) % DASHBOARD_TINTS_TUPLE.length;
  // Always in bounds — `i` is a non-negative modulo of a fixed-length tuple.
  return DASHBOARD_TINTS_TUPLE[i] as DashboardTint;
}

export interface AdminDashboardCardProps {
  icon: IconName;
  tint: DashboardTint;
  title: string;
  subtitle: string;
  /** New/unseen items — rendered as a small red notification badge, hidden once 0. */
  count: number;
  /** Active/approved/live items in this section — the card's main stat. */
  activeCount: number;
  unit: string;
  onPress: () => void;
  loading?: boolean;
}

const BADGE_CAP = 99;

function formatBadgeCount(count: number): string {
  return count > BADGE_CAP ? `${BADGE_CAP}+` : String(count);
}

/**
 * One category tile in the redesigned admin dashboard grid. Sizing
 * (`flexGrow` + `minWidth` inside a wrapping row) reflows from 2 columns on a
 * phone to several on a wide/web viewport for free — no separate mobile/web
 * layout branch needed for the grid itself, only the page shell around it.
 */
export function AdminDashboardCard({
  icon,
  tint,
  title,
  subtitle,
  count,
  activeCount,
  unit,
  onPress,
  loading,
}: AdminDashboardCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        count > 0 ? `${title} (${formatBadgeCount(count)})` : title
      }
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexGrow: 1,
          flexBasis: '47%',
          minWidth: 156,
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors[tint.surface],
          padding: theme.spacing.md,
          rowGap: theme.spacing.md,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, rowGap: 2 }}>
          <Text variant="bodyMedium" weight="bold" numberOfLines={1}>
            {title}
          </Text>
          <Caption numberOfLines={2}>{subtitle}</Caption>
        </View>
        <View style={{ width: 36, height: 36 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: theme.colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={icon} size="iconSm" color={tint.accent} />
          </View>
          {!loading && count > 0 ? (
            <View
              style={{
                position: 'absolute',
                top: -4,
                insetInlineEnd: -4,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                paddingHorizontal: 3,
                backgroundColor: theme.colors.danger,
                borderWidth: 1.5,
                borderColor: theme.colors[tint.surface],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                variant="overline"
                weight="bold"
                color="textInverse"
                style={{ fontSize: 10, lineHeight: 12, letterSpacing: 0 }}
              >
                {formatBadgeCount(count)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View>
          <Text variant="title" weight="bold">
            {loading ? '—' : activeCount}
          </Text>
          <Caption>{unit}</Caption>
        </View>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: theme.colors[tint.accent],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="arrow-back-outline" directional size="iconXs" color="textInverse" />
        </View>
      </View>
    </Pressable>
  );
}
