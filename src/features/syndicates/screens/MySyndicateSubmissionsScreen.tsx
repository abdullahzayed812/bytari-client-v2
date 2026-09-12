import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { Card, Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SegmentedControl } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { SyndicateSubmissionStatusBadge } from '../components';
import { useMySyndicateSubmissions } from '../hooks';
import type { SyndicateSubmission, SyndicateSubmissionKind } from '../types';

/** Route `/(app)/syndicates/my` — "طلباتي واستفساراتي" ("متابعة الطلب من خلال حسابك"). */
export default function MySyndicateSubmissionsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const [kind, setKind] = useState<SyndicateSubmissionKind>('INQUIRY');
  const q = useMySyndicateSubmissions({ kind });

  return (
    <SafeAreaScreen>
      <AppHeader title={t('mySubmissions.title')} showBack />
      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.sm }}>
        <SegmentedControl<SyndicateSubmissionKind>
          value={kind}
          onChange={setKind}
          options={[
            { value: 'INQUIRY', label: t('mySubmissions.tabInquiries') },
            { value: 'REQUEST', label: t('mySubmissions.tabRequests') },
          ]}
        />
      </View>

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.submissions}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => <SubmissionRow submission={item} />}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              title={kind === 'REQUEST' ? t('mySubmissions.emptyRequests') : t('mySubmissions.emptyInquiries')}
            />
          }
          ListFooterComponent={q.isFetchingNextPage ? <Loading /> : null}
          contentContainerStyle={{ padding: theme.screenPadding, paddingBottom: theme.spacing.huge }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
          }}
        />
      )}
    </SafeAreaScreen>
  );
}

function SubmissionRow({ submission }: { submission: SyndicateSubmission }) {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  return (
    <Card variant="outlined" padding="md" style={{ rowGap: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
        <Icon name="business-outline" size="iconSm" color="textMuted" />
        <Caption numberOfLines={1} style={{ flex: 1 }}>
          {submission.syndicateName}
        </Caption>
        <SyndicateSubmissionStatusBadge status={submission.status} />
      </View>
      {submission.requestType ? (
        <Text variant="bodyStrong">{t(`requestType.${submission.requestType}`)}</Text>
      ) : null}
      <Text variant="body" numberOfLines={3}>
        {submission.message}
      </Text>
      <Caption color="textMuted">
        {t('mySubmissions.submittedOn')}: {formatDate(submission.createdAt)}
      </Caption>
      {submission.status !== 'PENDING' ? (
        <View style={{ rowGap: 4, marginTop: theme.spacing.xs }}>
          <Caption color="textMuted">{t('mySubmissions.responseLabel')}</Caption>
          <Text variant="body" color="textSecondary">
            {submission.responseText ?? t('mySubmissions.noResponseYet')}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}
