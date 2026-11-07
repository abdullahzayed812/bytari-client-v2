import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, View } from 'react-native';

import { Button } from '@/components/actions';
import { Chip, Icon } from '@/components/content';
import { EmptyState, ErrorState, Skeleton, useToast } from '@/components/feedback';
import { SearchInput, Select } from '@/components/forms';
import { SafeAreaScreen, ScrollScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { IRAQ_GOVERNORATES } from '@/constants/governorates';
import { Routes } from '@/constants/routes';
import { useCapabilities } from '@/hooks';
import { useTheme } from '@/theme';

import { useAdminSearch } from '../components';
import {
  FarmProfileModal,
  LinkVetModal,
  ManageLinkModal,
  VetProfileModal,
  type LinkFormTarget,
} from '../components/poultrySupervision/SupervisionModals';
import {
  LinkedFarmCard,
  MetricCard,
  Pager,
  SegmentTabs,
  SoftCard,
  UnlinkedFarmCard,
  VetDirectoryCard,
} from '../components/poultrySupervision/SupervisionParts';
import { usePoultrySupervisionPage, usePoultrySupervisionSummary } from '../hooks';
import type {
  PoultrySupervisionFarm,
  PoultrySupervisionLinkedFarm,
  PoultrySupervisionSection,
  PoultrySupervisionVeterinarian,
  PoultrySupervisionVeterinarianRow,
  VeterinarianLinkState,
} from '../types';

const ALL = '__all__';

/**
 * `/admin/poultry-supervisors` — "إدارة ارتباط الأطباء بالحقول" (ADMIN or a
 * POULTRY_SUPERVISION supervisor — `poultry_supervision.manage`; the server
 * refuses everyone else). Opening the FULL vet / farm profile is offered to
 * the main ADMIN only. Laid out after the reference HTML:
 * 2×2 tappable counters (per governorate), the one-vet-per-farm banner,
 * segmented tabs (linked farms / unlinked farms / vets), search + governorate
 * + reset, "ربط طبيب بحقل", cards, numbered pagination (10 / 20 / 50) and the
 * manage / link / farm / vet modals. Search, governorate and paging all run
 * on the server.
 */
export default function AdminPoultrySupervisorsScreen() {
  const caps = useCapabilities();
  const { t } = useTranslation('admin');
  if (!caps.isAdmin && !caps.can('poultry_supervision.manage')) {
    return (
      <SafeAreaScreen>
        <AppHeader title={t('poultrySupervisors.title')} showBack />
        <EmptyState icon="lock-closed-outline" title={t('poultrySupervisors.adminOnly')} />
      </SafeAreaScreen>
    );
  }
  return <SupervisorsContent />;
}

type FarmLinks = PoultrySupervisionLinkedFarm['links'];
type VetLinks = PoultrySupervisionVeterinarianRow['links'];

function SupervisorsContent() {
  const caps = useCapabilities();
  const isMainAdmin = caps.isAdmin;
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const toast = useToast();

  const [tab, setTab] = useState<PoultrySupervisionSection>('linked-farms');
  const [vetLink, setVetLink] = useState<VeterinarianLinkState | undefined>(undefined);
  const [governorate, setGovernorate] = useState<string | undefined>(undefined);
  const { raw, setRaw, search, clear } = useAdminSearch();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Any filter / tab change starts again from page 1.
  useEffect(() => setPage(1), [tab, vetLink, governorate, search, pageSize]);

  const params = { page, pageSize, search, governorate };
  const summary = usePoultrySupervisionSummary(governorate);
  const linked = usePoultrySupervisionPage<PoultrySupervisionLinkedFarm>(
    'linked-farms',
    params,
    tab === 'linked-farms',
  );
  const unlinked = usePoultrySupervisionPage<PoultrySupervisionFarm>(
    'unlinked-farms',
    params,
    tab === 'unlinked-farms',
  );
  const vets = usePoultrySupervisionPage<PoultrySupervisionVeterinarianRow>(
    'veterinarians',
    { ...params, link: vetLink },
    tab === 'veterinarians',
  );
  const active = tab === 'linked-farms' ? linked : tab === 'unlinked-farms' ? unlinked : vets;

  // --- modals ---
  const [farmProfile, setFarmProfile] = useState<{
    farm: PoultrySupervisionFarm;
    links: FarmLinks;
  } | null>(null);
  const [vetProfile, setVetProfile] = useState<{
    vet: PoultrySupervisionVeterinarian;
    links: VetLinks;
  } | null>(null);
  const [manage, setManage] = useState<{ farm: PoultrySupervisionFarm; links: FarmLinks } | null>(
    null,
  );
  const [linkForm, setLinkForm] = useState<LinkFormTarget | null>(null);

  /** A vet opened from a farm: their links are known for that farm. */
  const openVetFromFarm = (
    vet: PoultrySupervisionVeterinarian,
    row: { farm: PoultrySupervisionFarm; links: FarmLinks },
  ) =>
    setVetProfile({
      vet,
      links: row.links
        .filter((l) => l.veterinarian.userId === vet.userId)
        .map(({ veterinarian: _v, ...l }) => ({
          ...l,
          farm: {
            organizationId: row.farm.organizationId,
            name: row.farm.name,
            governorate: row.farm.governorate,
          },
        })),
    });

  const resetFilters = () => {
    clear();
    setGovernorate(undefined);
    setVetLink(undefined);
  };

  const s = summary.data;
  const sectionTitle =
    tab === 'linked-farms'
      ? t('poultrySupervisors.sections.linked', { count: s?.linkedFarms ?? 0 })
      : tab === 'unlinked-farms'
        ? t('poultrySupervisors.sections.unlinked', { count: s?.unlinkedFarms ?? 0 })
        : t('poultrySupervisors.sections.vets', { count: active.data?.meta.total ?? 0 });
  const sectionHint =
    tab === 'linked-farms'
      ? t('poultrySupervisors.sections.linkedHint')
      : tab === 'unlinked-farms'
        ? t('poultrySupervisors.sections.unlinkedHint')
        : t('poultrySupervisors.sections.vetsHint');

  const governorateOptions = [
    { value: ALL, label: t('poultrySupervisors.allGovernorates') },
    ...IRAQ_GOVERNORATES.map((g) => ({ value: g, label: g })),
  ];

  const renderList = () => {
    if (active.isPending) {
      return [0, 1, 2].map((i) => (
        <SoftCard key={i} style={{ rowGap: 8 }}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} />
        </SoftCard>
      ));
    }
    if (active.isError) {
      return <ErrorState error={active.error} onRetry={() => void active.refetch()} />;
    }
    if ((active.data?.items.length ?? 0) === 0) {
      const filtered = Boolean(search || governorate);
      return (
        <EmptyState
          icon="search-outline"
          title={
            filtered ? t('poultrySupervisors.noResults') : t(`poultrySupervisors.empty.${tab}`)
          }
          message={filtered ? t('poultrySupervisors.noResultsHint') : undefined}
        />
      );
    }
    if (tab === 'linked-farms') {
      return (linked.data?.items ?? []).map((row) => (
        <LinkedFarmCard
          key={row.farm.organizationId}
          row={row}
          onOpenFarm={() => setFarmProfile(row)}
          onOpenVet={(vet) => openVetFromFarm(vet, row)}
          onManage={() => setManage(row)}
        />
      ));
    }
    if (tab === 'unlinked-farms') {
      return (unlinked.data?.items ?? []).map((farm) => (
        <UnlinkedFarmCard
          key={farm.organizationId}
          farm={farm}
          onOpenFarm={() => setFarmProfile({ farm, links: [] })}
          onLink={() => setLinkForm({ mode: 'link', farmId: farm.organizationId })}
        />
      ));
    }
    return (vets.data?.items ?? []).map((row) => (
      <VetDirectoryCard
        key={row.veterinarian.userId}
        row={row}
        onOpenVet={() => setVetProfile({ vet: row.veterinarian, links: row.links })}
        onUpdate={() => {
          const first = row.links[0];
          if (!first) {
            setLinkForm({ mode: 'link', vetId: row.veterinarian.userId });
            return;
          }
          // "تحديث الارتباط" → manage the farm this vet supervises.
          setManage({
            farm: {
              organizationId: first.farm.organizationId,
              name: first.farm.name,
              governorate: first.farm.governorate,
            } as PoultrySupervisionFarm,
            links: row.links
              .filter((l) => l.farm.organizationId === first.farm.organizationId)
              .map(({ farm: _f, ...l }) => ({ ...l, veterinarian: row.veterinarian })),
          });
        }}
      />
    ));
  };

  return (
    <ScrollScreen
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={active.isRefetching}
            onRefresh={() => {
              void summary.refetch();
              void active.refetch();
            }}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        ),
      }}
    >
      <AppHeader title={t('poultrySupervisors.title')} showBack />

      <View style={{ rowGap: theme.spacing.lg, paddingBottom: theme.spacing.huge }}>
        {/* title block + breadcrumb */}
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="medkit-outline" size="iconMd" color="primary" />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="title">{t('poultrySupervisors.pageTitle')}</Text>
            <Caption>{t('poultrySupervisors.breadcrumb')}</Caption>
          </View>
        </View>

        {/* 2×2 counters — follow the governorate filter */}
        <View style={{ rowGap: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
            <MetricCard
              icon="link-outline"
              iconColor="primary"
              surface="primarySoft"
              value={s?.linkedFarms}
              label={t('poultrySupervisors.metrics.linkedFarms')}
              onPress={() => setTab('linked-farms')}
            />
            <MetricCard
              icon="unlink-outline"
              iconColor="danger"
              surface="dangerSoft"
              value={s?.unlinkedFarms}
              label={t('poultrySupervisors.metrics.unlinkedFarms')}
              onPress={() => setTab('unlinked-farms')}
            />
          </View>
          <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
            <MetricCard
              icon="people-outline"
              iconColor="dashboardMintAccent"
              surface="dashboardMintSurface"
              value={s?.linkedVeterinarians}
              label={t('poultrySupervisors.metrics.linkedVets')}
              onPress={() => {
                setVetLink('linked');
                setTab('veterinarians');
              }}
            />
            <MetricCard
              icon="person-add-outline"
              iconColor="dashboardTealAccent"
              surface="dashboardTealSurface"
              value={s?.unlinkedVeterinarians}
              label={t('poultrySupervisors.metrics.unlinkedVets')}
              onPress={() => {
                setVetLink('unlinked');
                setTab('veterinarians');
              }}
            />
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            columnGap: 6,
            backgroundColor: theme.colors.primarySoft,
            borderRadius: theme.radius.lg,
            paddingVertical: 10,
            paddingHorizontal: 12,
          }}
        >
          <Icon name="information-circle-outline" size="iconXs" color="primary" />
          <Caption color="primary" style={{ flexShrink: 1, textAlign: 'center' }}>
            {t('poultrySupervisors.banner')}
          </Caption>
        </View>

        <SegmentTabs<PoultrySupervisionSection>
          value={tab}
          onChange={setTab}
          options={[
            {
              value: 'linked-farms',
              label: t('poultrySupervisors.tabs.linked'),
              icon: 'link-outline',
            },
            {
              value: 'unlinked-farms',
              label: t('poultrySupervisors.tabs.unlinked'),
              icon: 'unlink-outline',
            },
            {
              value: 'veterinarians',
              label: t('poultrySupervisors.tabs.vets'),
              icon: 'medkit-outline',
            },
          ]}
        />

        {/* search + governorate + reset, then the primary action */}
        <View style={{ rowGap: theme.spacing.sm }}>
          <SearchInput
            value={raw}
            onChangeText={setRaw}
            onClear={clear}
            placeholder={t('poultrySupervisors.searchPlaceholder')}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Select
                value={governorate ?? ALL}
                options={governorateOptions}
                placeholder={t('poultrySupervisors.allGovernorates')}
                onChange={(v) => setGovernorate(v === ALL ? undefined : v)}
                searchable
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('poultrySupervisors.resetFilters')}
              onPress={resetFilters}
              style={{
                width: 48,
                height: 48,
                borderRadius: theme.radius.lg,
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="refresh-outline" size="iconSm" color="textSecondary" />
            </Pressable>
          </View>
          <Button
            label={t('poultrySupervisors.linkVetToFarmCta')}
            leftIcon="add"
            fullWidth
            onPress={() => setLinkForm({ mode: 'link' })}
          />
        </View>

        <View style={{ rowGap: 2 }}>
          <Text variant="subtitle">{sectionTitle}</Text>
          <Caption>{sectionHint}</Caption>
        </View>

        {tab === 'veterinarians' ? (
          <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
            {(
              [
                [undefined, t('poultrySupervisors.vetFilter.all')],
                ['linked', t('poultrySupervisors.vetFilter.linked')],
                ['unlinked', t('poultrySupervisors.vetFilter.unlinked')],
              ] as const
            ).map(([v, label]) => (
              <Chip
                key={label}
                label={label}
                selected={vetLink === v}
                onPress={() => setVetLink(v)}
              />
            ))}
          </View>
        ) : null}

        <View style={{ rowGap: theme.spacing.md }}>{renderList()}</View>

        {active.data && active.data.meta.total > 0 ? (
          <Pager
            page={page}
            totalPages={active.data.meta.totalPages}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={setPageSize}
          />
        ) : null}
      </View>

      <FarmProfileModal
        farm={farmProfile?.farm ?? null}
        links={farmProfile?.links ?? []}
        onClose={() => setFarmProfile(null)}
        onOpenVet={(vet) => {
          const row = farmProfile;
          setFarmProfile(null);
          if (row) openVetFromFarm(vet, row);
        }}
        onManage={() => {
          const row = farmProfile;
          setFarmProfile(null);
          if (row) setManage(row);
        }}
        onLink={() => {
          const farmId = farmProfile?.farm.organizationId;
          setFarmProfile(null);
          setLinkForm({ mode: 'link', farmId });
        }}
        onOpenFullFile={
          isMainAdmin
            ? () => {
                const id = farmProfile?.farm.organizationId;
                setFarmProfile(null);
                if (id) router.push(Routes.adminFarm(id));
              }
            : undefined
        }
      />

      <VetProfileModal
        vet={vetProfile?.vet ?? null}
        links={vetProfile?.links ?? []}
        onClose={() => setVetProfile(null)}
        onOpenFullProfile={
          isMainAdmin
            ? () => {
                const id = vetProfile?.vet.userId;
                setVetProfile(null);
                if (id) router.push(Routes.adminUser(id));
              }
            : undefined
        }
      />

      <ManageLinkModal
        farm={manage?.farm ?? null}
        links={manage?.links ?? []}
        onClose={() => setManage(null)}
        onChangeVet={(link) => {
          const farm = manage?.farm;
          setManage(null);
          if (farm) setLinkForm({ mode: 'change', farm, link });
        }}
      />

      <LinkVetModal
        target={linkForm}
        onClose={() => setLinkForm(null)}
        onDone={(message) => {
          setLinkForm(null);
          toast.show({ tone: 'success', message });
        }}
      />
    </ScrollScreen>
  );
}
