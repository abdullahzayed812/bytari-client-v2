import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Badge, Card, Divider, Icon } from '@/components/content';
import { EmptyState, ErrorState, SkeletonText } from '@/components/feedback';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { UserName } from '@/features/users/components';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { usePetOwnershipHistory } from '../hooks';
import type { OwnershipRecord } from '../types';

/** Route `/pets/[petId]/ownership` — the animal's full ownership chain (§8, read-only). */
export default function OwnershipHistoryScreen() {
  const theme = useTheme();
  const { t } = useTranslation('pets');
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const q = usePetOwnershipHistory(petId ?? '');

  const denied = q.error instanceof ApiError && (q.error.status === 404 || q.error.status === 403);
  if (denied) {
    return (
      <ScrollScreen>
        <AppHeader title={t('ownership.title')} showBack />
        <EmptyState
          icon="lock-closed-outline"
          title={t('ownership.deniedTitle')}
          message={t('ownership.deniedBody')}
          actionLabel={t('ownership.back')}
          onAction={() => router.back()}
        />
      </ScrollScreen>
    );
  }
  if (q.isError) {
    return (
      <ScrollScreen>
        <AppHeader title={t('ownership.title')} showBack />
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </ScrollScreen>
    );
  }

  // Newest first for display.
  const rows = [...(q.data ?? [])].reverse();

  return (
    <ScrollScreen>
      <AppHeader title={t('ownership.title')} showBack />

      {q.isLoading ? (
        <Section spacing="xl">
          <SkeletonText lines={6} />
        </Section>
      ) : rows.length === 0 ? (
        <EmptyState icon="people-outline" title={t('ownership.empty')} />
      ) : (
        <Section spacing="lg">
          <Label>{t('ownership.sectionTitle')}</Label>
          <View style={{ rowGap: theme.spacing.md }}>
            {rows.map((r) => (
              <OwnershipRow key={r.id} record={r} />
            ))}
          </View>
        </Section>
      )}
    </ScrollScreen>
  );
}

function OwnershipRow({ record }: { record: OwnershipRecord }) {
  const theme = useTheme();
  const { t } = useTranslation('pets');
  const name = record.owner ? `${record.owner.firstName} ${record.owner.lastName}`.trim() : null;

  return (
    <Card variant="outlined" padding="md">
      <Row justify="space-between" align="center">
        <Row gap="sm" align="center" style={{ flex: 1 }}>
          <Icon name="person-outline" size="iconMd" color="primary" />
          {name ? (
            <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
              {name}
            </Text>
          ) : (
            <UserName
              userId={record.ownerUserId}
              variant="bodyStrong"
              numberOfLines={1}
              style={{ flex: 1 }}
            />
          )}
        </Row>
        {record.isCurrent ? (
          <Badge label={t('ownership.current')} tone="success" size="sm" />
        ) : null}
      </Row>

      <View style={{ marginTop: theme.spacing.sm, rowGap: 4 }}>
        <Caption>
          {t('ownership.from', { date: formatDate(record.startedAt) })}
          {record.endedAt ? ` · ${t('ownership.to', { date: formatDate(record.endedAt) })}` : ''}
        </Caption>
        {record.transferredBy ? (
          <Row gap="xs" align="center">
            <Caption>{t('ownership.transferredBy')}</Caption>
            <UserName userId={record.transferredBy} variant="caption" />
          </Row>
        ) : null}
        {record.transferReason ? (
          <>
            <Divider spacing="sm" />
            <Text variant="body">{record.transferReason}</Text>
          </>
        ) : null}
      </View>
    </Card>
  );
}
