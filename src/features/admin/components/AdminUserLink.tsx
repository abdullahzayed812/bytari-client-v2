import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { Button } from '@/components/actions';
import { Caption, Text, type TextProps } from '@/components/typography';
import { Permission } from '@/constants/permissions';
import { Routes } from '@/constants/routes';
import { UserName } from '@/features/users';
import { useCapabilities } from '@/hooks';

/**
 * Server placeholder that owns records re-attributed from permanently deleted
 * accounts (`DELETED_USER_ID`) — never a real person, so never linked.
 */
export const DELETED_USER_ID = '00000000-0000-4000-8000-00000000d31e';

/** May the caller open `/admin/users/:id`? Mirrors the route's `user.read` gate. */
export function useCanOpenAdminUser(): boolean {
  const caps = useCapabilities();
  return caps.isAdmin || caps.can(Permission.USER_READ);
}

function isLinkable(userId: string | null | undefined): userId is string {
  return Boolean(userId) && userId !== DELETED_USER_ID;
}

export interface AdminUserLinkProps extends Omit<TextProps, 'children' | 'onPress'> {
  /** The REAL user id (from the record's relation) — never resolved from a display name. */
  userId: string | null | undefined;
  /** Display name when the caller already has it; otherwise it is resolved from `userId`. */
  name?: string | null;
}

/**
 * A user's name that opens their Admin profile (`/admin/users/:id`) — pushed
 * onto the stack, so "back" returns to the list with its search / filters /
 * scroll intact. Plain text when the caller lacks `user.read`; "deleted
 * account" for a missing / deleted user.
 */
export function AdminUserLink({
  userId,
  name,
  variant = 'bodyMedium',
  ...rest
}: AdminUserLinkProps) {
  const { t } = useTranslation('admin');
  const canOpen = useCanOpenAdminUser();

  if (!isLinkable(userId)) {
    return (
      <Text variant={variant} color="textMuted" {...rest}>
        {t('userLink.deletedAccount')}
      </Text>
    );
  }
  const label = name ? (
    <Text variant={variant} {...rest}>
      {name}
    </Text>
  ) : (
    <UserName userId={userId} variant={variant} {...rest} />
  );
  if (!canOpen) return label;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={t('userLink.openProfileA11y', { name: name ?? '' })}
      accessibilityHint={t('userLink.viewProfile')}
      hitSlop={6}
      onPress={() => router.push(Routes.adminUser(userId))}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      {name ? (
        <Text
          variant={variant}
          color="primary"
          style={{ textDecorationLine: 'underline' }}
          {...rest}
        >
          {name}
        </Text>
      ) : (
        <UserName
          userId={userId}
          variant={variant}
          color="primary"
          style={{ textDecorationLine: 'underline' }}
          {...rest}
        />
      )}
    </Pressable>
  );
}

export interface ViewUserProfileButtonProps {
  userId: string | null | undefined;
  /** Defaults to "عرض ملف المستخدم". */
  label?: string;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
}

/**
 * "عرض ملف المستخدم" — opens the existing Admin user profile for an
 * organization owner / member. Hidden without `user.read`; a clear fallback
 * line when the account is missing or deleted.
 */
export function ViewUserProfileButton({
  userId,
  label,
  size = 'sm',
  fullWidth = true,
}: ViewUserProfileButtonProps) {
  const { t } = useTranslation('admin');
  const canOpen = useCanOpenAdminUser();
  if (!canOpen) return null;
  if (!isLinkable(userId)) return <Caption>{t('userLink.unavailable')}</Caption>;
  return (
    <Button
      label={label ?? t('userLink.viewProfile')}
      variant="outline"
      size={size}
      leftIcon="person-circle-outline"
      fullWidth={fullWidth}
      onPress={() => router.push(Routes.adminUser(userId))}
    />
  );
}
