import { useTranslation } from 'react-i18next';

/**
 * Pet Owner header greeting — just "Welcome" / "أهلاً بك". The header already
 * shows the user's full name on the line below, so the greeting never repeats
 * the name.
 */
export function useAppHeaderGreeting(): string {
  const { t } = useTranslation('common');
  return t('greeting.hello');
}
