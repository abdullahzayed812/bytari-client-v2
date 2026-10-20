import { router, useLocalSearchParams } from 'expo-router';
import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Badge } from '@/components/content';
import { Skeleton } from '@/components/feedback';
import { ImageViewer } from '@/components/media';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import {
  AdminListScreen,
  AdminRow,
  AdminSearchBar,
  FilterChips,
  ViewUserProfileButton,
  useAdminSearch,
  useCanOpenAdminUser,
} from '../components';
import { useAdminFarms } from '../hooks';
import type { AdminFarmListItem, FarmSpeciesGroup, OrganizationStatus } from '../types';

type Scope = 'all' | 'pending' | 'active' | 'rejected' | 'expired' | 'deleted' | 'renewals';

function scopeFilter(scope: Scope): {
  status?: OrganizationStatus;
  subscriptionStatus?: 'EXPIRED';
  renewal?: 'PENDING';
} {
  if (scope === 'pending') return { status: 'PENDING' };
  // Farms with an open renewal request — exactly the dashboard card's counter.
  if (scope === 'renewals') return { renewal: 'PENDING' };
  if (scope === 'active') return { status: 'ACTIVE' };
  if (scope === 'rejected') return { status: 'REJECTED' };
  if (scope === 'expired') return { subscriptionStatus: 'EXPIRED' };
  // admin "حذف" is the organizations soft delete → DEACTIVATED (hidden from "all")
  if (scope === 'deleted') return { status: 'DEACTIVATED' };
  return {};
}

function statusTone(s: OrganizationStatus): 'success' | 'warning' | 'danger' | 'info' {
  if (s === 'ACTIVE') return 'success';
  if (s === 'PENDING') return 'info';
  if (s === 'SUSPENDED') return 'warning';
  return 'danger';
}

type LivestockScope = 'LIVESTOCK' | 'SHEEP' | 'CATTLE';

/** One-line summary of what the farm currently runs, e.g. «2 قطيع نشط · 1 دفعة أغنام نشطة». */
function countsLine(f: AdminFarmListItem, t: TFunction<'admin'>): string | null {
  const parts: string[] = [];
  if (f.poultryFlockCount) parts.push(t('farms.rowCounts.POULTRY', { count: f.poultryFlockCount }));
  if (f.sheepBatchCount) parts.push(t('farms.rowCounts.SHEEP', { count: f.sheepBatchCount }));
  if (f.cattleBatchCount) parts.push(t('farms.rowCounts.CATTLE', { count: f.cattleBatchCount }));
  return parts.length ? parts.join(' · ') : null;
}

/**
 * `/admin/farms?species=POULTRY|LIVESTOCK|SHEEP|CATTLE` — farm-request /
 * subscription management, scoped to one species family. The livestock entry
 * gets a sheep / cattle sub-filter; the backend enforces the same scope.
 */
export default function AdminFarmsScreen() {
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const { species } = useLocalSearchParams<{ species?: string }>();
  const isPoultry = species !== 'LIVESTOCK' && species !== 'SHEEP' && species !== 'CATTLE';
  const [livestock, setLivestock] = useState<LivestockScope>(
    species === 'SHEEP' || species === 'CATTLE' ? species : 'LIVESTOCK',
  );
  const speciesGroup: FarmSpeciesGroup = isPoultry ? 'POULTRY' : livestock;
  const [scope, setScope] = useState<Scope>('all');
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const { raw: rawSearch, setRaw: setRawSearch, search } = useAdminSearch();
  const canOpenUser = useCanOpenAdminUser();

  const q = useAdminFarms({ ...scopeFilter(scope), speciesGroup, search });

  return (
    <>
      <AdminListScreen
        title={isPoultry ? t('farms.titlePoultry') : t('farms.titleLivestock')}
        query={q}
        data={q.farms}
        keyExtractor={(f) => f.organizationId}
        skeletonRow={
          <View style={{ rowGap: 8, padding: theme.spacing.md }}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} />
          </View>
        }
        emptyIcon={isPoultry ? 'egg-outline' : 'paw-outline'}
        emptyTitle={t('farms.empty')}
        emptyMessage={t('farms.emptyHint')}
        loadingMoreLabel={t('common.loadingMore')}
        searchTerm={search}
        filterBar={
          <View style={{ rowGap: theme.spacing.xs }}>
            <AdminSearchBar
              value={rawSearch}
              onChangeText={setRawSearch}
              placeholder={t('search.placeholders.farms')}
            />
            {isPoultry ? null : (
              <FilterChips<LivestockScope>
                value={livestock}
                onChange={(v) => setLivestock(v ?? 'LIVESTOCK')}
                options={[
                  { value: 'LIVESTOCK', label: t('farms.species.allLivestock') },
                  { value: 'SHEEP', label: t('farms.species.SHEEP') },
                  { value: 'CATTLE', label: t('farms.species.CATTLE') },
                ]}
              />
            )}
            <FilterChips<Scope>
              value={scope}
              onChange={(v) => setScope(v ?? 'all')}
              options={[
                { value: 'all', label: t('farms.tab.all') },
                { value: 'pending', label: t('farms.tab.pending') },
                { value: 'active', label: t('farms.tab.active') },
                { value: 'rejected', label: t('orgs.status.REJECTED') },
                { value: 'expired', label: t('farms.tab.expired') },
                { value: 'renewals', label: t('farms.tab.renewals') },
                { value: 'deleted', label: t('farms.tab.deleted') },
              ]}
            />
          </View>
        }
        renderItem={(f) => (
          <AdminRow
            title={f.name}
            subtitle={[
              `${t('farms.ownerLabel')}: ${f.ownerName}`,
              f.farmSpecies ? t(`farms.species.${f.farmSpecies}`) : null,
              f.governorate ?? f.location ?? null,
            ]
              .filter(Boolean)
              .join(' · ')}
            meta={
              [
                f.contactPhone ?? f.ownerPhone ?? null,
                countsLine(f, t),
                f.subscriptionEndDate
                  ? t('farms.subscriptionUntil', { date: formatDate(f.subscriptionEndDate) })
                  : null,
              ]
                .filter(Boolean)
                .join(' · ') || undefined
            }
            image={{
              uri: f.imageUrl ?? null,
              fallbackIcon: 'home-outline',
              onPress: f.imageUrl ? () => setViewerImage(f.imageUrl as string) : undefined,
            }}
            badge={{ label: t(`orgs.status.${f.status}`), tone: statusTone(f.status) }}
            actions={
              f.status === 'ACTIVE' || canOpenUser ? (
                <>
                  {f.status === 'ACTIVE' ? (
                    <Badge
                      label={t(`farms.subscriptionStatus.${f.subscriptionStatus}`)}
                      tone={f.subscriptionStatus === 'EXPIRED' ? 'danger' : 'success'}
                      size="sm"
                    />
                  ) : null}
                  {f.status === 'ACTIVE' && f.hasOpenRenewalRequest ? (
                    <Badge label={t('farms.renewalPendingBadge')} tone="warning" size="sm" />
                  ) : null}
                  {canOpenUser ? (
                    <ViewUserProfileButton
                      userId={f.ownerUserId}
                      label={t('userLink.viewOwnerProfile')}
                      fullWidth={false}
                    />
                  ) : null}
                </>
              ) : undefined
            }
            onPress={() => router.push(Routes.adminFarm(f.organizationId))}
          />
        )}
      />

      <ImageViewer
        visible={viewerImage !== null}
        images={viewerImage ? [viewerImage] : []}
        onClose={() => setViewerImage(null)}
      />
    </>
  );
}
