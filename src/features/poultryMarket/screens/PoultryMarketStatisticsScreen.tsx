import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { IRAQ_GOVERNORATES } from '@/constants/governorates';
import { useTheme } from '@/theme';

import { MarketAccessGate } from '../components/MarketAccessGate';
import { usePoultryMarketStatistics } from '../hooks';

function StatTile({ value, label }: { value: number; label: string }) {
  const theme = useTheme();
  return (
    <Card
      variant="outlined"
      style={{ flex: 1, alignItems: 'center', paddingVertical: theme.spacing.lg }}
    >
      <Text variant="title">{value.toLocaleString()}</Text>
      <Caption>{label}</Caption>
    </Card>
  );
}

/** Route `/(app)/poultry/statistics` — إحصائيات المحافظات (Markets & Exchanges access). */
export default function PoultryMarketStatisticsScreen() {
  const { t } = useTranslation('poultryMarket');
  return (
    <MarketAccessGate title={t('statistics.title')}>
      <PoultryMarketStatisticsContent />
    </MarketAccessGate>
  );
}

function PoultryMarketStatisticsContent() {
  const theme = useTheme();
  const { t } = useTranslation('poultryMarket');
  const q = usePoultryMarketStatistics();

  return (
    <ScrollScreen>
      <AppHeader title={t('statistics.title')} showBack />

      {q.isLoading ? (
        <Section spacing="xl">
          <Loading label={t('statistics.title')} />
        </Section>
      ) : q.isError ? (
        <Section spacing="xl">
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </Section>
      ) : !q.data || q.data.byGovernorate.length === 0 ? (
        <Section spacing="xl">
          <EmptyState icon="stats-chart-outline" title={t('statistics.empty')} />
        </Section>
      ) : (
        <>
          <Section spacing="xl">
            <Row gap="md">
              <StatTile value={q.data.totalFarms} label={t('statistics.totalFarms')} />
              <StatTile value={q.data.totalBirds} label={t('statistics.totalBirds')} />
            </Row>
          </Section>

          <Section spacing="lg">
            <Label>{t('statistics.distributionTitle')}</Label>
          </Section>

          <Section spacing="xxl">
            <View
              style={{
                borderRadius: theme.radius.lg,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: theme.colors.border,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: theme.colors.primary,
                  paddingVertical: theme.spacing.sm,
                  paddingHorizontal: theme.spacing.md,
                }}
              >
                <Text variant="label" style={{ flex: 1.4, color: theme.colors.onPrimary }}>
                  {t('statistics.columnGovernorate')}
                </Text>
                <Text
                  variant="label"
                  style={{ flex: 1, color: theme.colors.onPrimary, textAlign: 'center' }}
                >
                  {t('statistics.columnFarmCount')}
                </Text>
                <Text
                  variant="label"
                  style={{ flex: 1, color: theme.colors.onPrimary, textAlign: 'center' }}
                >
                  {t('statistics.columnBirdCount')}
                </Text>
              </View>

              {IRAQ_GOVERNORATES.map((governorate, index) => {
                const stat = q.data.byGovernorate.find((s) => s.governorate === governorate);
                return (
                  <View
                    key={governorate}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: theme.spacing.md,
                      paddingHorizontal: theme.spacing.md,
                      backgroundColor:
                        index % 2 === 0 ? theme.colors.surface : theme.colors.surfaceMuted,
                    }}
                  >
                    <Text variant="bodyMedium" style={{ flex: 1.4 }}>
                      {governorate}
                    </Text>
                    <Text variant="bodyMedium" style={{ flex: 1, textAlign: 'center' }}>
                      {stat ? stat.farmCount.toLocaleString() : '—'}
                    </Text>
                    <Text variant="bodyMedium" style={{ flex: 1, textAlign: 'center' }}>
                      {stat ? stat.totalBirds.toLocaleString() : '—'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Section>
        </>
      )}
    </ScrollScreen>
  );
}
