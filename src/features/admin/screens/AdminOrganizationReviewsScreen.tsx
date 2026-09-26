import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Skeleton, useToast } from '@/components/feedback';
import {
  useAdminDeleteOrganizationReview,
  useAdminOrganizationReviews,
} from '@/features/organizations';
import type { AdminOrganizationReview, OrganizationType } from '@/features/organizations/types';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate, fullName } from '@/utils';

import { AdminListScreen, AdminRow, FilterChips, ReasonPromptDialog } from '../components';

const TYPES: OrganizationType[] = ['CLINIC', 'VETERINARY_OFFICE', 'VETERINARY_STORE'];

/**
 * `/admin/organization-reviews` — moderation of clinic / office / store
 * ratings. Each row shows the organization it belongs to and the author;
 * deletion (optional reason) is backend-authorised
 * (`organization.admin.manage`) and audited (`ORGANIZATION_REVIEW_DELETED`).
 */
export default function AdminOrganizationReviewsScreen() {
  const { t } = useTranslation('admin');
  const { t: tOrg } = useTranslation('organizations');
  const theme = useTheme();
  const toast = useToast();
  const caps = useCapabilities();
  const canDelete = caps.isAdmin || caps.can('organization.admin.manage');

  const [type, setType] = useState<OrganizationType | undefined>(undefined);
  const [lowOnly, setLowOnly] = useState(false);
  const q = useAdminOrganizationReviews({ type, maxRating: lowOnly ? 2 : undefined });
  const del = useAdminDeleteOrganizationReview();
  const [pending, setPending] = useState<AdminOrganizationReview | null>(null);

  return (
    <>
      <AdminListScreen<AdminOrganizationReview>
        title={t('orgReviews.title')}
        query={q}
        data={q.reviews}
        keyExtractor={(r) => r.id}
        skeletonRow={
          <View style={{ rowGap: 8, padding: theme.spacing.md }}>
            <Skeleton width="50%" height={16} />
            <Skeleton width="70%" height={12} />
          </View>
        }
        emptyIcon="star-outline"
        emptyTitle={t('orgReviews.empty')}
        loadingMoreLabel={t('common.loadingMore')}
        filterBar={
          <View style={{ rowGap: theme.spacing.sm, paddingHorizontal: theme.screenPadding }}>
            <FilterChips<OrganizationType>
              value={type}
              onChange={setType}
              options={[
                { value: undefined, label: t('orgReviews.allTypes') },
                ...TYPES.map((v) => ({ value: v, label: tOrg(`type.${v}`) })),
              ]}
            />
            <FilterChips<'low'>
              value={lowOnly ? 'low' : undefined}
              onChange={(v) => setLowOnly(v === 'low')}
              options={[
                { value: undefined, label: t('orgReviews.allRatings') },
                { value: 'low', label: t('orgReviews.lowOnly') },
              ]}
            />
          </View>
        }
        renderItem={(r) => (
          <AdminRow
            title={`${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)} · ${r.organization.name}`}
            subtitle={r.comment ?? t('orgReviews.noComment')}
            meta={`${fullName(r.author.firstName, r.author.lastName)} (${r.author.email}) · ${formatDate(r.createdAt)}`}
            badge={{ label: tOrg(`type.${r.organization.type}`), tone: 'info' }}
            actions={
              canDelete ? (
                <Button
                  label={t('orgReviews.delete')}
                  variant="danger"
                  onPress={() => setPending(r)}
                />
              ) : undefined
            }
          />
        )}
      />

      <ReasonPromptDialog
        visible={pending != null}
        title={t('orgReviews.deleteTitle')}
        message={t('orgReviews.deleteBody')}
        label={t('orgReviews.reasonLabel')}
        confirmLabel={t('orgReviews.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={del.isPending}
        onCancel={() => setPending(null)}
        onConfirm={(reason) => {
          if (!pending) return;
          del.mutate(
            { reviewId: pending.id, reason: reason.trim() || undefined },
            {
              onSuccess: () => {
                toast.show({ message: t('orgReviews.deleted'), tone: 'success' });
                setPending(null);
              },
              onError: (e) => {
                toast.show({ message: apiErrorMessage(e), tone: 'danger' });
                setPending(null);
              },
            },
          );
        }}
      />
    </>
  );
}
