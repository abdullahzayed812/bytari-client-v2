import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useAdminDashboardSummary, useMarkDashboardCardSeen } from '@/features/admin/hooks';
import type { AdminDashboardCardId } from '@/features/admin/types';
import { useAuth, useCapabilities } from '@/hooks';
import { useTheme } from '@/theme';
import { fullName } from '@/utils';

import {
  AdminActivityFeed,
  AdminDashboardCard,
  AdminDashboardHeader,
  AdminDashboardSidebar,
  AdminPendingTasksList,
  AdminWelcomeBanner,
} from '../components';
import { DASHBOARD_CARD_DEFS } from '../config/dashboardCards';

const WIDE_BREAKPOINT = 900;
const GRID_GAP = 10;
/** Below this grid width it is the reference's 3-column phone grid. */
const WIDE_GRID_MIN = 600;
const WIDE_CARD_MIN = 170;

/**
 * Admin dashboard — laid out after the `لوحة التحكم.html` reference (sticky
 * top bar + section search, gradient welcome banner, 3-column card grid,
 * activity cards) with the real data: card grid + real counts
 * (`GET /admin/dashboard/summary`) + recent activity + pending tasks. Every
 * card keeps the exact RBAC gate the old plain-list `ManagementScreen` used
 * per area (`DASHBOARD_CARD_DEFS[].show`) — this redesign changes
 * presentation and adds data, not who can see what. Renders a fixed dark
 * sidebar shell on wide/web viewports (`WIDE_BREAKPOINT`) and a normal
 * single-column mobile screen below it — the grid itself needs no separate
 * layout branch (flex-wrap reflows column count on its own).
 */
