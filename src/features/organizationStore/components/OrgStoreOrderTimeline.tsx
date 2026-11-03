import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDateTime } from '@/utils';

import { ORG_STORE_TRACKING_STEPS, type OrgStoreOrder, type OrgStoreOrderStatus } from '../types';

/**
 * "تتبع الطلب" — the happy-path steps (reached / current / upcoming) plus the
 * full status history with who changed it and any note.
 */
export function OrgStoreOrderTimeline({ order }: { order: OrgStoreOrder }) {
  const theme = useTheme();
  const { t } = useTranslation('organizationStore');
  const history = order.history ?? [];
  const reachedAt = new Map<OrgStoreOrderStatus, string>();
  for (const e of history) if (!reachedAt.has(e.toStatus)) reachedAt.set(e.toStatus, e.createdAt);
  const cancelled = order.status === 'CANCELLED';
  const currentIndex = ORG_STORE_TRACKING_STEPS.indexOf(order.status);

  return (
    <View style={{ rowGap: theme.spacing.md }}>
      {cancelled ? null : (
        <View style={{ rowGap: theme.spacing.sm }}>
          {ORG_STORE_TRACKING_STEPS.map((step, i) => {
            const done = i <= currentIndex;
            const at = reachedAt.get(step);
            return (
              <View
                key={step}
                style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}
                accessibilityLabel={t(`order.status.${step}`)}
              >
                <Icon
                  name={done ? 'checkmark-circle' : 'ellipse-outline'}
                  size="iconSm"
                  color={done ? (i === currentIndex ? 'primary' : 'success') : 'textMuted'}
                />
                <Text
                  variant={i === currentIndex ? 'bodyStrong' : 'body'}
                  color={done ? 'textPrimary' : 'textMuted'}
                  style={{ flex: 1 }}
                >
                  {t(`order.status.${step}`)}
                </Text>
                {at ? <Caption>{formatDateTime(at)}</Caption> : null}
              </View>
            );
          })}
        </View>
      )}

      {history.length > 0 ? (
        <View style={{ rowGap: theme.spacing.xs }}>
          <Text variant="label" color="textSecondary">
            {t('order.history')}
          </Text>
          {[...history].reverse().map((e) => (
            <View key={e.id} style={{ rowGap: 2 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="bodyMedium">
                  {t(`order.status.${e.toStatus}`)} · {t(`order.side.${e.actorSide}`)}
                </Text>
                <Caption>{formatDateTime(e.createdAt)}</Caption>
              </View>
              {e.note ? <Caption>{e.note}</Caption> : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
