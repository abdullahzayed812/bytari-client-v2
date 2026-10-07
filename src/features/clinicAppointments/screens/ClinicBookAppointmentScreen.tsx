import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Chip } from '@/components/content';
import { Alert, useToast } from '@/components/feedback';
import { Input } from '@/components/forms';
import { Row, SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label } from '@/components/typography';
// Deep import (not the barrel) — keeps clinicAppointments ↔ animals acyclic.
import { ClinicAnimalPicker } from '@/features/animals/components/ClinicAnimalPicker';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { DateTimeField } from '../components';
import { formatAppointmentDate, formatAppointmentTime } from '../constants';
import { useCreateClinicAppointment } from '../hooks';
import { VISIT_TYPES, type VisitType } from '../types';

function combine(date: Date, time: Date): Date {
  const out = new Date(date);
  out.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return out;
}

/**
 * Route `/clinic-dashboard/[organizationId]/appointments-new[?animalId=]` —
 * legacy clinic "إضافة موعد": the clinic books a visit for one of ITS animals
 * (pick the animal unless given), visit type, date + time, note. The backend
 * requires the clinic's ACTIVE grant, attaches the CURRENT owner, and creates
 * it CONFIRMED (legacy behaviour); the owner is notified.
 */
export default function ClinicBookAppointmentScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation('clinicAppointments');
  const toast = useToast();
  const params = useLocalSearchParams<{ organizationId: string; animalId?: string }>();
  const orgId = params.organizationId ?? '';
  const [animalId, setAnimalId] = useState<string | undefined>(params.animalId || undefined);
  const now = new Date();
  const [visitType, setVisitType] = useState<VisitType>('CHECKUP');
  const [date, setDate] = useState<Date>(new Date(now.getTime() + 24 * 60 * 60 * 1000));
  const [time, setTime] = useState<Date>(now);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const create = useCreateClinicAppointment(orgId);

  const scheduledFor = combine(date, time);
  const inPast = scheduledFor.getTime() <= Date.now();

  if (!animalId) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('clinic.pickAnimal')} showBack />
        <ClinicAnimalPicker
          organizationId={orgId}
          placeholder={t('clinic.searchAnimal')}
          emptyTitle={t('clinic.noAnimals')}
          onPick={(g) => setAnimalId(g.animalId)}
        />
      </SafeAreaScreen>
    );
  }

  const submit = () => {
    setError(null);
    if (inPast) return;
    create.mutate(
      {
        animalId,
        visitType,
        scheduledFor: scheduledFor.toISOString(),
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.show({ tone: 'success', message: t('clinic.created') });
          router.back();
        },
        onError: (e) => setError(apiErrorMessage(e)),
      },
    );
  };

  return (
    <SafeAreaScreen>
      <AppHeader title={t('clinic.newTitle')} showBack />
      <ScrollView
        contentContainerStyle={{ padding: theme.screenPadding, rowGap: theme.spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        {error ? <Alert tone="danger" message={error} /> : null}
        <View style={{ rowGap: theme.spacing.sm }}>
          <Label>{t('book.visitTypeLabel')}</Label>
          <Row gap="sm" wrap>
            {VISIT_TYPES.map((v) => (
              <Chip
                key={v}
                label={t(`visitType.${v}`)}
                selected={visitType === v}
                onPress={() => setVisitType(v)}
              />
            ))}
          </Row>
        </View>
        <View style={{ rowGap: theme.spacing.sm }}>
          <Label>{t('book.slotLabel')}</Label>
          <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            <DateTimeField
              mode="time"
              value={time}
              onChange={setTime}
              display={formatAppointmentTime(scheduledFor.toISOString(), i18n.language)}
              accessibilityLabel={t('book.timeA11y')}
              error={inPast ? ' ' : undefined}
            />
            <DateTimeField
              mode="date"
              value={date}
              onChange={setDate}
              minimumDate={now}
              display={formatAppointmentDate(scheduledFor.toISOString(), i18n.language)}
              accessibilityLabel={t('book.dateA11y')}
              error={inPast ? ' ' : undefined}
            />
          </View>
          {inPast ? <Caption color="danger">{t('book.slotInPast')}</Caption> : null}
        </View>
        <Input
          label={t('book.noteLabel')}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
          maxLength={1000}
        />
        <Button
          label={t('clinic.submit')}
          fullWidth
          loading={create.isPending}
          disabled={create.isPending || inPast}
          onPress={submit}
        />
      </ScrollView>
    </SafeAreaScreen>
  );
}
