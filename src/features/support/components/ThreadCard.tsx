import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { UserName } from '@/features/users/components';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { SUPPORT_KIND_META } from '../constants';
import type { Thread } from '../types';

import { ThreadStatusBadge } from './ThreadStatusBadge';

export interface ThreadCardProps {
  thread: Thread;
  /** Show the creator's name (admin / supervisor list); hidden on "my threads". */
  showCreator?: boolean;
  onPress?: () => void;
}

/**
 * Thread row. The list DTO has no title / body preview (backend has none), so
 * the card surfaces status, kind, last-activity, an AI-replied hint, and an
 * "attached to an animal" hint — enough to pick a thread to open.
 */
export function ThreadCard({ thread, showCreator = false, onPress }: ThreadCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('support');
  const meta = SUPPORT_KIND_META[thread.kind];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('card.openLabel', {
        kind: t(`kind.${thread.kind}`),
        date: formatDate(thread.createdAt),
      })}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.lg,
          padding: theme.spacing.lg,
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadows.xs,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={meta.icon} size="iconMd" color="primary" />
      </View>

      <View style={{ flex: 1, rowGap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
          <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
            {t(`kind.${thread.kind}`)}
          </Text>
          <ThreadStatusBadge status={thread.status} />
        </View>

        {showCreator ? (
          <Caption numberOfLines={1}>
            {t('card.by')} <UserName userId={thread.createdByUserId} variant="caption" />
          </Caption>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            columnGap: theme.spacing.sm,
            rowGap: 4,
          }}
        >
          <Caption>
            {thread.lastMessageAt
              ? t('card.lastActivity', { date: formatDate(thread.lastMessageAt) })
              : t('card.created', { date: formatDate(thread.createdAt) })}
          </Caption>
          {thread.aiResponded ? (
            <Badge label={t('card.aiReplied')} tone="warning" size="sm" />
          ) : null}
          {thread.animalId ? <Badge label={t('card.hasAnimal')} tone="info" size="sm" /> : null}
          {thread.senderBlocked ? (
            <Badge label={t('card.senderBlocked')} tone="danger" size="sm" />
          ) : null}
        </View>
      </View>

      <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
    </Pressable>
  );
}
