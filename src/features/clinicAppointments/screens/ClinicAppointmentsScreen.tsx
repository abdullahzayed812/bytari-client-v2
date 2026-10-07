import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, ScrollView, View } from 'react-native';

import { Button, IconButton } from '@/components/actions';
import { Card, Chip, Divider, Icon } from '@/components/content';
import {
  ConfirmationDialog,
  EmptyState,
  ErrorState,
  Loading,
  useToast,
} from '@/components/feedback';
import { Row, SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { BottomSheet } from '@/components/overlays';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useStartConversation } from '@/features/chat/hooks/useChatMutations';
// Deep import (not the barrel) — keeps clinicAppointments ↔ clinicDashboard acyclic.
import { useClinicPermissions } from '@/features/clinicDashboard/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { AppointmentStatusBadge, DateTimeField } from '../components';
import { VISIT_TYPE_ICON, formatAppointmentDateTime } from '../constants';
import {
  useClinicAppointmentAction,
  useClinicAppointments,
  useRemindTodayAppointments,
} from '../hooks';
import {
  APPOINTMENT_STATUS_FILTERS,
  type AppointmentStatus,
  type AppointmentStatusFilter,
  type ClinicAppointment,
} from '../types';

/**
 * Route `/clinic-dashboard/[organizationId]/appointments` — the clinic's
 * incoming appointments (the legacy dashboard's "المواعيد" / "مواعيد اليوم").
 * Lists via `clinic.appointment.read`; confirm / reject / complete appear only
 * with `clinic.appointment.manage` (backend-computed permissions) and are
 * re-checked server-side, which also scopes each appointment to this clinic.
 */
export default function ClinicAppointmentsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('clinicAppointments');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const [filter, setFilter] = useState<AppointmentStatusFilter>('PENDING');
  const status: AppointmentStatus | undefined = filter === 'ALL' ? undefined : filter;
  const q = useClinicAppointments(orgId, status);
  const perms = useClinicPermissions(orgId);
  const canManage = perms?.canManageAppointments ?? false;
  const action = useClinicAppointmentAction(orgId);
  const startChat = useStartConversation();
  const [rejecting, setRejecting] = useState<ClinicAppointment | null>(null);
  const [deleting, setDeleting] = useState<ClinicAppointment | null>(null);
  const [rescheduling, setRescheduling] = useState<ClinicAppointment | null>(null);
  const remindToday = useRemindTodayAppointments(orgId);

  const run = (input: Parameters<typeof action.mutate>[0], message = t('clinic.updated')) =>
    action.mutate(input, {
      onSuccess: () => toast.show({ tone: 'success', message }),
      onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
    });

  const messageOwner = (a: ClinicAppointment) =>
    startChat.mutate(
      { organizationId: orgId, targetUserId: a.petOwnerUserId },
      {
        onSuccess: (conversation) => router.push(Routes.chatThread(conversation.id)),
        onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
      },
    );

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('clinic.title')}
        showBack
        right={
          canManage ? (
            <IconButton
              icon="add"
              variant="soft"
              accessibilityLabel={t('clinic.newCta')}
              onPress={() => router.push(Routes.clinicDashboardAppointmentNew(orgId) as never)}
            />
          ) : undefined
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          alignItems: 'center',
          columnGap: theme.spacing.sm,
          paddingHorizontal: theme.screenPadding,
          paddingVertical: theme.spacing.sm,
        }}
      >
        {APPOINTMENT_STATUS_FILTERS.map((f) => (
          <Chip
            key={f}
            label={f === 'ALL' ? t('filter.all') : t(`status.${f}`)}
            selected={filter === f}
            onPress={() => setFilter(f)}
          />
        ))}
      </ScrollView>

      {perms && !canManage ? (
        <Caption style={{ paddingHorizontal: theme.screenPadding }}>{t('clinic.readOnly')}</Caption>
      ) : null}
      {canManage ? (
        <View style={{ paddingHorizontal: theme.screenPadding }}>
          <Button
            label={t('clinic.remindToday')}
            size="sm"
            variant="outline"
            leftIcon="paper-plane-outline"
            loading={remindToday.isPending}
            disabled={remindToday.isPending}
            onPress={() =>
              remindToday.mutate(undefined, {
                onSuccess: (r) =>
                  toast.show({
                    tone: 'success',
                    message: t('clinic.remindedToday', { count: r.sent }),
                  }),
                onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
              })
            }
          />
        </View>
      ) : null}

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.appointments}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.sm,
            paddingBottom: theme.spacing.huge,
            rowGap: theme.spacing.md,
            flexGrow: 1,
          }}
          onEndReached={() => {
            if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={q.isFetchingNextPage ? <Loading /> : null}
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching && !q.isFetchingNextPage}
              onRefresh={() => void q.refetch()}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title={t('clinic.empty')}
              message={t('clinic.emptyHint')}
            />
          }
          renderItem={({ item }) => (
            <ClinicAppointmentCard
              appointment={item}
              canManage={canManage}
              canOpenAnimal={perms?.canViewAnimals ?? false}
              busy={action.isPending || startChat.isPending}
              onConfirm={() => run({ kind: 'confirm', appointmentId: item.id })}
              onReject={() => setRejecting(item)}
              onComplete={() => run({ kind: 'complete', appointmentId: item.id })}
              onReschedule={() => setRescheduling(item)}
              onRemind={() => run({ kind: 'remind', appointmentId: item.id }, t('clinic.reminded'))}
              onDelete={() => setDeleting(item)}
              onMessageOwner={() => messageOwner(item)}
              onOpenAnimal={() =>
                router.push(Routes.organizationAnimalDetail(orgId, item.animalId))
              }
            />
          )}
        />
      )}

      <ConfirmationDialog
        visible={rejecting !== null}
        title={t('clinic.rejectConfirmTitle')}
        message={t('clinic.rejectConfirmBody')}
        confirmLabel={t('clinic.reject')}
        cancelLabel={t('clinic.cancel')}
        destructive
        loading={action.isPending}
        onConfirm={() => {
          if (rejecting) run({ kind: 'reject', appointmentId: rejecting.id });
          setRejecting(null);
        }}
        onCancel={() => setRejecting(null)}
      />
      <ConfirmationDialog
        visible={deleting !== null}
        title={t('clinic.deleteConfirmTitle')}
        message={t('clinic.deleteConfirmBody')}
        confirmLabel={t('clinic.delete')}
        cancelLabel={t('clinic.cancel')}
        destructive
        loading={action.isPending}
        onConfirm={() => {
          if (deleting) run({ kind: 'delete', appointmentId: deleting.id }, t('clinic.deleted'));
          setDeleting(null);
        }}
        onCancel={() => setDeleting(null)}
      />
      <RescheduleSlotSheet
        appointment={rescheduling}
        submitting={action.isPending}
        onClose={() => setRescheduling(null)}
        onSubmit={(iso) => {
          if (!rescheduling) return;
          action.mutate(
            { kind: 'reschedule', appointmentId: rescheduling.id, proposedScheduledFor: iso },
            {
              onSuccess: () => {
                toast.show({ tone: 'success', message: t('clinic.rescheduled') });
                setRescheduling(null);
              },
              onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
            },
          );
        }}
      />
    </SafeAreaScreen>
  );
}

