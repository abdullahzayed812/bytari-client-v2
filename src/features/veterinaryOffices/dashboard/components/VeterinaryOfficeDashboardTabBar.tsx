import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/content';
import { Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

export type VeterinaryOfficeDashboardTab = 'profile' | 'notifications' | 'home' | 'orders' | 'reports';

type TabLabelKey =
  | 'tabBar.profile'
  | 'tabBar.notifications'
  | 'tabBar.home'
  | 'tabBar.orders'
  | 'tabBar.reports';

interface TabDef {
  key: VeterinaryOfficeDashboardTab;
  icon: IconName;
  labelKey: TabLabelKey;
  routeFor: (organizationId: string) => string;
}

const TABS: TabDef[] = [
  { key: 'profile', icon: 'person-outline', labelKey: 'tabBar.profile', routeFor: (id) => Routes.organizationDetail(id) },
  { key: 'notifications', icon: 'notifications-outline', labelKey: 'tabBar.notifications', routeFor: () => Routes.notifications },
  { key: 'home', icon: 'home-outline', labelKey: 'tabBar.home', routeFor: (id) => Routes.vetOfficeDashboard(id) },
  { key: 'orders', icon: 'receipt-outline', labelKey: 'tabBar.orders', routeFor: (id) => Routes.vetOfficeDashboardOrders(id) },
  { key: 'reports', icon: 'bar-chart-outline', labelKey: 'tabBar.reports', routeFor: (id) => Routes.vetOfficeDashboardReports(id) },
];

export interface VeterinaryOfficeDashboardTabBarProps {
  organizationId: string;
  active: VeterinaryOfficeDashboardTab;
}

/**
 * The Veterinary Office Dashboard's own 5-destination bottom bar (profile /
 * notifications / home / orders / reports) — a separate, self-contained nested
 * stack, NOT the app's global `(tabs)` bar (Expo Router has exactly one tab
 * set; this dashboard is entered via "دخول لوحة التحكم" and every screen under
 * `vet-office-dashboard/[organizationId]` renders this same bar via
 * `VeterinaryOfficeDashboardShell`).
 */
export function VeterinaryOfficeDashboardTabBar({
  organizationId,
  active,
}: VeterinaryOfficeDashboardTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('veterinaryOfficeDashboard');

  return (
    <View
      style={{
        backgroundColor: theme.colors.background,
        borderTopWidth: theme.sizes.hairline,
        borderTopColor: theme.colors.divider,
        paddingBottom: Math.max(insets.bottom, theme.spacing.sm),
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        {TABS.map((tab) => {
          const focused = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={t(tab.labelKey)}
              onPress={() => {
                if (!focused) router.replace(tab.routeFor(organizationId) as never);
              }}
              style={({ pressed }) => [
                { flex: 1, alignItems: 'center', paddingVertical: theme.spacing.sm, rowGap: 2 },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Icon name={tab.icon} size="iconMd" color={focused ? 'primary' : 'textMuted'} />
              <Text
                variant="overline"
                color={focused ? 'primary' : 'textMuted'}
                numberOfLines={1}
              >
                {t(tab.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
