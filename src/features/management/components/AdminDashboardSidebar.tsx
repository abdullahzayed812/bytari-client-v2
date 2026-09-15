import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { Text } from '@/components/typography';
import { useAuth } from '@/hooks';
import { useTheme } from '@/theme';

import type { DashboardCardDef } from '../config/dashboardCards';

interface Props {
  cards: DashboardCardDef[];
  cardLabel: (id: DashboardCardDef['id']) => string;
  onCardPress: (card: DashboardCardDef) => void;
}

function SidebarItem({
  icon,
  label,
  danger,
  onPress,
}: {
  icon: IconName;
  label: string;
  danger?: boolean;
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
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.sm,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          borderRadius: theme.radius.lg,
        },
        pressed && { backgroundColor: theme.colors.adminSidebarItemActive },
      ]}
    >
      <Icon name={icon} size="iconSm" color={danger ? 'danger' : 'textInverse'} />
      <Text
        variant="bodyMedium"
        style={{ color: danger ? theme.colors.danger : theme.colors.adminSidebarText, flex: 1 }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Wide/web-only fixed dark nav rail — mirrors the reference screenshot's sidebar. */
export function AdminDashboardSidebar({ cards, cardLabel, onCardPress }: Props) {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const { t: tCommon } = useTranslation('common');
  const { logout } = useAuth();

  return (
    <View
      style={{
        width: 220,
        backgroundColor: theme.colors.adminSidebarBackground,
        paddingVertical: theme.spacing.lg,
        rowGap: theme.spacing.md,
      }}
    >
      <View style={{ paddingHorizontal: theme.spacing.lg }}>
        <Text variant="title" weight="bold" style={{ color: theme.colors.adminSidebarText }}>
          {tCommon('appName')}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: theme.spacing.sm, rowGap: theme.spacing.xs }}
      >
        <SidebarItem icon="home-outline" label={t('dashboard.nav.home')} onPress={() => {}} />
        {cards.map((card) => (
          <SidebarItem
            key={card.id}
            icon={card.icon}
            label={cardLabel(card.id)}
            onPress={() => onCardPress(card)}
          />
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: theme.spacing.sm }}>
        <SidebarItem
          icon="log-out-outline"
          label={t('dashboard.nav.logout')}
          danger
          onPress={() => void logout()}
        />
      </View>
    </View>
  );
}
