import { useTranslation } from 'react-i18next';

import { Text, type TextProps } from '@/components/typography';

import { useUserSummary } from '../hooks';

export interface UserNameProps extends Omit<TextProps, 'children'> {
  userId: string | null | undefined;
  /** Shown while loading and when the id cannot be resolved (404 / null id). */
  fallback?: string;
}

/**
 * Inline display of a user's name, resolved from `GET /users/:id`. While loading
 * or when the user cannot be resolved it renders `fallback` (default: a generic
 * "this user" string) — it never shows a raw UUID and never blocks a screen.
 */
export function UserName({ userId, fallback, variant = 'bodyMedium', ...rest }: UserNameProps) {
  const { t } = useTranslation('users');
  const q = useUserSummary(userId);
  const fb = fallback ?? t('unknown');

  const name = q.data ? `${q.data.firstName} ${q.data.lastName}`.trim() : '';

  return (
    <Text variant={variant} {...rest}>
      {name || fb}
    </Text>
  );
}
