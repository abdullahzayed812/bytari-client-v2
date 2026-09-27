import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Avatar } from '@/components/content';
import { useToast } from '@/components/feedback';
import { Caption, Heading } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useConversations } from '@/features/chat/hooks';
import { HeaderIconButton } from '@/features/home/components';
import { useUnreadCount } from '@/features/notifications/hooks';
import { INTERFACE_SWITCH_ICON, useAuth, useInterfaceSwitch } from '@/hooks';
import { useTheme } from '@/theme';
import { fullName } from '@/utils';

/**
 * Veterinarian Home header — matches the reference design: avatar + "Welcome,
 * doctor" greeting (start) and search / notifications / chat / mode-switch
 * icon buttons (end). Reuses the same `HeaderIconButton` as the Pet Owner Home
 * header for a consistent look. The last icon (`INTERFACE_SWITCH_ICON`, the
 * same glyph as the Pet Owner header) switches back to Pet Owner mode with a
 * confirmation toast. The chat icon opens the Conversations inbox — the same
 * screen and unread count the Pet Owner header uses (direct, organization and
 * joined-room threads), NOT the public Global Chat directly.
 */
export function VeterinarianHomeHeader() {
  const theme = useTheme();
  const { t } = useTranslation('veterinarian');
  const { t: th } = useTranslation('home');
  const { t: tc } = useTranslation('common');
  const { t: tn } = useTranslation('notifications');
  const { t: tch } = useTranslation('chat');
  const toast = useToast();
  const { user } = useAuth();
  const interfaceSwitch = useInterfaceSwitch();
  const { data: unread = 0 } = useUnreadCount();
  // Same conversations inbox (and unread total) as the Pet Owner header.
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
      <View
        style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm, flex: 1 }}
      >
        <Avatar name={name} size="avatarMd" />
        <View style={{ flex: 1 }}>
          <Caption numberOfLines={1}>{t('home.greeting')}</Caption>
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
          label={th('header.searchA11y')}
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
        <HeaderIconButton
          icon={INTERFACE_SWITCH_ICON}
          label={t('home.switchToOwnerA11y')}
          onPress={() => void interfaceSwitch.switchTo('owner')}
        />
      </View>
    </View>
  );
}
