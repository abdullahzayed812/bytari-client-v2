import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Avatar } from '@/components/content';
import { useToast } from '@/components/feedback';
import { Caption, Heading } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useChatRooms } from '@/features/globalChat/hooks';
import { HeaderIconButton } from '@/features/home/components';
import { useUnreadCount } from '@/features/notifications/hooks';
import { useAppMode, useAuth } from '@/hooks';
import { useTheme } from '@/theme';
import { fullName } from '@/utils';

/**
 * Veterinarian Home header — matches the reference design: avatar + "Welcome,
 * doctor" greeting (start) and search / notifications / chat / mode-switch
 * icon buttons (end). Reuses the same `HeaderIconButton` as the Pet Owner Home
 * header (`@/features/home`) for a consistent look. The last icon (visually a
 * refresh glyph, per the reference design) switches the app straight back to
 * Pet Owner mode — the same action as the segmented control on `AccountScreen`
 * (`mode.setMode('owner')`), just one tap away from Home. The chat icon opens
 * Global Chat (public discussion rooms) — the 1:1 conversation list is still
 * reachable from there via a header icon, so nothing is lost.
 */
export function VeterinarianHomeHeader() {
  const theme = useTheme();
  const { t } = useTranslation('veterinarian');
  const { t: th } = useTranslation('home');
  const { t: tc } = useTranslation('common');
  const { t: tn } = useTranslation('notifications');
  const { t: tch } = useTranslation('globalChat');
  const toast = useToast();
  const { user } = useAuth();
  const mode = useAppMode();
  const { data: unread = 0 } = useUnreadCount();
  const { unreadTotal: chatUnread } = useChatRooms({ pageSize: 20 });

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
          label={tch('list.title')}
          badgeCount={chatUnread}
          onPress={() => router.push(Routes.globalChat)}
        />
        <HeaderIconButton
          icon="refresh-outline"
          label={t('home.switchToOwnerA11y')}
          onPress={() => mode.setMode('owner')}
        />
      </View>
    </View>
  );
}
