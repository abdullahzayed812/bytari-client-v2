import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Card, Chip, Icon, type BadgeTone } from '@/components/content';
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
import {
  FARM_CASE_STATUSES,
  useDeleteFarmCase,
  useFarmCaseRecord,
  useUpdateFarmCase,
  type FarmCaseRecord,
  type FarmCaseStatus,
  type FarmRecordScope,
} from '../records';

const STATUS_TONE: Record<FarmCaseStatus, BadgeTone> = {
  UNDER_TREATMENT: 'warning',
  RECOVERED: 'success',
  DECEASED: 'danger',
};

/**
 * One individual case ("الحالات الفردية") for any farm type — full detail,
 * number of cases, status change, edit, delete and "أضيف بواسطة". Route
 * params: `organizationId`, `itemId`, and the batch as `flockId` (poultry) or
 * `batchId` (sheep / cattle).
 */
export default function FarmCaseDetailScreen({ scope }: { scope: FarmRecordScope }) {
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

  const q = useFarmCaseRecord(scope, orgId, batchId, params.itemId);
  const update = useUpdateFarmCase(scope, orgId, batchId);
  const remove = useDeleteFarmCase(scope, orgId, batchId);
  const [editing, setEditing] = useState(false);
  const item = q.data;

  const setStatus = (status: FarmCaseStatus): void => {
    if (!item || item.status === status) return;
    update.mutate(
      { id: item.id, body: { status } },
      {
        onSuccess: () => toast.show({ tone: 'success', message: t('records.updated') }),
        onError: (e) => toast.show({ tone: 'danger', message: apiErrorMessage(e) }),
      },
    );
  };

  return (
    <ScrollScreen>
      <AppHeader title={t('records.caseTitle')} showBack />
      {q.isLoading ? (
        <Loading fill />
      ) : q.isError || !item ? (
        <Section spacing="lg">
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </Section>
      ) : (
        <Section spacing="lg">
          <Card variant="outlined" padding="lg" style={{ rowGap: theme.spacing.lg }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}
            >
              {item.imageUrl ? (
                <Image
                  source={item.imageUrl}
                  style={{ width: 64, height: 64, borderRadius: theme.radius.pill }}
                  contentFit="cover"
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: theme.radius.pill,
                    backgroundColor: theme.colors.surfaceAccent,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="paw-outline" size="iconLg" color="primary" />
                </View>
              )}
              <View style={{ flex: 1, rowGap: 2 }}>
                <Text variant="heading">
                  {t('records.caseLabel', {
                    number: String(item.caseNumber ?? '—').padStart(2, '0'),
                  })}
                </Text>
                <Text variant="bodyMedium">
                  {t('records.caseCountValue', { count: item.caseCount })}
                </Text>
                {item.animalTag ? (
                  <Caption>{`${t('records.animalTag')}: ${item.animalTag}`}</Caption>
                ) : null}
              </View>
              <Badge
                label={t(`records.caseStatus.${item.status}`)}
                tone={STATUS_TONE[item.status]}
                size="sm"
              />
            </View>

            {canManage ? (
              <View style={{ rowGap: theme.spacing.xs }}>
                <Caption>{t('records.changeStatus')}</Caption>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                  {FARM_CASE_STATUSES.map((s) => (
                    <Chip
                      key={s}
                      label={t(`records.caseStatus.${s}`)}
                      selected={item.status === s}
                      onPress={() => setStatus(s)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {item.diagnosis ? (
              <Field label={t('records.diagnosis')} value={item.diagnosis} />
            ) : null}
            {item.treatment ? (
              <Field label={t('records.treatment')} value={item.treatment} />
            ) : null}
            <Row label={t('records.startedOn')} value={formatDate(item.startedOn)} />
            {item.nextFollowupOn ? (
              <Row label={t('records.nextFollowup')} value={formatDate(item.nextFollowupOn)} />
            ) : null}

            <FarmRecordFooter
              createdBy={item.createdBy}
              canManage={canManage}
              canDelete={farmCaps.canDeleteFarmRecords}
              onEdit={() => setEditing(true)}
              deleting={remove.isPending}
              onDelete={() =>
                remove.mutate(item.id, {
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
            <CaseEditModal
              item={item}
              saving={update.isPending}
              onClose={() => setEditing(false)}
              onSave={(body) =>
                update.mutate(
                  { id: item.id, body },
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

function CaseEditModal({
  item,
  saving,
  onClose,
  onSave,
}: {
  item: FarmCaseRecord;
  saving: boolean;
  onClose: () => void;
  onSave: (body: {
    caseCount: number;
    diagnosis: string | null;
    treatment: string | null;
    nextFollowupOn: string | null;
  }) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('farm');
  const [count, setCount] = useState(String(item.caseCount));
  const [diagnosis, setDiagnosis] = useState(item.diagnosis ?? '');
  const [treatment, setTreatment] = useState(item.treatment ?? '');
  const [followup, setFollowup] = useState(item.nextFollowupOn ?? '');
  const parsed = Number(count);
  const countValid = Number.isInteger(parsed) && parsed >= 1;
  const followupValid = followup.trim() === '' || /^\d{4}-\d{2}-\d{2}$/.test(followup.trim());

  return (
    <Modal visible onClose={onClose} title={t('records.editCase')}>
      <ScrollView
        contentContainerStyle={{ rowGap: theme.spacing.md }}
        keyboardShouldPersistTaps="handled"
      >
        <Input
          label={t('records.caseCount')}
          value={count}
          onChangeText={setCount}
          keyboardType="number-pad"
          error={countValid ? undefined : t('records.invalidCount')}
        />
        <Input label={t('records.diagnosis')} value={diagnosis} onChangeText={setDiagnosis} />
        <Input label={t('records.treatment')} value={treatment} onChangeText={setTreatment} />
        <Input
          label={t('records.nextFollowup')}
          placeholder="YYYY-MM-DD"
          value={followup}
          onChangeText={setFollowup}
        />
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button label={t('records.cancel')} variant="ghost" fullWidth onPress={onClose} />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t('records.save')}
              fullWidth
              loading={saving}
              disabled={saving || !countValid || !followupValid}
              onPress={() =>
                onSave({
                  caseCount: parsed,
                  diagnosis: diagnosis.trim() || null,
                  treatment: treatment.trim() || null,
                  nextFollowupOn: followup.trim() || null,
                })
              }
            />
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ rowGap: 2 }}>
      <Caption>{label}</Caption>
      <Text variant="body">{value}</Text>
    </View>
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
