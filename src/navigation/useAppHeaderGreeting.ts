import { useTranslation } from 'react-i18next';

import { useAuth } from '@/hooks';

/** "{greeting}, {firstName}" — falls back to a plain welcome when signed out. */
export function useAppHeaderGreeting(): string {
  const { t } = useTranslation('common');
  const { user } = useAuth();
  const hello = t('greeting.hello');
  return user?.firstName ? `${hello}، ${user.firstName}` : t('greeting.welcome');
}
