import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Chip, Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { Input, Select } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Modal } from '@/components/overlays';
import { Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { devDataEnabled } from '@/lib/env';
import { useTheme } from '@/theme';

import { DateFieldInput, HealthEventCard, isValidIsoDate } from '../components';
import { useCreateHealthEvent, useHealthEvents, usePoultryFlocks } from '../hooks';
import type { PoultryHealthEventKind, PoultryHealthEventStatus } from '../types';
import { POULTRY_HEALTH_EVENT_KINDS, POULTRY_HEALTH_EVENT_STATUSES } from '../types';

type Scope = 'ALL' | PoultryHealthEventKind;

/** Route `/poultry/[organizationId]/sections/treatments` — العلاجات واللقاحات. */
export default function TreatmentsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const activeFlocks = usePoultryFlocks(orgId, { status: 'ACTIVE', pageSize: 1 });
  const flock = activeFlocks.flocks[0];

  const [scope, setScope] = useState<Scope>('ALL');
  const events = useHealthEvents(
    orgId,
    flock?.id,
    { kind: scope === 'ALL' ? undefined : scope },
    { enabled: Boolean(flock) },
  );
  const create = useCreateHealthEvent(orgId, flock?.id ?? '');
  const [formOpen, setFormOpen] = useState(false);

  const vaccinations = useMemo(
    () => events.events.filter((e) => e.kind === 'VACCINATION'),
    [events.events],
  );
  const treatments = useMemo(
    () => events.events.filter((e) => e.kind === 'TREATMENT'),
    [events.events],
  );

  return (
    <SafeAreaScreen>
      <AppHeader title={t('health.title')} showBack />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          alignItems: 'flex-start',
          columnGap: theme.spacing.sm,
          paddingHorizontal: theme.screenPadding,
          paddingTop: theme.spacing.sm,
        }}
      >
        <Chip
          label={t('health.tab.all')}
          selected={scope === 'ALL'}
          onPress={() => setScope('ALL')}
        />
        <Chip
          label={t('health.tab.vaccinations')}
          selected={scope === 'VACCINATION'}
          onPress={() => setScope('VACCINATION')}
        />
        <Chip
          label={t('health.tab.treatments')}
          selected={scope === 'TREATMENT'}
          onPress={() => setScope('TREATMENT')}
        />
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: theme.screenPadding,
          paddingBottom: theme.spacing.huge,
          rowGap: theme.spacing.lg,
        }}
      >
        {!flock ? (
          <EmptyState
            icon="medkit-outline"
            title={t('batch.emptyTitle')}
            message={t('batch.emptyBody')}
          />
        ) : events.isLoading ? (
          <Loading label={t('common.loading')} />
        ) : events.isError ? (
          <ErrorState error={events.error} onRetry={() => void events.refetch()} />
        ) : events.events.length === 0 ? (
          <EmptyState
            icon="medkit-outline"
            title={t('health.empty')}
            message={t('health.emptyHint')}
          />
        ) : (
          <>
            {(scope === 'ALL' || scope === 'VACCINATION') && vaccinations.length > 0 ? (
              <View style={{ rowGap: theme.spacing.sm }}>
                <SectionTitle
                  icon="shield-checkmark-outline"
                  label={t('health.vaccinationsSection')}
                />
                {vaccinations.map((e) => (
                  <HealthEventCard
                    key={e.id}
                    event={e}
                    onPress={() =>
                      router.push({
                        pathname: Routes.poultryFarmSectionItem(orgId, 'treatments', e.id) as never,
                        params: { flockId: flock?.id },
                      })
                    }
                  />
                ))}
              </View>
            ) : null}
            {(scope === 'ALL' || scope === 'TREATMENT') && treatments.length > 0 ? (
              <View style={{ rowGap: theme.spacing.sm }}>
                <SectionTitle icon="medkit-outline" label={t('health.treatmentsSection')} />
                {treatments.map((e) => (
                  <HealthEventCard
                    key={e.id}
                    event={e}
                    onPress={() =>
                      router.push({
                        pathname: Routes.poultryFarmSectionItem(orgId, 'treatments', e.id) as never,
                        params: { flockId: flock?.id },
                      })
                    }
                  />
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {flock ? (
        <View style={{ padding: theme.screenPadding }}>
          <Button
            label={t('health.addButton')}
            variant="primary"
            fullWidth
            leftIcon="add"
            onPress={() => setFormOpen(true)}
          />
        </View>
      ) : null}

      <AddHealthEventDialog
        visible={formOpen}
        loading={create.isPending}
        onCancel={() => setFormOpen(false)}
        onSubmit={(input) =>
          create.mutate(input, {
            onSuccess: () => {
              toast.show({ tone: 'success', message: t('health.form.success') });
              setFormOpen(false);
            },
            onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
          })
        }
      />
    </SafeAreaScreen>
  );
}

function SectionTitle({
  icon,
  label,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  label: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}>
      <Icon name={icon} size="iconSm" color="primary" />
      <Text variant="subtitle" weight="bold">
        {label}
      </Text>
    </View>
  );
}

interface HealthEventFormValues {
  kind: PoultryHealthEventKind;
  name: string;
  medication?: string;
  dose?: string;
  eventDate: string;
  casesCount?: number;
  coverageCount?: number;
  nextDueDate?: string;
  status?: PoultryHealthEventStatus;
  notes?: string;
}

function AddHealthEventDialog({
  visible,
  loading,
  onSubmit,
  onCancel,
}: {
  visible: boolean;
  loading: boolean;
  onSubmit: (input: HealthEventFormValues) => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  // DEV-ONLY: pre-filled so the dialog doesn't need retyping on every test run.
  const [kind, setKind] = useState<PoultryHealthEventKind | null>(
    devDataEnabled ? 'VACCINATION' : null,
  );
  const [name, setName] = useState(devDataEnabled ? 'لقاح النيوكاسل' : '');
  const [medication, setMedication] = useState(devDataEnabled ? 'أموكسيسيلين' : '');
  const [dose, setDose] = useState(devDataEnabled ? '0.5 مل لكل طائر' : '');
  const [eventDate, setEventDate] = useState(
    devDataEnabled ? new Date().toISOString().slice(0, 10) : '',
  );
  const [casesCount, setCasesCount] = useState(devDataEnabled ? '50' : '');
  const [coverageCount, setCoverageCount] = useState(devDataEnabled ? '5000' : '');
  const [nextDueDate, setNextDueDate] = useState(
    devDataEnabled ? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) : '',
  );
  const [status, setStatus] = useState<PoultryHealthEventStatus | null>(
    devDataEnabled ? 'DONE' : null,
  );
  const [notes, setNotes] = useState(devDataEnabled ? 'تم التنفيذ دون مضاعفات' : '');

  const valid = kind !== null && name.trim().length > 0 && isValidIsoDate(eventDate);

  return (
    <Modal
      visible={visible}
      onClose={onCancel}
      title={t('health.form.title')}
      dismissable={!loading}
    >
      <ScrollView
        contentContainerStyle={{ rowGap: theme.spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        <Select<PoultryHealthEventKind>
          label={t('health.form.kindLabel')}
          value={kind}
          options={POULTRY_HEALTH_EVENT_KINDS.map((k) => ({
            value: k,
            label: t(`health.kind.${k}`),
          }))}
          onChange={setKind}
        />
        <Input label={t('health.form.nameLabel')} value={name} onChangeText={setName} />
        <DateFieldInput
          label={t('health.form.dateLabel')}
          value={eventDate}
          onChangeText={setEventDate}
        />
        {kind === 'VACCINATION' ? (
          <>
            <Input label={t('health.form.doseLabel')} value={dose} onChangeText={setDose} />
            <Input
              label={t('health.form.coverageCountLabel')}
              keyboardType="number-pad"
              value={coverageCount}
              onChangeText={setCoverageCount}
            />
            <DateFieldInput
              label={t('health.form.nextDueLabel')}
              value={nextDueDate}
              onChangeText={setNextDueDate}
            />
          </>
        ) : null}
        {kind === 'TREATMENT' ? (
          <>
            <Input
              label={t('health.form.medicationLabel')}
              value={medication}
              onChangeText={setMedication}
            />
            <Input
              label={t('health.form.casesCountLabel')}
              keyboardType="number-pad"
              value={casesCount}
              onChangeText={setCasesCount}
            />
            <Select<PoultryHealthEventStatus>
              label={t('health.statusLabel')}
              value={status}
              options={POULTRY_HEALTH_EVENT_STATUSES.map((s) => ({
                value: s,
                label: t(`health.status.${s}`),
              }))}
              onChange={setStatus}
            />
          </>
        ) : null}
        <Input
          label={t('health.form.notesLabel')}
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
        />

        <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <Button
              label={t('common.cancel')}
              variant="ghost"
              fullWidth
              onPress={onCancel}
              disabled={loading}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t('health.form.submit')}
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading || !valid}
              onPress={() =>
                onSubmit({
                  kind: kind as PoultryHealthEventKind,
                  name: name.trim(),
                  medication: medication.trim() || undefined,
                  dose: dose.trim() || undefined,
                  eventDate,
                  casesCount: casesCount ? Number(casesCount) : undefined,
                  coverageCount: coverageCount ? Number(coverageCount) : undefined,
                  nextDueDate: nextDueDate.trim() || undefined,
                  status: status ?? undefined,
                  notes: notes.trim() || undefined,
                })
              }
            />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}
