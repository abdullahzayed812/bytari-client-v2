import { Children, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Divider, Icon, type IconName } from '@/components/content';
import { Input, Select } from '@/components/forms';
import { Modal } from '@/components/overlays';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { FEED_TYPE_ORDER } from '../constants';
import { LIVESTOCK_ACTIVITY_LEVELS, LIVESTOCK_APPETITE_LEVELS } from '../types';
import type { FeedType, LivestockActivity, LivestockAppetite } from '../types';

export interface LivestockDailyRecordFormValues {
  recordDate: string;
  feedKg?: number;
  waterLiters?: number;
  appetite?: LivestockAppetite;
  activity?: LivestockActivity;
  mortalityCount?: number;
  mortalityCause?: string;
  sickCasesCount?: number;
  feedType?: FeedType;
  treatment?: string;
  expenseAmount?: number;
  notes?: string;
}

/** "إضافة بيانات يومية" dialog — shared by Sheep and Cattle (mirrors poultry's, plus sickCasesCount/feedType). */
export function LivestockDailyRecordDialog({
  visible,
  loading,
  onSubmit,
  onCancel,
}: {
  visible: boolean;
  loading: boolean;
  onSubmit: (input: LivestockDailyRecordFormValues) => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('sheepCattleFarm');
  const [recordDate, setRecordDate] = useState('');
  const [feedKg, setFeedKg] = useState('');
  const [waterLiters, setWaterLiters] = useState('');
  const [appetite, setAppetite] = useState<LivestockAppetite | null>(null);
  const [activity, setActivity] = useState<LivestockActivity | null>(null);
  const [mortalityCount, setMortalityCount] = useState('');
  const [mortalityCause, setMortalityCause] = useState('');
  const [sickCasesCount, setSickCasesCount] = useState('');
  const [feedType, setFeedType] = useState<FeedType | null>(null);
  const [treatment, setTreatment] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [notes, setNotes] = useState('');

  const valid = /^\d{4}-\d{2}-\d{2}$/.test(recordDate) && !Number.isNaN(Date.parse(recordDate));

  return (
    <Modal visible={visible} onClose={onCancel} title={t('batch.addDaily')} dismissable={!loading}>
      <ScrollView contentContainerStyle={{ rowGap: theme.spacing.md }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Input label={t('daily.dateLabel')} placeholder="YYYY-MM-DD" value={recordDate} onChangeText={setRecordDate} />

        <FieldGroup icon="nutrition-outline" label={t('daily.consumptionSection')}>
          <FieldRow>
            <Input label={t('daily.feed')} hint={t('daily.feedUnit')} keyboardType="decimal-pad" value={feedKg} onChangeText={setFeedKg} />
            <Input label={t('daily.water')} hint={t('daily.waterUnit')} keyboardType="decimal-pad" value={waterLiters} onChangeText={setWaterLiters} />
          </FieldRow>
          <Select<FeedType>
            label={t('daily.feedType')}
            value={feedType}
            options={FEED_TYPE_ORDER.map((f) => ({ value: f, label: t(`daily.feedTypes.${f}`) }))}
            onChange={setFeedType}
          />
        </FieldGroup>

        <FieldGroup icon="pulse-outline" label={t('daily.healthSection')}>
          <FieldRow>
            <Select<LivestockAppetite>
              label={t('daily.appetite')}
              value={appetite}
              options={LIVESTOCK_APPETITE_LEVELS.map((a) => ({ value: a, label: t(`daily.appetiteLevels.${a}`) }))}
              onChange={setAppetite}
            />
            <Select<LivestockActivity>
              label={t('daily.activity')}
              value={activity}
              options={LIVESTOCK_ACTIVITY_LEVELS.map((a) => ({ value: a, label: t(`daily.activityLevels.${a}`) }))}
              onChange={setActivity}
            />
          </FieldRow>
          <FieldRow>
            <Input label={t('daily.mortality')} hint={t('daily.mortalityUnit')} keyboardType="number-pad" value={mortalityCount} onChangeText={setMortalityCount} />
            <Input label={t('daily.mortalityCause')} value={mortalityCause} onChangeText={setMortalityCause} />
          </FieldRow>
          <Input label={t('daily.sickCasesCount')} keyboardType="number-pad" value={sickCasesCount} onChangeText={setSickCasesCount} />
        </FieldGroup>

        <FieldGroup icon="wallet-outline" label={t('daily.otherSection')}>
          <FieldRow>
            <Input label={t('daily.treatment')} value={treatment} onChangeText={setTreatment} />
            <Input label={t('daily.expense')} hint={t('daily.expenseUnit')} keyboardType="decimal-pad" value={expenseAmount} onChangeText={setExpenseAmount} />
          </FieldRow>
          <Input label={t('daily.notes')} multiline numberOfLines={3} value={notes} onChangeText={setNotes} />
        </FieldGroup>

        <Divider spacing="xs" />

        <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <Button label={t('common.cancel')} variant="ghost" fullWidth onPress={onCancel} disabled={loading} />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t('common.save')}
              variant="primary"
              fullWidth
              loading={loading}
              disabled={loading || !valid}
              onPress={() =>
                onSubmit({
                  recordDate,
                  feedKg: feedKg ? Number(feedKg) : undefined,
                  waterLiters: waterLiters ? Number(waterLiters) : undefined,
                  appetite: appetite ?? undefined,
                  activity: activity ?? undefined,
                  mortalityCount: mortalityCount ? Number(mortalityCount) : undefined,
                  mortalityCause: mortalityCause.trim() || undefined,
                  sickCasesCount: sickCasesCount ? Number(sickCasesCount) : undefined,
                  feedType: feedType ?? undefined,
                  treatment: treatment.trim() || undefined,
                  expenseAmount: expenseAmount ? Number(expenseAmount) : undefined,
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

function FieldGroup({ icon, label, children }: { icon: IconName; label: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ rowGap: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}>
        <Icon name={icon} size="iconSm" color="primary" />
        <Text variant="label" weight="bold">
          {label}
        </Text>
      </View>
      <View style={{ rowGap: theme.spacing.sm }}>{children}</View>
    </View>
  );
}

function FieldRow({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
      {Children.map(children, (child, i) => (
        <View key={i} style={{ flex: 1 }}>
          {child}
        </View>
      ))}
    </View>
  );
}
