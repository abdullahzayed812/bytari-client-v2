import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button, IconButton } from '@/components/actions';
import { Chip, Icon } from '@/components/content';
import { ErrorState, Loading, useToast } from '@/components/feedback';
import { Input, Select } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { usePublicOrganization } from '@/features/organizations';
import { usePets } from '@/features/pets';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { DateTimeField } from '../components';
import { formatAppointmentDate, formatAppointmentTime } from '../constants';
import { useBookPetOwnerAppointment } from '../hooks';
import { VISIT_TYPES, type VisitType } from '../types';

/** Combine the calendar day of `date` with the clock time of `time`. */
function combine(date: Date, time: Date): Date {
  const out = new Date(date);
  out.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return out;
}

/** Route: `/(app)/clinic-appointments/book/[organizationId]` — "حجز موعد". */
export default function PetOwnerBookAppointmentScreen() {
  const theme = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { t, i18n } = useTranslation('clinicAppointments');
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';
  const locale = i18n.language;

  const clinicQuery = usePublicOrganization(orgId);
  const petsQuery = usePets({ status: 'ACTIVE' });
  const book = useBookPetOwnerAppointment(orgId);

  const now = useMemo(() => new Date(), []);
  const [animalId, setAnimalId] = useState<string | null>(null);
  const [visitType, setVisitType] = useState<VisitType>('FOLLOW_UP');
  const [date, setDate] = useState<Date>(new Date(now.getTime() + 24 * 60 * 60 * 1000));
  const [time, setTime] = useState<Date>(now);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const scheduledFor = combine(date, time);
  const inFuture = scheduledFor.getTime() > Date.now();
  const petMissing = submitted && !animalId;
  const slotInvalid = submitted && !inFuture;
  const serverFieldErrors = book.error ? fieldErrors(book.error) : {};

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace(Routes.organizationDiscoverDetail(orgId));
  };

  const onSubmit = () => {
    setSubmitted(true);
    if (!animalId || !inFuture || book.isPending) return;
    book.mutate(
      {
        animalId,
        visitType,
        scheduledFor: scheduledFor.toISOString(),
        note: note.trim() || undefined,
      },
      {
        onSuccess: (appointment) => {
          toast.show({ tone: 'success', message: t('book.success') });
          router.replace(Routes.petOwnerAppointment(appointment.id));
        },
        onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
      },
    );
  };

  if (clinicQuery.isLoading || petsQuery.isLoading) {
    return (
      <SafeAreaScreen>
        <AppHeader
          title={t('book.title')}
          left={
            <IconButton
              icon="close"
              variant="plain"
              accessibilityLabel={t('book.close')}
              onPress={close}
            />
          }
        />
        <Loading fill />
      </SafeAreaScreen>
    );
  }

  if (clinicQuery.isError || !clinicQuery.data) {
    return (
      <SafeAreaScreen>
        <AppHeader
          title={t('book.title')}
          left={
            <IconButton
              icon="close"
              variant="plain"
              accessibilityLabel={t('book.close')}
              onPress={close}
            />
          }
        />
        <ErrorState error={clinicQuery.error} onRetry={() => void clinicQuery.refetch()} />
      </SafeAreaScreen>
    );
  }

  const pets = petsQuery.pets;

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('book.titleWithClinic', { clinic: clinicQuery.data.name })}
        left={
          <IconButton
            icon="close"
            variant="plain"
            accessibilityLabel={t('book.close')}
            onPress={close}
          />
        }
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: theme.screenPadding,
          paddingBottom: theme.spacing.huge,
          rowGap: theme.spacing.xl,
        }}
      >
        {/* --- pet --- */}
        <View style={{ rowGap: theme.spacing.xs }}>
          <Select<string>
            label={t('book.petLabel')}
            placeholder={t('book.petPlaceholder')}
            value={animalId}
            onChange={setAnimalId}
            error={petMissing ? t('book.petRequired') : serverFieldErrors.animalId}
            options={pets.map((p) => ({
              value: p.id,
              label: `${p.name} (${p.species.toLowerCase()})`,
            }))}
          />
          {pets.length === 0 ? <Caption color="danger">{t('book.noPets')}</Caption> : null}
        </View>

        {/* --- visit type --- */}
        <View style={{ rowGap: theme.spacing.sm }}>
          <Label>{t('book.visitTypeLabel')}</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {VISIT_TYPES.map((v) => (
              <Chip
                key={v}
                label={t(`visitType.${v}`)}
                selected={visitType === v}
                onPress={() => setVisitType(v)}
              />
            ))}
          </View>
        </View>

        {/* --- preferred date & time --- */}
        <View style={{ rowGap: theme.spacing.sm }}>
          <Label>{t('book.slotLabel')}</Label>
          <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
            <DateTimeField
              mode="time"
              value={time}
              onChange={setTime}
              display={formatAppointmentTime(scheduledFor.toISOString(), locale)}
              accessibilityLabel={t('book.timeA11y')}
              error={slotInvalid ? ' ' : undefined}
            />
            <DateTimeField
              mode="date"
              value={date}
              onChange={setDate}
              minimumDate={now}
              display={formatAppointmentDate(scheduledFor.toISOString(), locale)}
              accessibilityLabel={t('book.dateA11y')}
              error={slotInvalid ? ' ' : undefined}
            />
          </View>
          {slotInvalid ? <Caption color="danger">{t('book.slotInPast')}</Caption> : null}
        </View>

        {/* --- note --- */}
        <Input
          label={t('book.noteLabel')}
          placeholder={t('book.notePlaceholder')}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
          maxLength={1000}
        />
      </ScrollView>

      <View
        style={{
          flexDirection: 'row',
          gap: theme.spacing.md,
          padding: theme.screenPadding,
          borderTopWidth: theme.sizes.hairline,
          borderTopColor: theme.colors.divider,
        }}
      >
        <View style={{ flex: 1 }}>
          <Button
            label={t('book.cancel')}
            variant="outline"
            fullWidth
            onPress={close}
            disabled={book.isPending}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={t('book.submit')}
            variant="primary"
            fullWidth
            leftIcon="paper-plane-outline"
            loading={book.isPending}
            disabled={book.isPending || pets.length === 0}
            onPress={onSubmit}
          />
        </View>
      </View>

      {book.isError && !Object.keys(serverFieldErrors).length ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingBottom: theme.spacing.md }}>
          <Text color="danger" variant="caption">
            <Icon name="alert-circle-outline" size="iconXs" color="danger" />{' '}
            {apiErrorMessage(book.error)}
          </Text>
        </View>
      ) : null}
    </SafeAreaScreen>
  );
}
