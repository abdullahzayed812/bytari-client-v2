import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { ConfirmationDialog, Skeleton, useToast } from '@/components/feedback';
import { ImageThumbnailRow, ImageViewer } from '@/components/media';
import { Label } from '@/components/typography';
import {
  useAdminDeleteEggOffer,
  useAdminDeletePoultryOffer,
  useAdminEggOffers,
  useAdminPoultryOffers,
} from '@/features/poultryMarket';
import type { EggOffer, PoultryOffer } from '@/features/poultryMarket';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { AdminListScreen, AdminRow, FilterChips } from '../components';

type Offer = PoultryOffer | EggOffer;
type Kind = 'poultry' | 'egg';

/** `/admin/market-offers/[kind]` — poultry/egg offer moderation (view all, delete any). */
export default function AdminMarketOffersScreen() {
  const params = useLocalSearchParams<{ kind: Kind }>();
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const toast = useToast();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ images: string[]; index: number } | null>(null);
  const [kind, setKind] = useState<Kind>(params.kind === 'egg' ? 'egg' : 'poultry');

  const isEgg = kind === 'egg';
  const poultryQuery = useAdminPoultryOffers({ page: 1, pageSize: 20 });
  const eggQuery = useAdminEggOffers({ page: 1, pageSize: 20 });
  const deletePoultry = useAdminDeletePoultryOffer();
  const deleteEgg = useAdminDeleteEggOffer();

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
          <FilterChips<Kind>
            value={kind}
            onChange={(v) => setKind(v ?? 'poultry')}
            options={[
              { value: 'poultry', label: t('marketOffers.tab.poultry') },
              { value: 'egg', label: t('marketOffers.tab.egg') },
            ]}
          />
        }
        renderItem={(o) => (
          <AdminRow
            title={[o.governorate, o.district].filter(Boolean).join(' - ')}
            subtitle={o.phone}
            image={{
              uri: o.imageUrls[0] ?? null,
              fallbackIcon: isEgg ? 'egg-outline' : 'nutrition-outline',
              onPress:
                o.imageUrls.length > 0
                  ? () => setViewer({ images: o.imageUrls, index: 0 })
                  : undefined,
            }}
            badge={{
              label: t(`marketOffers.status.${o.status}`),
              tone: o.status === 'ACTIVE' ? 'success' : 'danger',
            }}
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

      <ImageViewer
        visible={viewer !== null}
        images={viewer?.images ?? []}
        initialIndex={viewer?.index ?? 0}
        onClose={() => setViewer(null)}
      />
    </>
  );
}
