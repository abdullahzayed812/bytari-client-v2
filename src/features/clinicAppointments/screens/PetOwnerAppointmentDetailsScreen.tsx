import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { Button, IconButton } from '@/components/actions';
import { Card, Divider, Icon } from '@/components/content';
import { ConfirmationDialog, ErrorState, Loading, useToast } from '@/components/feedback';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { AppointmentStatusBadge } from '../components';
import { formatAppointmentDateTime, HISTORY_KIND_ICON, VISIT_TYPE_ICON } from '../constants';
import {
  useCancelPetOwnerAppointment,
  usePetOwnerAppointment,
  usePetOwnerAppointmentHistory,
  useRespondToReschedule,
} from '../hooks';
import type { AppointmentHistoryEntry } from '../types';

/** Route: `/(app)/clinic-appointments/[appointmentId]` — appointment details. */
export default function PetOwnerAppointmentDetailsScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { t, i18n } = useTranslation('clinicAppointments');
  const { t: tc } = useTranslation('common');
  const locale = i18n.language;
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const id = appointmentId ?? '';

  const q = usePetOwnerAppointment(id);
  const historyQuery = usePetOwnerAppointmentHistory(id);
  const cancel = useCancelPetOwnerAppointment(id);
  const respond = useRespondToReschedule(id);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (q.isLoading) {
    return (
      <ScrollScreen padded={false}>
        <AppHeader title={t('detail.title')} showBack />
        <Loading fill />
      </ScrollScreen>
    );
  }
  if (q.isError || !q.data) {
    return (
      <ScrollScreen>
        <AppHeader title={t('detail.title')} showBack />
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </ScrollScreen>
    );
  }

  const a = q.data;
  const isOpen =
    a.status === 'PENDING' || a.status === 'CONFIRMED' || a.status === 'RESCHEDULE_PROPOSED';

  const onCancel = () => {
    setConfirmCancel(false);
    cancel.mutate(undefined, {
      onSuccess: () => toast.show({ tone: 'success', message: t('detail.cancelled') }),
      onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
    });
  };

  const onRespond = (accept: boolean) => {
    respond.mutate(accept, {
      onSuccess: () =>
        toast.show({
          tone: 'success',
          message: accept ? t('detail.rescheduleAccepted') : t('detail.rescheduleDeclined'),
        }),
      onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
    });
  };

  return (
    <ScrollScreen padded={false}>
      <AppHeader title={t('detail.title')} showBack />

      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.lg }}>
        <Section>
          <Card padding="lg">
            <Row justify="space-between" align="flex-start" gap="md">
              <Heading level={3} style={{ flex: 1 }}>
                {a.organization.name}
              </Heading>
              <AppointmentStatusBadge status={a.status} />
            </Row>

            <View style={{ marginTop: theme.spacing.lg, rowGap: theme.spacing.md }}>
              <DetailRow icon="paw-outline" label={t('detail.pet')}>
                {`${a.animal.name} (${a.animal.species.toLowerCase()})`}
              </DetailRow>
              <Divider spacing="none" />
              <DetailRow icon={VISIT_TYPE_ICON[a.visitType]} label={t('detail.visitType')}>
                {t(`visitType.${a.visitType}`)}
              </DetailRow>
              <Divider spacing="none" />
              <DetailRow icon="calendar-outline" label={t('detail.slot')}>
                {formatAppointmentDateTime(a.scheduledFor, locale)}
              </DetailRow>
              {a.note ? (
                <>
                  <Divider spacing="none" />
                  <DetailRow icon="document-text-outline" label={t('detail.note')}>
                    {a.note}
                  </DetailRow>
                </>
              ) : null}
              {a.decisionReason ? (
                <>
                  <Divider spacing="none" />
                  <DetailRow icon="chatbox-ellipses-outline" label={t('detail.decisionReason')}>
                    {a.decisionReason}
                  </DetailRow>
                </>
              ) : null}
            </View>
          </Card>
        </Section>

        {/* --- clinic proposed a new slot --- */}
        {a.status === 'RESCHEDULE_PROPOSED' && a.proposedScheduledFor ? (
          <Section>
            <Card padding="lg" variant="accent">
              <Row gap="xs">
                <Icon name="time-outline" size="iconSm" color="primary" />
                <Text variant="bodyStrong">{t('detail.proposedTitle')}</Text>
              </Row>
              <Text style={{ marginTop: theme.spacing.sm }}>
                {formatAppointmentDateTime(a.proposedScheduledFor, locale)}
              </Text>
              <Row gap="md" style={{ marginTop: theme.spacing.lg }}>
                <View style={{ flex: 1 }}>
                  <Button
                    label={t('detail.declineProposal')}
                    variant="outline"
                    fullWidth
                    disabled={respond.isPending}
                    onPress={() => onRespond(false)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label={t('detail.acceptProposal')}
                    variant="primary"
                    fullWidth
                    loading={respond.isPending}
                    onPress={() => onRespond(true)}
                  />
                </View>
              </Row>
            </Card>
          </Section>
        ) : null}

        {/* --- clinic contact --- */}
        {a.organization.phone || a.organization.address ? (
          <Section>
            <Card padding="lg">
              <Text variant="bodyStrong">{t('detail.contactTitle')}</Text>
              <View style={{ marginTop: theme.spacing.md, rowGap: theme.spacing.md }}>
                {a.organization.phone ? (
                  <ContactRow
                    icon="call-outline"
                    value={a.organization.phone}
                    onPress={() => void Linking.openURL(`tel:${a.organization.phone}`)}
                  />
                ) : null}
                {a.organization.address ? (
                  <ContactRow
                    icon="location-outline"
                    value={a.organization.address}
                    onPress={() =>
                      void Linking.openURL(
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          a.organization.address as string,
                        )}`,
                      )
                    }
                  />
                ) : null}
              </View>
            </Card>
          </Section>
        ) : null}

        {/* --- history timeline --- */}
        <Section>
          <Card padding="lg">
            <Text variant="bodyStrong">{t('detail.historyTitle')}</Text>
            <View style={{ marginTop: theme.spacing.md, rowGap: theme.spacing.md }}>
              {historyQuery.isLoading ? (
                <Loading label={t('list.loading')} />
              ) : historyQuery.data && historyQuery.data.length > 0 ? (
                historyQuery.data.map((entry) => (
                  <HistoryRow key={entry.id} entry={entry} locale={locale} />
                ))
              ) : (
                <Caption color="textMuted">{t('detail.historyEmpty')}</Caption>
              )}
            </View>
          </Card>
        </Section>

        {isOpen ? (
          <Section>
            <Button
              label={t('detail.cancelCta')}
              variant="outline"
              leftIcon="close-circle-outline"
              fullWidth
              loading={cancel.isPending}
              onPress={() => setConfirmCancel(true)}
            />
          </Section>
        ) : null}
      </View>

      <ConfirmationDialog
        visible={confirmCancel}
        title={t('detail.cancelConfirmTitle')}
        message={t('detail.cancelConfirmMessage')}
        confirmLabel={t('detail.cancelCta')}
        cancelLabel={tc('actions.back')}
        destructive
        loading={cancel.isPending}
        onConfirm={onCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </ScrollScreen>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  label: string;
  children: string;
}) {
  return (
    <Row justify="space-between" align="flex-start" gap="lg">
      <Row gap="xs" style={{ flexShrink: 0 }}>
        <Icon name={icon} size="iconSm" color="primary" />
        <Text variant="label" color="textSecondary">
          {label}
        </Text>
      </Row>
      <Text style={{ flex: 1, textAlign: 'left' }}>{children}</Text>
    </Row>
  );
}

function ContactRow({
  icon,
  value,
  onPress,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  value: string;
  onPress: () => void;
}) {
  return (
    <Row justify="space-between" gap="md">
      <Text style={{ flex: 1 }}>{value}</Text>
      <IconButton icon={icon} variant="soft" accessibilityLabel={value} onPress={onPress} />
    </Row>
  );
}

function HistoryRow({ entry, locale }: { entry: AppointmentHistoryEntry; locale: string }) {
  const { t } = useTranslation('clinicAppointments');
  return (
    <Row gap="sm" align="flex-start">
      <Icon
        name={HISTORY_KIND_ICON[entry.kind] ?? 'ellipse-outline'}
        size="iconSm"
        color="primary"
      />
      <View style={{ flex: 1, rowGap: 2 }}>
        <Text variant="label">{t(`historyKind.${entry.kind}`)}</Text>
        {entry.toScheduledFor ? (
          <Caption color="textSecondary">
            {formatAppointmentDateTime(entry.toScheduledFor, locale)}
          </Caption>
        ) : null}
        {entry.reason ? <Caption color="textMuted">{entry.reason}</Caption> : null}
        <Caption color="textMuted" style={{ marginTop: 2 }}>
          {formatAppointmentDateTime(entry.createdAt, locale)}
        </Caption>
      </View>
    </Row>
  );
}
