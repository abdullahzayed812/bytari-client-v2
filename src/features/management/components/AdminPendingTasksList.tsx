import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Icon, type BadgeTone } from '@/components/content';
import { EmptyState } from '@/components/feedback';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import type { AdminPendingTask, AdminTaskPriority } from '@/features/admin/types';
import { useTheme } from '@/theme';

function priorityTone(priority: AdminTaskPriority): BadgeTone {
  if (priority === 'urgent') return 'danger';
  if (priority === 'medium') return 'warning';
  return 'neutral';
}

/** Hours since `createdAt`, and whether that should be phrased in hours or days. */
function ageSince(createdAt: string): { unit: 'hours' | 'days'; count: number } {
  const hours = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 3_600_000));
  return hours < 24 ? { unit: 'hours', count: Math.max(hours, 1) } : { unit: 'days', count: Math.floor(hours / 24) };
}

function taskHref(task: AdminPendingTask) {
  return task.kind === 'VET_APPLICATION'
    ? Routes.adminVetApplications
    : Routes.adminOrganization(task.targetId);
}

interface Props {
  items: AdminPendingTask[];
}

export function AdminPendingTasksList({ items }: Props) {
  const theme = useTheme();
  const { t } = useTranslation('admin');

  if (items.length === 0) {
    return <EmptyState icon="checkmark-done-outline" title={t('dashboard.tasks.empty')} />;
  }

  return (
    <View style={{ rowGap: theme.spacing.sm }}>
      {items.map((task) => (
        <Pressable
          key={task.id}
          accessibilityRole="button"
          accessibilityLabel={task.label}
          onPress={() => router.push(taskHref(task))}
          style={({ pressed }) => [
            {
              flexDirection: 'row',
              alignItems: 'center',
              columnGap: theme.spacing.sm,
              paddingVertical: theme.spacing.sm,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Badge label={t(`dashboard.tasks.priority.${task.priority}`)} tone={priorityTone(task.priority)} size="sm" />
          <View style={{ flex: 1, rowGap: 2 }}>
            <Text variant="bodyMedium" numberOfLines={2}>
              {task.label}
            </Text>
            <Caption>
              {(() => {
                const age = ageSince(task.createdAt);
                return age.unit === 'hours'
                  ? t('dashboard.tasks.ageHours', { count: age.count })
                  : t('dashboard.tasks.ageDays', { count: age.count });
              })()}
            </Caption>
          </View>
          <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
        </Pressable>
      ))}
    </View>
  );
}
