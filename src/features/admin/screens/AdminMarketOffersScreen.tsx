import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { ConfirmationDialog, Skeleton, useToast } from '@/components/feedback';
import { ImageThumbnailRow, ImageViewer } from '@/components/media';
import { Label } from '@/components/typography';
import { Routes } from '@/constants/routes';
import {
  useAdminDeleteEggOffer,
  useAdminDeletePoultryOffer,
  useAdminEggOffers,
  useAdminPoultryOffers,
  useModerateEggOffer,
  useModeratePoultryOffer,
} from '@/features/poultryMarket';
import type { EggOffer, MarketModerationStatus, PoultryOffer } from '@/features/poultryMarket';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import {
  AdminDetailModal,
  AdminListScreen,
  AdminRow,
  FilterChips,
  ReasonPromptDialog,
} from '../components';

type Offer = PoultryOffer | EggOffer;
type Kind = 'poultry' | 'egg';

/**
 * `/admin/market-offers/[kind]` — poultry / egg advertisement moderation:
 * approve / reject PENDING ads (only approved ads are public), view all,
 * delete any. Defaults to the PENDING queue.
 */
export default function AdminMarketOffersScreen() {
  const params = useLocalSearchParams<{ kind: Kind }>();
  const { t } = useTranslation('admin');
  const { t: tm } = useTranslation('poultryMarket');
  const theme = useTheme();
  const toast = useToast();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [detail, setDetail] = useState<Offer | null>(null);
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);
  const [kind, setKind] = useState<Kind>(params.kind === 'egg' ? 'egg' : 'poultry');

  const [moderation, setModeration] = useState<MarketModerationStatus | undefined>('PENDING');
  const [rejecting, setRejecting] = useState<string | null>(null);

  const isEgg = kind === 'egg';
  const poultryQuery = useAdminPoultryOffers({
    page: 1,
    pageSize: 20,
    moderationStatus: moderation,
  });
  const eggQuery = useAdminEggOffers({ page: 1, pageSize: 20, moderationStatus: moderation });
  const deletePoultry = useAdminDeletePoultryOffer();
  const deleteEgg = useAdminDeleteEggOffer();
  const moderatePoultry = useModeratePoultryOffer();
  const moderateEgg = useModerateEggOffer();
  const moderate = isEgg ? moderateEgg : moderatePoultry;

  const onApprove = (offerId: string) =>
    moderate.mutate(
      { offerId, decision: 'approve' },
      {
        onSuccess: () => toast.show({ message: t('marketOffers.toast.approved'), tone: 'success' }),
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  const onReject = (reason: string) => {
    if (!rejecting) return;
    moderate.mutate(
      { offerId: rejecting, decision: 'reject', reason },
      {
        onSuccess: () => {
          toast.show({ message: t('marketOffers.toast.rejected'), tone: 'success' });
          setRejecting(null);
        },
        onError: (e) => toast.show({ message: apiErrorMessage(e), tone: 'danger' }),
      },
    );
  };

  const query = isEgg ? eggQuery : poultryQuery;
  const del = isEgg ? deleteEgg : deletePoultry;
  const offers: Offer[] = isEgg ? eggQuery.offers : poultryQuery.offers;

  const onDelete = () => {
    if (!pendingDelete) return;
    del.mutate(
      { offerId: pendingDelete },
      {
        onSuccess: () => {
          toast.show({ message: t('marketOffers.toast.deleted'), tone: 'success' });
          setPendingDelete(null);
        },
        onError: (e) => {
          toast.show({ message: apiErrorMessage(e), tone: 'danger' });
          setPendingDelete(null);
        },
      },
    );
  };

  /** Every stored field of the ad — the reviewer sees the full record before deciding. */
  const offerDetailFields = (o: Offer) => {
    const seller = o.seller
      ? [o.seller.displayName, `${o.seller.firstName} ${o.seller.lastName}`.trim()]
          .filter(Boolean)
          .join(' — ')
      : null;
    const productFields =
      'birdType' in o
        ? [
            {
              label: tm('poultryMarket.fieldBirdType'),
              value: tm(`poultryMarket.birdType.${o.birdType}`),
            },
            { label: tm('poultryMarket.strainLabel'), value: o.breed },
            { label: tm('poultryMarket.quantityLabel'), value: String(o.quantity) },
            {
              label: tm('poultryMarket.pricingMethodLabel'),
              value: tm(`poultryMarket.pricingMethod.${o.pricingMethod}`),
            },
            {
              label: t('marketOffers.detail.totalPrice'),
              value: `${o.price} ${tm('poultryMarket.currency')}`,
            },
            {
              label: tm('poultryMarket.ageLabel'),
              value: o.ageWeeks != null ? `${o.ageWeeks} ${tm('poultryMarket.unitWeek')}` : null,
            },
            { label: tm('poultryMarket.weightLabel'), value: o.weightKg },
          ]
        : [
            { label: tm('eggMarket.fieldEggType'), value: tm(`eggMarket.eggType.${o.eggType}`) },
            { label: tm('eggMarket.sellUnitLabel'), value: tm(`eggMarket.sellUnit.${o.sellUnit}`) },
            { label: tm('eggMarket.fieldQuantity'), value: String(o.quantity) },
            {
              label: t('marketOffers.detail.totalPrice'),
              value: `${o.pricePerUnit} ${tm('poultryMarket.currency')}`,
            },
          ];
    return [
      { label: t('marketOffers.detail.seller'), value: seller },
      { label: t('marketOffers.detail.sellerAccount'), value: o.seller?.email ?? null },
      ...productFields,
      { label: tm('poultryMarket.governorateLabel'), value: o.governorate },
      { label: tm('poultryMarket.districtLabel'), value: o.district },
      { label: tm('poultryMarket.phoneLabel'), value: o.phone },
      { label: t('marketOffers.detail.whatsapp'), value: o.whatsapp },
      { label: tm('poultryMarket.notesLabel'), value: o.notes },
      { label: t('marketOffers.detail.status'), value: t(`marketOffers.status.${o.status}`) },
      {
        label: t('marketOffers.detail.moderation'),
        value: t(`marketOffers.moderation.${o.moderationStatus ?? 'APPROVED'}`),
      },
      { label: t('marketOffers.detail.rejectionReason'), value: o.rejectionReason ?? null },
      { label: t('marketOffers.detail.createdAt'), value: formatDate(o.createdAt) },
      { label: t('marketOffers.detail.updatedAt'), value: formatDate(o.updatedAt) },
    ];
  };

  return (
    <>
      <AdminListScreen<Offer>
        title={t('marketOffers.title')}
        query={query}
        data={offers}
        keyExtractor={(o) => o.id}
        skeletonRow={
          <View style={{ rowGap: 8, padding: theme.spacing.md }}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} />
          </View>
        }
        emptyIcon="egg-outline"
        emptyTitle={t('marketOffers.empty')}
        emptyMessage={t('marketOffers.emptyHint')}
        loadingMoreLabel={t('common.loadingMore')}
        filterBar={
          <View style={{ rowGap: theme.spacing.xs }}>
            <FilterChips<Kind>
              value={kind}
              onChange={(v) => setKind(v ?? 'poultry')}
              options={[
                { value: 'poultry', label: t('marketOffers.tab.poultry') },
                { value: 'egg', label: t('marketOffers.tab.egg') },
              ]}
            />
            <FilterChips<MarketModerationStatus>
              value={moderation}
              onChange={setModeration}
              options={[
                { value: undefined, label: t('marketOffers.moderation.ALL') },
                { value: 'PENDING', label: t('marketOffers.moderation.PENDING') },
                { value: 'APPROVED', label: t('marketOffers.moderation.APPROVED') },
                { value: 'REJECTED', label: t('marketOffers.moderation.REJECTED') },
              ]}
            />
          </View>
        }
        renderItem={(o) => (
          <AdminRow
            title={
              'birdType' in o
                ? `${tm(`poultryMarket.birdType.${o.birdType}`)} · ${o.quantity}`
                : `${tm(`eggMarket.eggType.${o.eggType}`)} · ${o.quantity}`
            }
            subtitle={[
              o.seller?.displayName ??
                (o.seller ? `${o.seller.firstName} ${o.seller.lastName}`.trim() : null),
              [o.governorate, o.district].filter(Boolean).join(' - '),
            ]
              .filter(Boolean)
              .join(' — ')}
            meta={`${'price' in o ? o.price : o.pricePerUnit} ${tm('poultryMarket.currency')} · ${formatDate(o.createdAt)}`}
            onPress={() => setDetail(o)}
            image={{
              uri: o.imageUrls[0] ?? null,
              fallbackIcon: isEgg ? 'egg-outline' : 'nutrition-outline',
              onPress:
                o.imageUrls.length > 0
                  ? () => setViewer({ images: o.imageUrls, index: 0 })
                  : undefined,
            }}
            badge={
              o.status === 'REMOVED'
                ? { label: t('marketOffers.status.REMOVED'), tone: 'danger' }
                : {
                    label: t(`marketOffers.moderation.${o.moderationStatus ?? 'APPROVED'}`),
                    tone:
                      o.moderationStatus === 'PENDING'
                        ? 'info'
                        : o.moderationStatus === 'REJECTED'
                          ? 'danger'
                          : 'success',
                  }
            }
            actions={
              <>
                {o.imageUrls.length > 0 ? (
                  // `width: '100%'` — `AdminRow`'s `actions` slot is a wrapping flex ROW.
                  <View style={{ width: '100%', rowGap: theme.spacing.xs }}>
                    <Label>{t('marketOffers.images')}</Label>
                    <ImageThumbnailRow
                      images={o.imageUrls}
                      size={64}
                      onPress={(index) => setViewer({ images: o.imageUrls, index })}
                    />
                  </View>
                ) : null}
                {o.status === 'ACTIVE' && o.moderationStatus === 'PENDING' ? (
                  <>
                    <Button
                      label={t('marketOffers.approve')}
                      variant="primary"
                      disabled={moderate.isPending}
                      onPress={() => onApprove(o.id)}
                    />
                    <Button
                      label={t('marketOffers.reject')}
                      variant="outline"
                      onPress={() => setRejecting(o.id)}
                    />
                  </>
                ) : null}
                {o.status === 'ACTIVE' ? (
                  <Button
                    label={t('marketOffers.deleteAction')}
                    variant="danger"
                    onPress={() => setPendingDelete(o.id)}
                  />
                ) : null}
              </>
            }
          />
        )}
      />

      <ConfirmationDialog
        visible={pendingDelete != null}
        title={t('marketOffers.deleteConfirmTitle')}
        message={t('marketOffers.deleteConfirmBody')}
        confirmLabel={t('marketOffers.deleteAction')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={del.isPending}
        onConfirm={onDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <ReasonPromptDialog
        visible={rejecting != null}
        title={t('marketOffers.rejectTitle')}
        message={t('marketOffers.rejectBody')}
        label={t('marketOffers.reasonLabel')}
        confirmLabel={t('marketOffers.reject')}
        cancelLabel={t('common.cancel')}
        required
        destructive
        loading={moderate.isPending}
        onConfirm={onReject}
        onCancel={() => setRejecting(null)}
      />

      <AdminDetailModal
        visible={detail != null}
        onClose={() => setDetail(null)}
        title={t('marketOffers.detail.title')}
        fields={detail ? offerDetailFields(detail) : []}
      >
        {detail && detail.imageUrls.length > 0 ? (
          <ImageThumbnailRow
            images={detail.imageUrls}
            size={88}
            onPress={(index) => setViewer({ images: detail.imageUrls, index })}
          />
        ) : null}
        {detail?.seller ? (
          <Button
            label={t('marketOffers.detail.viewSeller')}
            variant="outline"
            leftIcon="person-outline"
            onPress={() => {
              const userId = detail.traderUserId;
              setDetail(null);
              router.push(Routes.adminUser(userId));
            }}
          />
        ) : null}
      </AdminDetailModal>

      <ImageViewer
        visible={viewer !== null}
        images={viewer?.images ?? []}
        initialIndex={viewer?.index ?? 0}
        onClose={() => setViewer(null)}
      />
    </>
  );
}
