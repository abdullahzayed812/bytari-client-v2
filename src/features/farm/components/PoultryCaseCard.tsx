import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Badge, Card, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { CASE_STATUS_ICON, CASE_STATUS_TONE } from '../constants';
import type { PoultryCase } from '../types';

const SEX_SYMBOL: Record<string, string> = { MALE: '♂', FEMALE: '♀', UNKNOWN: '' };

export function PoultryCaseCard({ item, onPress }: { item: PoultryCase; onPress?: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation('poultry');

  return (
    <Card variant="outlined" padding="md" onPress={onPress}>
      <View style={{ rowGap: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}>
          <Text variant="bodyStrong">
            {t('cases.caseLabel', { number: String(item.caseNumber ?? '—').padStart(2, '0') })}
          </Text>
          <Text variant="bodyMedium">{SEX_SYMBOL[item.sex]}</Text>
          <Caption>{t(`cases.sex.${item.sex}`)}</Caption>
        </View>

        <View style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              rowGap: theme.spacing.xs,
              paddingEnd: theme.spacing.sm,
            }}
          >
            <Badge label={t(`cases.status.${item.status}`)} tone={CASE_STATUS_TONE[item.status]} size="sm" />
            <Icon name={CASE_STATUS_ICON[item.status]} size="iconMd" color={CASE_STATUS_TONE[item.status] === 'success' ? 'success' : CASE_STATUS_TONE[item.status] === 'warning' ? 'warning' : 'textMuted'} />
          </View>

          <View style={{ flex: 1, rowGap: theme.spacing.xs }}>
            {item.diagnosis ? (
              <Row label={t('cases.diagnosisLabel')} value={item.diagnosis} />
            ) : null}
            <Row label={t('cases.startedLabel')} value={formatDate(item.startedOn)} />
            {item.treatment ? <Row label={t('cases.treatmentLabel')} value={item.treatment} /> : null}
            {item.nextFollowupOn ? (
              <Row label={t('cases.nextFollowupLabel')} value={formatDate(item.nextFollowupOn)} />
            ) : null}
          </View>

          {item.imageUrl ? (
            <Image
              source={item.imageUrl}
              style={{ width: 56, height: 56, borderRadius: theme.radius.pill }}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: theme.radius.pill,
                backgroundColor: theme.colors.surfaceAccent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="paw-outline" size="iconMd" color="primary" />
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ rowGap: 1 }}>
      <Caption>{label}</Caption>
      <Text variant="bodyMedium" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}
