import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Badge, Card, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import type { FarmAppointment } from '@/features/farm/types';
import { useTheme } from '@/theme';
import { formatDate, formatWeekday } from '@/utils';

import { APPOINTMENT_CATEGORY_TONE } from '../constants';

export function AppointmentCard({
  appointment,
  onPress,
}: {
  appointment: FarmAppointment;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('poultry');

  return (
    <Card variant="outlined" padding="md" onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
        <View style={{ alignItems: 'center', rowGap: 2, minWidth: 64 }}>
          <Icon name="calendar-outline" size="iconSm" color="primary" />
          <Text variant="bodyMedium">{formatWeekday(appointment.scheduledFor)}</Text>
          <Caption>{formatDate(appointment.scheduledFor)}</Caption>
        </View>
        <View style={{ flex: 1, rowGap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {appointment.title}
          </Text>
          {appointment.description ? (
            <Caption numberOfLines={2}>{appointment.description}</Caption>
          ) : null}
        </View>
        <Badge
          label={t(`appointments.category.${appointment.category}`)}
          tone={APPOINTMENT_CATEGORY_TONE[appointment.category] ?? 'neutral'}
          size="sm"
        />
      </View>
    </Card>
  );
}
