import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Avatar, Card, Divider, Icon } from '@/components/content';
import { Row } from '@/components/layout';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { formatAppointmentDateTime } from '../constants';
import type { ClinicAppointment } from '../types';

import { AppointmentStatusBadge } from './AppointmentStatusBadge';

/** One appointment row on the Pet Owner list — matches the reference card. */
export function AppointmentCard({
  appointment,
  onPress,
}: {
  appointment: ClinicAppointment;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const { t, i18n } = useTranslation('clinicAppointments');
  const locale = i18n.language;

  return (
    <Card variant="elevated" padding="lg" onPress={onPress}>
      <Row justify="space-between" align="flex-start" gap="md">
        <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
          {appointment.organization.name}
        </Text>
        <AppointmentStatusBadge status={appointment.status} />
      </Row>

      <View
        style={{
          marginTop: theme.spacing.md,
          padding: theme.spacing.md,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.surfaceMuted,
        }}
      >
        <Row justify="space-between" align="center" gap="md">
          <View style={{ flex: 1, rowGap: 2 }}>
            <Text variant="bodyStrong">{appointment.animal.name}</Text>
            <Caption color="textSecondary">{appointment.animal.species}</Caption>
          </View>
          <Avatar name={appointment.animal.name} size="avatarMd" />
        </Row>
      </View>

      <View style={{ marginTop: theme.spacing.md, rowGap: theme.spacing.sm }}>
        <InfoLine icon="calendar-outline" label={t('card.slot')}>
          {formatAppointmentDateTime(appointment.scheduledFor, locale)}
        </InfoLine>
        {appointment.organization.phone ? (
          <InfoLine icon="call-outline">{appointment.organization.phone}</InfoLine>
        ) : null}
        {appointment.organization.address ? (
          <InfoLine icon="location-outline">{appointment.organization.address}</InfoLine>
        ) : null}
      </View>

      {appointment.note ? (
        <>
          <Divider spacing="md" />
          <Text color="textSecondary" numberOfLines={3}>
            {appointment.note}
          </Text>
        </>
      ) : null}

      <Caption color="textMuted" style={{ marginTop: theme.spacing.sm }}>
        {t('card.requestedByYou')}
      </Caption>
    </Card>
  );
}

function InfoLine({
  icon,
  label,
  children,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  label?: string;
  children: string;
}) {
  return (
    <Row justify="space-between" align="center" gap="md">
      <Row gap="xs" style={{ flexShrink: 0 }}>
        <Icon name={icon} size="iconSm" color="primary" />
        {label ? (
          <Text variant="label" color="textSecondary">
            {label}
          </Text>
        ) : null}
      </Row>
      <Text style={{ flex: 1, textAlign: 'left' }} numberOfLines={2}>
        {children}
      </Text>
    </Row>
  );
}
