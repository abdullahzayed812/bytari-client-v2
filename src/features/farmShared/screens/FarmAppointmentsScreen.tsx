import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Chip, Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { Input, Select } from '@/components/forms';
import { Row, SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Modal } from '@/components/overlays';
import { Caption } from '@/components/typography';
import { Routes } from '@/constants/routes';
import type { FarmAppointmentCategory } from '@/features/farm/types';
import { FARM_APPOINTMENT_CATEGORIES } from '@/features/farm/types';
import { apiErrorMessage } from '@/lib/apiError';
import { devDataEnabled } from '@/lib/env';
import { useTheme } from '@/theme';

import { AppointmentCard, DateFieldInput, isValidIsoDate } from '../components';
import { useCreateFarmAppointment, useFarmAppointments } from '../hooks';

type Scope = 'ALL' | FarmAppointmentCategory;

/** Route `/poultry/[organizationId]/sections/appointments` — المواعيد. */
export default function FarmAppointmentsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const toast = useToast();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const [scope, setScope] = useState<Scope>('ALL');
  const list = useFarmAppointments(orgId, { category: scope === 'ALL' ? undefined : scope });
  const create = useCreateFarmAppointment(orgId);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <SafeAreaScreen>
      <AppHeader title={t('appointments.title')} showBack />

      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.sm }}>
        <Row gap="xs" justify="flex-end">
          <Icon name="options-outline" size="iconSm" color="primary" />
          <Caption color="primary">{t('appointments.filterLabel')}</Caption>
        </Row>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          alignItems: 'flex-start',
          columnGap: theme.spacing.sm,
          paddingHorizontal: theme.screenPadding,
          paddingVertical: theme.spacing.sm,
        }}
      >
        <Chip label={t('appointments.tab.all')} selected={scope === 'ALL'} onPress={() => setScope('ALL')} />
        {FARM_APPOINTMENT_CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={t(`appointments.category.${c}`)}
            selected={scope === c}
            onPress={() => setScope(c)}
          />
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: theme.screenPadding,
          paddingBottom: theme.spacing.huge,
          rowGap: theme.spacing.md,
        }}
      >
        {list.isLoading ? (
          <Loading label={t('common.loading')} />
        ) : list.isError ? (
          <ErrorState error={list.error} onRetry={() => void list.refetch()} />
        ) : list.appointments.length === 0 ? (
          <EmptyState icon="calendar-outline" title={t('appointments.empty')} message={t('appointments.emptyHint')} />
        ) : (
          list.appointments.map((a) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              onPress={() =>
                router.push(Routes.poultryFarmSectionItem(orgId, 'appointments', a.id))
              }
            />
          ))
        )}
      </ScrollView>

      <View style={{ padding: theme.screenPadding }}>
        <Button
          label={t('appointments.addButton')}
          variant="primary"
          fullWidth
          leftIcon="add"
          onPress={() => setFormOpen(true)}
        />
      </View>

      <AddAppointmentDialog
        visible={formOpen}
        loading={create.isPending}
        onCancel={() => setFormOpen(false)}
        onSubmit={(input) =>
          create.mutate(input, {
            onSuccess: () => {
              toast.show({ tone: 'success', message: t('appointments.form.success') });
              setFormOpen(false);
            },
            onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
          })
        }
      />
    </SafeAreaScreen>
  );
}

function AddAppointmentDialog({
  visible,
  loading,
  onSubmit,
  onCancel,
}: {
  visible: boolean;
  loading: boolean;
  onSubmit: (input: {
    title: string;
    description?: string;
    category?: FarmAppointmentCategory;
    scheduledFor: string;
  }) => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  // DEV-ONLY: pre-filled so the dialog doesn't need retyping on every test run.
  const [title, setTitle] = useState(devDataEnabled ? 'زيارة الطبيب البيطري' : '');
  const [description, setDescription] = useState(devDataEnabled ? 'فحص دوري للقطيع' : '');
  const [category, setCategory] = useState<FarmAppointmentCategory | null>(
    devDataEnabled ? 'VET_VISIT' : null,
  );
  const [scheduledFor, setScheduledFor] = useState(
    devDataEnabled ? new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) : '',
  );

  const valid = title.trim().length > 0 && isValidIsoDate(scheduledFor);

  return (
    <Modal visible={visible} onClose={onCancel} title={t('appointments.form.title')} dismissable={!loading}>
      <ScrollView contentContainerStyle={{ rowGap: theme.spacing.md }} keyboardShouldPersistTaps="handled">
        <Input label={t('appointments.form.titleLabel')} value={title} onChangeText={setTitle} />
        <Select<FarmAppointmentCategory>
          label={t('appointments.form.categoryLabel')}
          value={category}
          options={FARM_APPOINTMENT_CATEGORIES.map((c) => ({
            value: c,
            label: t(`appointments.category.${c}`),
          }))}
          onChange={setCategory}
        />
        <DateFieldInput
          label={t('appointments.form.dateLabel')}
          value={scheduledFor}
          onChangeText={setScheduledFor}
        />
        <Input
          label={t('appointments.form.descriptionLabel')}
          multiline
          numberOfLines={3}
          value={description}
          onChangeText={setDescription}
        />
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <Button label={t('common.cancel')} variant="ghost" fullWidth onPress={onCancel} disabled={loading} />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t('appointments.form.submit')}
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading || !valid}
              onPress={() =>
                onSubmit({
                  title: title.trim(),
                  description: description.trim() || undefined,
                  category: category ?? undefined,
                  scheduledFor,
                })
              }
            />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}
