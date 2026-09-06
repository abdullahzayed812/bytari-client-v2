import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Badge, Card, Icon } from '@/components/content';
import { ErrorState, Loading } from '@/components/feedback';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { CASE_STATUS_TONE } from '../constants';
import { usePoultryCase } from '../hooks';

const SEX_SYMBOL: Record<string, string> = { MALE: '♂', FEMALE: '♀', UNKNOWN: '' };

/** Route `/poultry/[organizationId]/sections/cases/[itemId]` — one individual case's full detail. */
export default function PoultryCaseDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const { organizationId, itemId, flockId } = useLocalSearchParams<{
    organizationId: string;
    itemId: string;
    flockId: string;
  }>();

  const q = usePoultryCase(organizationId, flockId, itemId);
  const item = q.data;

  return (
    <ScrollScreen>
      <AppHeader title={t('cases.title')} showBack />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError || !item ? (
        <Section spacing="lg">
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </Section>
      ) : (
        <Section spacing="lg">
          <Card variant="outlined" padding="lg">
            <View style={{ rowGap: theme.spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
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
                    {t('cases.caseLabel', { number: String(item.caseNumber ?? '—').padStart(2, '0') })}
                  </Text>
                  <Text variant="bodyMedium">
                    {SEX_SYMBOL[item.sex]} {t(`cases.sex.${item.sex}`)}
                    {item.animalTag ? ` · ${item.animalTag}` : ''}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Caption>{t('cases.statusLabel')}</Caption>
                <Badge label={t(`cases.status.${item.status}`)} tone={CASE_STATUS_TONE[item.status]} size="sm" />
              </View>

              {item.diagnosis ? (
                <View style={{ rowGap: 2 }}>
                  <Caption>{t('cases.diagnosisLabel')}</Caption>
                  <Text variant="body">{item.diagnosis}</Text>
                </View>
              ) : null}
              {item.treatment ? (
                <View style={{ rowGap: 2 }}>
                  <Caption>{t('cases.treatmentLabel')}</Caption>
                  <Text variant="body">{item.treatment}</Text>
                </View>
              ) : null}

              <Row label={t('cases.startedLabel')} value={formatDate(item.startedOn)} />
              {item.nextFollowupOn ? (
                <Row label={t('cases.nextFollowupLabel')} value={formatDate(item.nextFollowupOn)} />
              ) : null}
            </View>
          </Card>
        </Section>
      )}
    </ScrollScreen>
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
