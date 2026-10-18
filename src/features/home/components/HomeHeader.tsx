import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';

import { Avatar, Icon, type IconName } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useConversations } from '@/features/chat/hooks';
import { useUnreadCount } from '@/features/notifications/hooks';
import { INTERFACE_SWITCH_ICON, useAuth, useInterfaceSwitch } from '@/hooks';
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

/** Halo shown around a pressed header control — the reference's soft green ring. */
const PRESS_HALO = 'rgba(0, 168, 89, 0.18)';
const ICON_BUTTON_SIZE = 36;
/** Card width under which the header switches to its compact spacing. */
const COMPACT_BELOW = 400;

/**
 * Round icon button used in screen headers (Home, Veterinarian Home) —
 * optional unread badge. Matches the supplied header reference: a compact
 * 36px muted circle with a thin icon; pressing it scales down slightly with a
 * soft green halo.
 */
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
      hitSlop={6}
      style={({ pressed }) => [
        {
          width: ICON_BUTTON_SIZE,
          height: ICON_BUTTON_SIZE,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
          // Constant border width so the press halo never shifts the layout.
          borderWidth: 2,
          borderColor: 'transparent',
        },
        pressed && {
          transform: [{ scale: 0.94 }],
          backgroundColor: theme.colors.primarySoft,
          borderColor: PRESS_HALO,
        },
        disabled && { opacity: 0.5 },
      ]}
    >
      {({ pressed }) => (
        <>
          <Icon name={icon} size="iconMd" color={pressed ? 'primary' : 'textPrimary'} />
          {badgeCount > 0 ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: -6,
                end: -6,
                minWidth: 16,
                height: 16,
                paddingHorizontal: 3,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colors.dangerSoft,
                borderWidth: 1,
                borderColor: theme.colors.surface,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  lineHeight: 12,
                  fontWeight: '600',
                  color: theme.colors.danger,
                }}
                numberOfLines={1}
              >
                {badgeCount > 99 ? '99+' : String(badgeCount)}
              </Text>
            </View>
          ) : null}
        </>
      )}
    </Pressable>
  );
}

export interface HomeHeaderLayoutProps {
  avatarUrl?: string | null;
  name?: string;
  greeting: string;
  /** Pressing the avatar (e.g. open the account page). Not pressable when omitted. */
  onAvatarPress?: () => void;
  avatarA11yLabel?: string;
  /** The round `HeaderIconButton`s. */
  children: ReactNode;
}

/**
 * Shared Home header (Pet Owner + Veterinarian), restored to the supplied
 * "القائمة العلوية" reference: ONE row inside a white rounded card —
 * avatar + greeting + full name at the start, the four icon actions at the
 * end. The icons never wrap or shrink; the identity block gives up space,
 * and a long name wraps between words onto a second line (ellipsised after
 * that) instead of being cut after its first word. Logical `start`/`end` layout, so Arabic RTL puts the
 * identity on the right and English LTR on the left.
 */
export function HomeHeaderLayout({
  avatarUrl,
  name,
  greeting,
  onAvatarPress,
  avatarA11yLabel,
  children,
}: HomeHeaderLayoutProps) {
  const theme = useTheme();
  // Phones (card < 400px — every phone width up to 430): slightly tighter
  // spacing + a 16px name so a typical full name still fits on two lines.
  // Measured (not `useWindowDimensions`, which is 0×0 on the static web export).
  const [compact, setCompact] = useState(false);
  const onLayout = (e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.width < COMPACT_BELOW;
    if (next !== compact) setCompact(next);
  };
  const avatar = <Avatar uri={avatarUrl} name={name} size="avatarMd" />;
  return (
    <View
      onLayout={onLayout}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        columnGap: compact ? 6 : theme.spacing.sm,
        paddingHorizontal: compact ? 12 : theme.spacing.lg,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.divider,
        backgroundColor: theme.colors.surface,
        ...theme.shadows.xs,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: compact ? 8 : 10,
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* the signed-in user's photo (`/auth/me` → `avatarUrl`); initials until one exists */}
        {onAvatarPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={avatarA11yLabel ?? name}
            onPress={onAvatarPress}
            style={({ pressed }) => [
              { borderRadius: theme.radius.pill, borderWidth: 2, borderColor: 'transparent' },
              pressed && { transform: [{ scale: 0.95 }], borderColor: PRESS_HALO },
            ]}
          >
            {avatar}
          </Pressable>
        ) : (
          avatar
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Caption numberOfLines={1} style={{ fontSize: 13 }}>
            {greeting}
          </Caption>
          {name ? (
            <Text
              // Up to two lines, broken between words — a narrow phone shows the
              // full name instead of cutting it after the first word.
              numberOfLines={2}
              ellipsizeMode="tail"
              weight="bold"
              style={{
                fontSize: compact ? 16 : 17,
                lineHeight: compact ? 22 : 24,
                color: theme.colors.textPrimary,
              }}
            >
              {name}
            </Text>
          ) : null}
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: compact ? 4 : 6,
          flexShrink: 0,
        }}
      >
        {children}
      </View>
    </View>
  );
}

/**
 * Pet Owner Home header: greeting + avatar (start) and search / notifications
 * / chat / mode-switch icon buttons (end). No text labels, matching the
 * reference — the notifications card and chat card that used to live inline
 * on Home are now these icons; both keep their unread badges.
 *
 * The mode-switch icon is the same one `VeterinarianHomeHeader` uses
 * (`INTERFACE_SWITCH_ICON`). It is rendered ONLY for a backend-approved
 * veterinarian (or admin); a plain pet owner never sees it. The switch itself
 * re-verifies approval against `/auth/me` (`useInterfaceSwitch`).
 */
export function HomeHeader() {
  const { t } = useTranslation('home');
  const { t: tn } = useTranslation('notifications');
  const { t: tch } = useTranslation('chat');
  const { user } = useAuth();
  const interfaceSwitch = useInterfaceSwitch();
  const greeting = useAppHeaderGreeting();
  const { data: unread = 0 } = useUnreadCount();
  const { unreadTotal: chatUnread } = useConversations({ pageSize: 20 });

  const name = user ? fullName(user.firstName, user.lastName) : undefined;

  return (
    <HomeHeaderLayout
      avatarUrl={user?.avatarUrl}
      name={name}
      greeting={greeting}
      onAvatarPress={() => router.push(Routes.account)}
      avatarA11yLabel={t('header.accountA11y')}
    >
      <HeaderIconButton
        icon="search-outline"
        label={t('header.searchA11y')}
        onPress={() => router.push(Routes.search)}
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
      {/* Only an approved veterinarian (or admin) gets the switch — a plain
          pet owner sees no button and no "become a vet" detour here. */}
      {interfaceSwitch.canSwitch ? (
        <HeaderIconButton
          icon={INTERFACE_SWITCH_ICON}
          label={t('header.switchToVetA11y')}
          onPress={() => {
            if (!interfaceSwitch.switching) void interfaceSwitch.switchTo('veterinarian');
          }}
        />
      ) : null}
    </HomeHeaderLayout>
  );
}
