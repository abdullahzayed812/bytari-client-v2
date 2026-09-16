import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { EmptyState } from '@/components/feedback';
import { Caption, Text } from '@/components/typography';
import type { AdminActivityItem } from '@/features/admin/types';
import { useTheme } from '@/theme';
import { formatTime } from '@/utils';

type ActionTone = 'success' | 'danger' | 'info' | 'neutral';

/**
 * The `AuditAction` catalogue is a consistent `NOUN_VERB_PAST` naming scheme
 * (confirmed against the backend enum) — deriving a dot colour from the verb
 * suffix avoids hand-maintaining a per-action colour map for ~150 values.
 */
function actionTone(action: string): ActionTone {
  if (/_(APPROVED|CREATED|ACTIVATED|PUBLISHED|ASSIGNED|PLACED|SENT|RESTORED|JOINED|GRANTED)$/.test(action)) {
    return 'success';
  }
  if (
    /_(REJECTED|DELETED|REMOVED|SUSPENDED|DEACTIVATED|CANCELLED|CLOSED|BLOCKED|ARCHIVED|REVOKED)$/.test(
      action,
    )
  ) {
    return 'danger';
  }
  if (/_(UPDATED|CHANGED|ADJUSTED|SET|SAVED|REORDERED|REGENERATED|TRANSFERRED)$/.test(action)) {
    return 'info';
  }
  return 'neutral';
}

interface Props {
  items: AdminActivityItem[];
}

export function AdminActivityFeed({ items }: Props) {
  const theme = useTheme();
  const { t } = useTranslation('admin');

  if (items.length === 0) {
    return <EmptyState icon="pulse-outline" title={t('dashboard.activity.empty')} />;
  }

  return (
    <View style={{ rowGap: theme.spacing.sm }}>
      {items.map((item) => {
        const tone = actionTone(item.action);
        const dotColor =
          tone === 'success'
            ? theme.colors.success
            : tone === 'danger'
              ? theme.colors.danger
              : tone === 'info'
                ? theme.colors.info
                : theme.colors.textMuted;

        return (
          <View
            key={item.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              columnGap: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
            }}
          >
            <View
              style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }}
            />
            <View style={{ flex: 1, minWidth: 0, rowGap: 2 }}>
              <Text variant="bodyMedium" numberOfLines={2}>
                {t(`activityActions.${item.action}`, { defaultValue: item.action })}
              </Text>
              <Caption numberOfLines={1}>
                {item.actorName ?? t('dashboard.activity.unknownUser')}
              </Caption>
            </View>
            <Caption style={{ flexShrink: 0 }}>{formatTime(item.createdAt)}</Caption>
          </View>
        );
      })}
    </View>
  );
}
