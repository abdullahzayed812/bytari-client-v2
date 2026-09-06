import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, Icon } from '@/components/content';
import { ErrorState, Loading } from '@/components/feedback';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { EXPENSE_CATEGORY_ICON } from '../constants';
import { useFarmExpense } from '../hooks';

/** Route `/poultry/[organizationId]/sections/expenses/[itemId]` — one expense's full detail. */
export default function ExpenseDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const { organizationId, itemId } = useLocalSearchParams<{
    organizationId: string;
    itemId: string;
  }>();

  const q = useFarmExpense(organizationId, itemId);

  return (
    <ScrollScreen>
      <AppHeader title={t('expenses.title')} showBack />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError || !q.data ? (
        <Section spacing="lg">
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </Section>
      ) : (
        <Section spacing="lg">
          <Card variant="outlined" padding="lg">
            <View style={{ rowGap: theme.spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: theme.radius.pill,
                    backgroundColor: theme.colors.primarySoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon
                    name={EXPENSE_CATEGORY_ICON[q.data.category] ?? 'ellipsis-horizontal'}
                    size="iconLg"
                    color="primary"
                  />
                </View>
                <View style={{ flex: 1, rowGap: 2 }}>
                  <Text variant="heading">{t(`expenses.categories.${q.data.category}`)}</Text>
                  <Text variant="bodyStrong" color="danger">
                    {Number(q.data.amount).toLocaleString()} {t('expenses.unit')}
                  </Text>
                </View>
              </View>

              <Row label={t('expenses.dateLabel')} value={formatDate(q.data.spentOn)} />
              {q.data.description ? (
                <View style={{ rowGap: 2 }}>
                  <Caption>{t('expenses.descriptionLabel')}</Caption>
                  <Text variant="body">{q.data.description}</Text>
                </View>
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