function ClinicAppointmentCard({
  appointment,
  canManage,
  canOpenAnimal,
  busy,
  onConfirm,
  onReject,
  onComplete,
  onMessageOwner,
  onOpenAnimal,
  onReschedule,
  onRemind,
  onDelete,
}: {
  appointment: ClinicAppointment;
  canManage: boolean;
  canOpenAnimal: boolean;
  busy: boolean;
  onConfirm: () => void;
  onReject: () => void;
  onComplete: () => void;
  onMessageOwner: () => void;
  onOpenAnimal: () => void;
  onReschedule: () => void;
  onRemind: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const { t, i18n } = useTranslation('clinicAppointments');
  const { status } = appointment;
  const canDecide = canManage && (status === 'PENDING' || status === 'RESCHEDULE_PROPOSED');
  const canComplete = canManage && status === 'CONFIRMED';
  const isOpen = status === 'PENDING' || status === 'CONFIRMED' || status === 'RESCHEDULE_PROPOSED';

  return (
    <Card variant="elevated" padding="lg">
      <Row justify="space-between" align="flex-start" gap="md">
        <View style={{ flex: 1, rowGap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {appointment.animal.name}
          </Text>
          <Caption color="textSecondary">
            {[appointment.animal.species, appointment.animal.breed].filter(Boolean).join(' · ')}
          </Caption>
        </View>
        <AppointmentStatusBadge status={status} />
      </Row>

      <View style={{ marginTop: theme.spacing.md, rowGap: theme.spacing.sm }}>
        <Row gap="xs">
          <Icon name="calendar-outline" size="iconSm" color="primary" />
          <Text>{formatAppointmentDateTime(appointment.scheduledFor, i18n.language)}</Text>
        </Row>
        <Row gap="xs">
          <Icon name={VISIT_TYPE_ICON[appointment.visitType]} size="iconSm" color="primary" />
          <Text>{t(`visitType.${appointment.visitType}`)}</Text>
        </Row>
        {appointment.proposedScheduledFor ? (
          <Row gap="xs">
            <Icon name="swap-horizontal-outline" size="iconSm" color="warning" />
            <Text color="warning">
              {formatAppointmentDateTime(appointment.proposedScheduledFor, i18n.language)}
            </Text>
          </Row>
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

      {canDecide || canComplete ? (
        <Row gap="sm" style={{ marginTop: theme.spacing.md }}>
          {canDecide ? (
            <>
              <View style={{ flex: 1 }}>
                <Button label={t('clinic.confirm')} size="sm" disabled={busy} onPress={onConfirm} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label={t('clinic.reject')}
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onPress={onReject}
                />
              </View>
            </>
          ) : null}
          {canComplete ? (
            <View style={{ flex: 1 }}>
              <Button
                label={t('clinic.complete')}
                size="sm"
                leftIcon="checkmark-done-outline"
                disabled={busy}
                onPress={onComplete}
              />
            </View>
          ) : null}
        </Row>
      ) : null}

      {canManage && (isOpen || status === 'COMPLETED') ? (
        <Row gap="sm" style={{ marginTop: theme.spacing.sm }} wrap>
          {isOpen && status !== 'RESCHEDULE_PROPOSED' ? (
            <Button
              label={t('clinic.reschedule')}
              size="sm"
              variant="outline"
              leftIcon="swap-horizontal-outline"
              disabled={busy}
              onPress={onReschedule}
            />
          ) : null}
          {isOpen ? (
            <Button
              label={t('clinic.remind')}
              size="sm"
              variant="ghost"
              leftIcon="notifications-outline"
              disabled={busy}
              onPress={onRemind}
            />
          ) : null}
          {status === 'COMPLETED' ? (
            <Button
              label={t('clinic.delete')}
              size="sm"
              variant="ghost"
              leftIcon="trash-outline"
              disabled={busy}
              onPress={onDelete}
            />
          ) : null}
        </Row>
      ) : null}

      <Row gap="sm" style={{ marginTop: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Button
            label={t('clinic.messageOwner')}
            size="sm"
            variant="ghost"
            leftIcon="chatbubble-ellipses-outline"
            disabled={busy}
            onPress={onMessageOwner}
          />
        </View>
        {canOpenAnimal ? (
          <View style={{ flex: 1 }}>
            <Button
              label={t('clinic.openAnimal')}
              size="sm"
              variant="ghost"
              leftIcon="paw-outline"
              onPress={onOpenAnimal}
            />
          </View>
        ) : null}
      </Row>
    </Card>
  );
}

/** Propose a new date + time (legacy "اقتراح موعد بديل"). */
function RescheduleSlotSheet({
  appointment,
  submitting,
  onClose,
  onSubmit,
}: {
  appointment: ClinicAppointment | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (iso: string) => void;
}) {
  const theme = useTheme();
  const { t, i18n } = useTranslation('clinicAppointments');
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<Date>(new Date());
  const slot = new Date(date);
  slot.setHours(time.getHours(), time.getMinutes(), 0, 0);
  const inPast = slot.getTime() <= Date.now();

  return (
    <BottomSheet
      visible={appointment !== null}
      onClose={onClose}
      title={t('clinic.rescheduleTitle')}
    >
      <View style={{ rowGap: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
          <DateTimeField
            mode="time"
            value={time}
            onChange={setTime}
            display={
              formatAppointmentDateTime(slot.toISOString(), i18n.language).split('، ')[1] ?? ''
            }
            accessibilityLabel={t('book.timeA11y')}
          />
          <DateTimeField
            mode="date"
            value={date}
            onChange={setDate}
            minimumDate={new Date()}
            display={
              formatAppointmentDateTime(slot.toISOString(), i18n.language).split('، ')[0] ?? ''
            }
            accessibilityLabel={t('book.dateA11y')}
          />
        </View>
        {inPast ? <Caption color="danger">{t('book.slotInPast')}</Caption> : null}
        <Button
          label={t('clinic.rescheduleSubmit')}
          loading={submitting}
          disabled={submitting || inPast}
          onPress={() => onSubmit(slot.toISOString())}
        />
      </View>
    </BottomSheet>
  );
}
