import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Avatar, Badge, Icon, type IconName } from '@/components/content';
import { useToast } from '@/components/feedback';
import { Caption, Heading } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useConversations } from '@/features/chat/hooks';
import { useUnreadCount } from '@/features/notifications/hooks';
import { useAuth } from '@/hooks';
import { useAppHeaderGreeting } from '@/navigation/useAppHeaderGreeting';
import { useTheme } from '@/theme';
import { fullName } from '@/utils';

export interface HeaderIconButtonProps {
  icon: IconName;
  label: string;
  badgeCount?: number;
  onPress: () => void;
  disabled?: boolean;
}

/** Round icon button used in screen headers (Home, Veterinarian Home) — optional unread badge. */
export function HeaderIconButton({
  icon,
  label,
  badgeCount = 0,
  onPress,
  disabled,
}: HeaderIconButtonProps) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        {
          width: theme.sizes.controlHeightMd,
          height: theme.sizes.controlHeightMd,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
        },
        pressed && { opacity: 0.7 },
        disabled && { opacity: 0.5 },
      ]}
    >
      <Icon name={icon} size="iconMd" color="textPrimary" />
      {badgeCount > 0 ? (
        <View style={{ position: 'absolute', top: 2, end: 2 }}>
          <Badge label={badgeCount > 99 ? '99+' : String(badgeCount)} tone="danger" size="sm" />
        </View>
      ) : null}
    </Pressable>
  );
}

/**
 * Pet Owner Home header: greeting + avatar (start) and search / notifications
 * / chat icon buttons (end). No text labels, matching the reference — the
 * notifications card and chat card that used to live inline on Home are now
 * these two icons; both keep their unread badges.
 */
export function HomeHeader() {
  const theme = useTheme();
  const { t } = useTranslation('home');
  const { t: tc } = useTranslation('common');
  const { t: tn } = useTranslation('notifications');
  const { t: tch } = useTranslation('chat');
  const toast = useToast();
  const { user } = useAuth();
  const greeting = useAppHeaderGreeting();
  const { data: unread = 0 } = useUnreadCount();
  const { unreadTotal: chatUnread } = useConversations({ pageSize: 20 });

  const name = user ? fullName(user.firstName, user.lastName) : undefined;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        columnGap: theme.spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm, flex: 1 }}>
        <Avatar name={name} size="avatarMd" />
        <View style={{ flex: 1 }}>
          <Caption numberOfLines={1}>{greeting}</Caption>
          {name ? (
            <Heading level={3} numberOfLines={1}>
              {name}
            </Heading>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
        <HeaderIconButton
          icon="search-outline"
          label={t('header.searchA11y')}
          onPress={() => toast.show({ message: tc('comingSoon'), tone: 'info' })}
        />
        <HeaderIconButton
          icon="notifications-outline"
          label={unread > 0 ? tn('bell.a11yWithCount', { count: unread }) : tn('bell.a11y')}
          badgeCount={unread}
          onPress={() => router.push(Routes.notifications)}
        />
        <HeaderIconButton
          icon="chatbubbles-outline"
          label={chatUnread > 0 ? tch('list.a11yUnread', { count: chatUnread }) : tch('home.title')}
          badgeCount={chatUnread}
          onPress={() => router.push(Routes.chat)}
        />
      </View>
    </View>
  );
}
