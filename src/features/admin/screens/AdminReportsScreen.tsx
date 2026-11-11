import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Skeleton, useToast } from '@/components/feedback';
import { Caption, Text } from '@/components/typography';
import { AdminUserLink } from '@/features/admin/components/AdminUserLink';
import {
  useAdminReports,
  useReviewReport,
  type AdminContentReport,
  type ReportStatus,
} from '@/features/safety/adminReports';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { AdminListScreen, AdminRow, FilterChips } from '../components';

const STATUSES: ReportStatus[] = ['PENDING', 'REVIEWED', 'DISMISSED'];

/**
 * `/admin/reports` — "البلاغات": the content-report queue (messages, users,
 * listings, organization pages, reviews, comments, AI answers). Each row shows
 * a snapshot of the reported item and links to the reporter / author profile;
 * the admin acts from the item's own section, then marks the report handled
 * or dismisses it (`PATCH /admin/reports/:id`, `content_report.admin.manage`).
 */
export default function AdminReportsScreen() {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation('globalChat');
  const theme = useTheme();
  const toast = useToast();
  const caps = useCapabilities();
  const canManage = caps.isAdmin || caps.can('content_report.admin.manage');

  const [status, setStatus] = useState<ReportStatus | undefined>('PENDING');
  const q = useAdminReports(status);
  const review = useReviewReport();

  const act = (r: AdminContentReport, next: 'REVIEWED' | 'DISMISSED'): void =>
    review.mutate(
      { reportId: r.id, status: next },
      {
        onSuccess: () => toast.show({ tone: 'success', message: t('reports.updated') }),
        onError: (e) => toast.show({ tone: 'danger', message: apiErrorMessage(e) }),
      },
    );

  return (
    <AdminListScreen<AdminContentReport>
      title={t('reports.title')}
      query={q}
      data={q.reports}
      keyExtractor={(r) => r.id}
      skeletonRow={
        <View style={{ rowGap: 8, padding: theme.spacing.md }}>
          <Skeleton width="50%" height={16} />
          <Skeleton width="70%" height={12} />
        </View>
      }
      emptyIcon="flag-outline"
      emptyTitle={t('reports.empty')}
      loadingMoreLabel={t('common.loadingMore')}
      filterBar={
        <View style={{ rowGap: theme.spacing.sm, paddingHorizontal: theme.screenPadding }}>
          <FilterChips<ReportStatus>
            value={status}
            onChange={setStatus}
            options={STATUSES.map((v) => ({ value: v, label: t(`reports.status.${v}`) }))}
          />
          <Caption color="textSecondary">{t('reports.hint')}</Caption>
        </View>
      }
      renderItem={(r) => (
        <View>
          <AdminRow
            title={`${t(`reports.target.${r.targetType}`)} · ${tc(`report.reason.${r.reason}`)}`}
            subtitle={r.target.exists ? (r.target.preview ?? '—') : t('reports.targetGone')}
            meta={`${formatDate(r.createdAt)}${r.details ? ` · ${r.details}` : ''}`}
            badge={{
              label: t(`reports.status.${r.status}`),
              tone:
                r.status === 'PENDING'
                  ? 'warning'
                  : r.status === 'REVIEWED'
                    ? 'success'
                    : 'neutral',
            }}
            actions={
              canManage && r.status === 'PENDING' ? (
                <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
                  <Button
                    label={t('reports.markReviewed')}
                    disabled={review.isPending}
                    onPress={() => act(r, 'REVIEWED')}
                  />
                  <Button
                    label={t('reports.dismiss')}
                    variant="outline"
                    disabled={review.isPending}
                    onPress={() => act(r, 'DISMISSED')}
                  />
                </View>
              ) : undefined
            }
          />
          <View
            style={{
              paddingHorizontal: theme.spacing.md,
              paddingBottom: theme.spacing.sm,
              rowGap: 2,
            }}
          >
            <Text variant="caption" color="textSecondary">
              {t('reports.reporter')}:{' '}
            </Text>
            <AdminUserLink userId={r.reporterUserId} variant="caption" />
            {r.target.authorUserId ? (
              <>
                <Text variant="caption" color="textSecondary">
                  {t('reports.author')}:{' '}
                </Text>
                <AdminUserLink userId={r.target.authorUserId} variant="caption" />
              </>
            ) : null}
          </View>
        </View>
      )}
    />
  );
}
