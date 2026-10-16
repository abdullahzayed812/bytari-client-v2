import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Badge, Icon, type BadgeTone } from '@/components/content';
import { EmptyState } from '@/components/feedback';
import { Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import type { AdminPendingTask, AdminTaskPriority } from '@/features/admin/types';
import { useTheme } from '@/theme';

import { activityCardStyle } from './AdminActivityFeed';

function priorityTone(priority: AdminTaskPriority): BadgeTone {
  if (priority === 'urgent') return 'danger';
  if (priority === 'medium') return 'warning';
  return 'neutral';
}

/** Hours since `createdAt`, and whether that should be phrased in hours or days. */
function ageSince(createdAt: string): { unit: 'hours' | 'days'; count: number } {
  const hours = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 3_600_000));
  return hours < 24
    ? { unit: 'hours', count: Math.max(hours, 1) }
    : { unit: 'days', count: Math.floor(hours / 24) };
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
  const dark = theme.scheme === 'dark';
  const { t } = useTranslation('admin');

  if (items.length === 0) {
    return <EmptyState icon="checkmark-done-outline" title={t('dashboard.tasks.empty')} />;
  }

  return (
    <View style={{ rowGap: 10 }}>
      {items.map((task) => (
        <Pressable
          key={task.id}
          accessibilityRole="button"
          accessibilityLabel={task.label}
          onPress={() => router.push(taskHref(task))}
          // Same row card as the activity list (dashboard reference).
          style={({ pressed }) => [
            activityCardStyle(theme, dark),
            pressed && { transform: [{ scale: 0.97 }] },
          ]}
        >
          <Badge
            label={t(`dashboard.tasks.priority.${task.priority}`)}
            tone={priorityTone(task.priority)}
            size="sm"
          />
          <View style={{ flex: 1, minWidth: 0, rowGap: 4 }}>
            <Text
              numberOfLines={2}
              style={{
                fontFamily: theme.fontFamily.displayBold,
                fontSize: 12,
                lineHeight: 16,
                color: dark ? theme.colors.textPrimary : '#0f172a',
              }}
            >
              {task.label}
            </Text>
            <Text
              weight="medium"
              style={{
                fontSize: 10,
                lineHeight: 14,
                marginTop: 2,
                color: dark ? theme.colors.textMuted : '#94a3b8',
              }}
            >
              {(() => {
                const age = ageSince(task.createdAt);
                return age.unit === 'hours'
                  ? t('dashboard.tasks.ageHours', { count: age.count })
                  : t('dashboard.tasks.ageDays', { count: age.count });
              })()}
            </Text>
          </View>
          <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
        </Pressable>
      ))}
    </View>
  );
}
