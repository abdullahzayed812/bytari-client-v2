import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Badge } from '@/components/content';
import { useTheme } from '@/theme';

import type { SyndicateCounters } from '../types';

/**
 * Unread request / inquiry badges for a syndicate card. `counters` is only
 * present for a viewer allowed to read this syndicate's submissions (server
 * decides), so nothing renders for ordinary users.
 */
export function SyndicateCounterBadges({ counters }: { counters: SyndicateCounters | null }) {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  if (!counters || (counters.unreadRequests === 0 && counters.unreadInquiries === 0)) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
      {counters.unreadRequests > 0 ? (
        <Badge
          tone="danger"
          label={`${t('manage.requests')} ${t('manage.newCount', { count: counters.unreadRequests })}`}
        />
      ) : null}
      {counters.unreadInquiries > 0 ? (
        <Badge
          tone="danger"
          label={`${t('manage.inquiries')} ${t('manage.newCount', { count: counters.unreadInquiries })}`}
        />
      ) : null}
    </View>
  );
}
