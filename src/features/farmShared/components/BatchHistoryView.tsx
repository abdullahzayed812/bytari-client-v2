import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { useTheme } from '@/theme';

import type { DailyRecordWeeks } from '../weeks';

import { CompletedWeeksSection } from './CompletedWeeksSection';

export interface BatchHistoryViewProps {
  /** The batch summary query is still loading. */
  loading: boolean;
  /** A blocking error (the batch / summary failed to load). */
  error?: unknown;
  onRetry?: () => void;
  /** The read-only batch summary card (rendered without any action buttons). */
  summary: ReactNode;
  /** `undefined` while loading or when the member may not read daily records. */
  weeks?: DailyRecordWeeks;
  weeksLoading?: boolean;
  /** Whether the member may read daily records at all (hides the weeks section). */
  canSeeDaily: boolean;
  renderWeekRecords: (week: number) => ReactNode;
  formatWeight?: (value: string) => string;
}

/**
 * "تفاصيل الدفعة" — a SEPARATE, read-only screen with one (usually closed)
 * batch's full history: its summary plus every week and that week's daily
 * records. It only reads by batch id, so it never touches — or replaces in
 * the farm screen — the farm's currently active batch. Shared by the
 * poultry, sheep and cattle batch-history routes.
 */
export function BatchHistoryView({
  loading,
  error,
  onRetry,
  summary,
  weeks,
  weeksLoading,
  canSeeDaily,
  renderWeekRecords,
  formatWeight,
}: BatchHistoryViewProps) {
  const theme = useTheme();
  const { t } = useTranslation('farm');

  return (
    <ScrollScreen>
      <AppHeader title={t('batchHistory.title')} showBack />
      {error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : loading ? (
        <Loading label={t('common.loadingMore')} />
      ) : (
        <>
          <Section spacing="lg">
            <View
              style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}
            >
              <Icon name="lock-closed-outline" size="iconXs" color="textMuted" />
              <Caption color="textMuted" style={{ flex: 1 }}>
                {t('batchHistory.readOnly')}
              </Caption>
            </View>
          </Section>
          <Section spacing="lg">{summary}</Section>
          {canSeeDaily ? (
            <Section spacing="xl">
              {weeksLoading || !weeks ? (
                <Loading label={t('common.loadingMore')} />
              ) : weeks.weeks.length === 0 ? (
                <EmptyState icon="clipboard-outline" title={t('batchHistory.noRecords')} />
              ) : (
                <CompletedWeeksSection
                  weeks={weeks.weeks}
                  currentWeek={weeks.currentWeek}
                  showAllWeeks
                  title={t('batchHistory.allWeeks')}
                  formatWeight={formatWeight}
                  renderWeekRecords={renderWeekRecords}
                />
              )}
            </Section>
          ) : null}
        </>
      )}
    </ScrollScreen>
  );
}