export default function ManagementScreen() {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const { t: tAuth } = useTranslation('auth');
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const caps = useCapabilities();
  const { user } = useAuth();
  const summary = useAdminDashboardSummary();
  const markSeen = useMarkDashboardCardSeen();
  const [search, setSearch] = useState('');
  const [gridWidth, setGridWidth] = useState(0);
  const columns =
    gridWidth < WIDE_GRID_MIN
      ? 3
      : Math.max(3, Math.floor((gridWidth + GRID_GAP) / (WIDE_CARD_MIN + GRID_GAP)));
  // Floor so rounding never pushes the last column onto the next row; before
  // the first layout pass a 3-column percentage keeps the grid visible.
  const cardWidth =
    gridWidth > 0 ? Math.floor((gridWidth - GRID_GAP * (columns - 1)) / columns) : '31%';

  const cardLabel = (id: AdminDashboardCardId) => t(`dashboard.cards.${id}.title`);

  const visibleCards = useMemo(() => DASHBOARD_CARD_DEFS.filter((card) => card.show(caps)), [caps]);

  const serverCount = (id: AdminDashboardCardId): number =>
    summary.data?.cards.find((c) => c.id === id)?.count ?? 0;
  const idsOf = (id: AdminDashboardCardId): AdminDashboardCardId[] =>
    DASHBOARD_CARD_DEFS.find((d) => d.id === id)?.mergedIds ?? [id];

  // A merged tile (e.g. "الدورات والندوات") sums its server counters.
  const countFor = (id: AdminDashboardCardId): number =>
    idsOf(id).reduce((sum, i) => sum + serverCount(i), 0);

  const activeCountFor = (id: AdminDashboardCardId): number =>
    idsOf(id).reduce(
      (sum, i) => sum + (summary.data?.cards.find((c) => c.id === i)?.activeCount ?? 0),
      0,
    );

  const pendingRenewalsFor = (id: AdminDashboardCardId): number =>
    summary.data?.cards.find((c) => c.id === id)?.pendingRenewals ?? 0;

  // Course / seminar registrants awaiting review — summed over a merged tile.
  const pendingRegistrationsFor = (id: AdminDashboardCardId): number =>
    idsOf(id).reduce(
      (sum, i) => sum + (summary.data?.cards.find((c) => c.id === i)?.pendingRegistrations ?? 0),
      0,
    );

  const openCard = (card: (typeof DASHBOARD_CARD_DEFS)[number]) => {
    for (const id of idsOf(card.id)) if (serverCount(id) > 0) markSeen.mutate(id);
    router.push(card.route);
  };

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return visibleCards;
    return visibleCards.filter((card) => {
      const title = t(`dashboard.cards.${card.id}.title`).toLowerCase();
      const subtitle = t(`dashboard.cards.${card.id}.subtitle`).toLowerCase();
      return title.includes(q) || subtitle.includes(q);
    });
  }, [visibleCards, search, t]);

  const canViewAuditLog = caps.isAdmin || caps.can('audit.read');
  // "المهام المطلوبة" — only for callers who may act on at least one task kind.
  // The server already filters each task by its own permission (type-scoped);
  // this just avoids an empty section for e.g. a USERS-only supervisor.
  const canSeePendingTasks =
    caps.isAdmin ||
    caps.can('veterinarian.approve') ||
    caps.can('organization.admin.approve') ||
    caps.can('organization.admin.subscription');
  const name = fullName(user?.firstName, user?.lastName) || user?.email || '';
  const roleLabel = caps.isAdmin
    ? t('dashboard.header.roleAdmin')
    : t('dashboard.header.roleSupervisor');

  if (visibleCards.length === 0) {
    return (
      <SafeAreaScreen>
        <EmptyState
          icon="lock-closed-outline"
          title={tAuth('management.title')}
          message={tAuth('management.placeholder')}
        />
      </SafeAreaScreen>
    );
  }

  const header = (
    <AdminDashboardHeader
      name={name}
      roleLabel={roleLabel}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={t('dashboard.header.searchPlaceholder')}
      onBack={isWide ? undefined : () => router.back()}
      backA11y={t('dashboard.header.backA11y')}
    />
  );

  // Side by side on wide screens; stacked (natural height, no flex) on phones.
  const sectionStyle = isWide ? { flex: 1 } : { width: '100%' as const };

  const sectionTitle = (icon: IconName | null, label: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
      {icon ? <Icon name={icon} size={18} color="textSecondary" /> : null}
      <Text style={{ fontFamily: theme.fontFamily.displayBold, fontSize: 14, lineHeight: 20 }}>
        {label}
      </Text>
    </View>
  );

  const mainContent = (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={summary.isRefetching}
          onRefresh={() => void summary.refetch()}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
      contentContainerStyle={{
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 40,
        rowGap: 16,
      }}
    >
      <AdminWelcomeBanner
        greetingPrefix={t('dashboard.header.greetingPrefix')}
        name={name}
        subtitle={t('dashboard.header.subtitle')}
      />

      {filteredCards.length === 0 && visibleCards.length > 0 ? (
        <EmptyState icon="search-outline" title={t('dashboard.header.noSearchResults')} />
      ) : (
        // 3 columns on a phone (the reference); more on a wide/web viewport.
        <View
          onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
          style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP }}
        >
          {filteredCards.map((card) => (
            <AdminDashboardCard
              key={card.id}
              icon={card.icon}
              palette={card.palette}
              tint={card.tint}
              width={cardWidth}
              title={t(`dashboard.cards.${card.id}.title`)}
              subtitle={t(`dashboard.cards.${card.id}.subtitle`)}
              count={countFor(card.id)}
              activeCount={activeCountFor(card.id)}
              unit={t(`dashboard.cards.${card.id}.unit`)}
              secondaryLabel={
                pendingRenewalsFor(card.id) > 0
                  ? t('dashboard.renewalsPending', { count: pendingRenewalsFor(card.id) })
                  : pendingRegistrationsFor(card.id) > 0
                    ? t('dashboard.registrationsPending', {
                        count: pendingRegistrationsFor(card.id),
                      })
                    : undefined
              }
              loading={summary.isLoading}
              onPress={() => openCard(card)}
            />
          ))}
        </View>
      )}

      {summary.isLoading ? (
        <Loading />
      ) : summary.isError ? (
        <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />
      ) : summary.data ? (
        <View
          style={{
            flexDirection: isWide ? 'row' : 'column',
            gap: 16,
            alignItems: 'flex-start',
            marginTop: 16,
            paddingTop: 8,
          }}
        >
          {/* Recent activity is Admin-only (the server also returns none to supervisors). */}
          {caps.isAdmin ? (
            <View style={sectionStyle}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                  paddingHorizontal: 4,
                }}
              >
                {sectionTitle('time-outline', t('dashboard.sections.recentActivity'))}
                {canViewAuditLog ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push(Routes.adminAuditLogs)}
                    hitSlop={8}
                  >
                    <Text
                      style={{
                        fontFamily: theme.fontFamily.displayBold,
                        fontSize: 12,
                        lineHeight: 16,
                        color: theme.scheme === 'dark' ? theme.colors.primary : '#059669',
                      }}
                    >
                      {t('dashboard.viewAll')}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
              <AdminActivityFeed items={summary.data.recentActivity} />
            </View>
          ) : null}
          {canSeePendingTasks ? (
            <View style={sectionStyle}>
              <View style={{ marginBottom: 12, paddingHorizontal: 4 }}>
                {sectionTitle('checkmark-done-outline', t('dashboard.sections.pendingTasks'))}
              </View>
              <AdminPendingTasksList items={summary.data.pendingTasks} />
            </View>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );

  if (isWide) {
    return (
      <SafeAreaScreen>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <AdminDashboardSidebar
            cards={visibleCards}
            cardLabel={cardLabel}
            onCardPress={openCard}
          />
          <View style={{ flex: 1 }}>
            {header}
            {mainContent}
          </View>
        </View>
      </SafeAreaScreen>
    );
  }

  return (
    <SafeAreaScreen>
      {/* Sticky: the top bar + search stay put while the grid scrolls. */}
      {header}
      {mainContent}
    </SafeAreaScreen>
  );
}
