import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Badge, Card, Icon } from '@/components/content';
import { Row } from '@/components/layout';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { displayDateOnly, recordedByThisClinic, todayIso } from '../constants';
import type { AnimalReminder } from '../types';

/** One reminder (legacy "التذكيرات" card): title, date, type, status, description. */
export function ReminderCard({
  reminder,
  organizationId,
  footer,
}: {
  reminder: AnimalReminder;
  organizationId?: string;
  /** Action row (the creating clinic: edit / complete / notify / delete). Owners get none. */
  footer?: React.ReactNode;
}) {
  const theme = useTheme();
  const { t } = useTranslation('medical');
  const overdue = !reminder.isCompleted && reminder.reminderDate < todayIso();
  const mine = recordedByThisClinic(reminder, organizationId);

  return (
    <Card variant="outlined" padding="md">
      <Row gap="sm" align="center">
        <Icon name="notifications-outline" size="iconSm" color="warning" />
        <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
          {reminder.title}
        </Text>
        <Badge
          label={reminder.isCompleted ? t('reminders.statusDone') : t('reminders.statusPending')}
          tone={reminder.isCompleted ? 'success' : 'warning'}
          size="sm"
        />
        {overdue ? <Badge label={t('reminders.overdue')} tone="danger" size="sm" /> : null}
      </Row>
      <View style={{ marginTop: theme.spacing.xs, rowGap: 2 }}>
        <Caption>
          {t('reminders.fieldDate')}: {displayDateOnly(reminder.reminderDate)} ·{' '}
          {t(`reminders.type.${reminder.reminderType}`)}
        </Caption>
        {reminder.description ? <Text numberOfLines={3}>{reminder.description}</Text> : null}
        {organizationId ? (
          <Caption color="textMuted">
            {mine ? t('records.recordedHere') : t('records.recordedElsewhere')}
          </Caption>
        ) : null}
      </View>
      {footer ? <View style={{ marginTop: theme.spacing.sm }}>{footer}</View> : null}
    </Card>
  );
}
