import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Card, Chip, Icon } from '@/components/content';
import { ErrorState, Loading, useToast } from '@/components/feedback';
import { Input } from '@/components/forms';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Modal } from '@/components/overlays';
import { Caption, Text } from '@/components/typography';
import { orgCapabilities, useOrganization } from '@/features/organizations';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { FarmRecordFooter } from '../components/FarmRecordFooter';
import { HEALTH_EVENT_STATUS_TONE } from '../constants';
import {
  FARM_HEALTH_EVENT_STATUSES,
  useDeleteFarmHealthEvent,
  useFarmHealthEventRecord,
  useUpdateFarmHealthEvent,
  type FarmHealthEventRecord,
  type FarmHealthEventStatus,
  type FarmRecordScope,
} from '../records';

/**
 * One treatment / vaccination ("العلاجات والتحصينات") for any farm type —
 * full detail, status change, edit, delete and "أضيف بواسطة". Route params:
 * `organizationId`, `itemId`, and the batch as `flockId` or `batchId`.
 */
export default function FarmHealthEventDetailScreen({ scope }: { scope: FarmRecordScope }) {
  const theme = useTheme();
  const { t } = useTranslation('farm');
  const toast = useToast();
  const params = useLocalSearchParams<{
    organizationId: string;
    itemId: string;
    flockId?: string;
    batchId?: string;
  }>();
  const orgId = params.organizationId ?? '';
  const batchId = params.flockId ?? params.batchId ?? '';
  const { isAdmin } = useCapabilities();
  const org = useOrganization(orgId);
  const farmCaps = orgCapabilities(org.data?.myRole, isAdmin);
  const canManage = farmCaps.canManageFarmPoultry;

  const q = useFarmHealthEventRecord(scope, orgId, batchId, params.itemId);
  const update = useUpdateFarmHealthEvent(scope, orgId, batchId);
  const remove = useDeleteFarmHealthEvent(scope, orgId, batchId);
  const [editing, setEditing] = useState(false);
  const ev = q.data;

  const setStatus = (status: FarmHealthEventStatus): void => {
    if (!ev || ev.status === status) return;
    update.mutate(
      { id: ev.id, body: { status } },
      {
        onSuccess: () => toast.show({ tone: 'success', message: t('records.updated') }),
        onError: (e) => toast.show({ tone: 'danger', message: apiErrorMessage(e) }),
      },
    );
  };

  return (
    <ScrollScreen>
      <AppHeader title={t('records.healthTitle')} showBack />
      {q.isLoading ? (
        <Loading fill />
      ) : q.isError || !ev ? (
        <Section spacing="lg">
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </Section>
      ) : (
        <Section spacing="lg">
          <Card variant="outlined" padding="lg" style={{ rowGap: theme.spacing.lg }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}
            >
              <Icon
                name={ev.kind === 'VACCINATION' ? 'shield-checkmark-outline' : 'medkit-outline'}
                size="iconLg"
                color="primary"
              />
              <View style={{ flex: 1, rowGap: 2 }}>
                <Text variant="heading">{ev.name}</Text>
                <Caption>{t(`records.kind.${ev.kind}`)}</Caption>
              </View>
              <Badge
                label={t(`records.healthStatus.${ev.status}`)}
                tone={HEALTH_EVENT_STATUS_TONE[ev.status]}
                size="sm"
              />
            </View>

            {canManage ? (
              <View style={{ rowGap: theme.spacing.xs }}>
                <Caption>{t('records.changeStatus')}</Caption>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                  {FARM_HEALTH_EVENT_STATUSES.map((s) => (
                    <Chip
                      key={s}
                      label={t(`records.healthStatus.${s}`)}
                      selected={ev.status === s}
                      onPress={() => setStatus(s)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            <Row label={t('records.eventDate')} value={formatDate(ev.eventDate)} />
            {ev.medication ? <Row label={t('records.medication')} value={ev.medication} /> : null}
            {ev.dose ? <Row label={t('records.dose')} value={ev.dose} /> : null}
            {ev.casesCount != null ? (
              <Row label={t('records.casesCount')} value={String(ev.casesCount)} />
            ) : null}
            {ev.coverageCount != null ? (
              <Row label={t('records.coverageCount')} value={String(ev.coverageCount)} />
            ) : null}
            {ev.nextDueDate ? (
              <Row label={t('records.nextDueDate')} value={formatDate(ev.nextDueDate)} />
            ) : null}
            {ev.notes ? (
              <View style={{ rowGap: 2 }}>
                <Caption>{t('records.notes')}</Caption>
                <Text variant="body">{ev.notes}</Text>
              </View>
            ) : null}

            <FarmRecordFooter
              createdBy={ev.createdBy}
              canManage={canManage}
              canDelete={farmCaps.canDeleteFarmRecords}
              onEdit={() => setEditing(true)}
              deleting={remove.isPending}
              onDelete={() =>
                remove.mutate(ev.id, {
                  onSuccess: () => {
                    toast.show({ tone: 'success', message: t('records.deleted') });
                    router.back();
                  },
                  onError: (e) => toast.show({ tone: 'danger', message: apiErrorMessage(e) }),
                })
              }
            />
          </Card>
          {editing ? (
            <HealthEditModal
              ev={ev}
              saving={update.isPending}
              onClose={() => setEditing(false)}
              onSave={(body) =>
                update.mutate(
                  { id: ev.id, body },
                  {
                    onSuccess: () => {
                      setEditing(false);
                      toast.show({ tone: 'success', message: t('records.updated') });
                    },
                    onError: (e) => toast.show({ tone: 'danger', message: apiErrorMessage(e) }),
                  },
                )
              }
            />
          ) : null}
        </Section>
      )}
    </ScrollScreen>
  );
}

function HealthEditModal({
  ev,
  saving,
  onClose,
  onSave,
}: {
  ev: FarmHealthEventRecord;
  saving: boolean;
  onClose: () => void;
  onSave: (body: {
    name: string;
    medication: string | null;
    dose: string | null;
    notes: string | null;
  }) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('farm');
  const [name, setName] = useState(ev.name);
  const [medication, setMedication] = useState(ev.medication ?? '');
  const [dose, setDose] = useState(ev.dose ?? '');
  const [notes, setNotes] = useState(ev.notes ?? '');
  return (
    <Modal visible onClose={onClose} title={t('records.editHealth')}>
      <ScrollView
        contentContainerStyle={{ rowGap: theme.spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        <Input label={t('records.name')} value={name} onChangeText={setName} />
        <Input label={t('records.medication')} value={medication} onChangeText={setMedication} />
        <Input label={t('records.dose')} value={dose} onChangeText={setDose} />
        <Input label={t('records.notes')} value={notes} onChangeText={setNotes} multiline />
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button label={t('records.cancel')} variant="ghost" fullWidth onPress={onClose} />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t('records.save')}
              fullWidth
              loading={saving}
              disabled={saving || !name.trim()}
              onPress={() =>
                onSave({
                  name: name.trim(),
                  medication: medication.trim() || null,
                  dose: dose.trim() || null,
                  notes: notes.trim() || null,
                })
              }
            />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', columnGap: 12 }}>
      <Caption>{label}</Caption>
      <Text variant="bodyMedium">{value}</Text>
    </View>
  );
}
