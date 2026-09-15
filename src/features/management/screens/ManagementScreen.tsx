import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native';

import { IconButton, TextButton } from '@/components/actions';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { Row, SafeAreaScreen } from '@/components/layout';
import { Label } from '@/components/typography';
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
} from '../components';
import { DASHBOARD_CARD_DEFS } from '../config/dashboardCards';

const WIDE_BREAKPOINT = 900;

/**
 * Admin dashboard — screenshot-matched card grid + real counts
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

  const cardLabel = (id: AdminDashboardCardId) => t(`dashboard.cards.${id}.title`);

  const visibleCards = useMemo(
    () => DASHBOARD_CARD_DEFS.filter((card) => card.show(caps)),
    [caps],
  );

  const countFor = (id: AdminDashboardCardId): number =>
    summary.data?.cards.find((c) => c.id === id)?.count ?? 0;

  const openCard = (card: (typeof DASHBOARD_CARD_DEFS)[number]) => {
    if (countFor(card.id) > 0) markSeen.mutate(card.id);
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
  const name = fullName(user?.firstName, user?.lastName) || user?.email || '';
  const roleLabel = caps.isAdmin ? t('dashboard.header.roleAdmin') : t('dashboard.header.roleSupervisor');

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
        padding: theme.screenPadding,
        paddingBottom: theme.spacing.huge,
        rowGap: theme.spacing.lg,
      }}
    >
      {!isWide ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton
            icon="arrow-forward"
            directional
            variant="plain"
            accessibilityLabel={t('dashboard.header.backA11y')}
            onPress={() => router.back()}
          />
        </View>
      ) : null}

      <AdminDashboardHeader
        name={name}
        roleLabel={roleLabel}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('dashboard.header.searchPlaceholder')}
        greeting={t('dashboard.header.greeting', { name })}
        subtitle={t('dashboard.header.subtitle')}
      />

      {filteredCards.length === 0 && visibleCards.length > 0 ? (
        <EmptyState icon="search-outline" title={t('dashboard.header.noSearchResults')} />
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
          {filteredCards.map((card) => (
            <AdminDashboardCard
              key={card.id}
              icon={card.icon}
              tint={card.tint}
              title={t(`dashboard.cards.${card.id}.title`)}
              subtitle={t(`dashboard.cards.${card.id}.subtitle`)}
              count={countFor(card.id)}
              unit={t(`dashboard.cards.${card.id}.unit`)}
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
            gap: theme.spacing.lg,
            alignItems: 'flex-start',
          }}
        >
          <View style={{ flex: 1, width: '100%', rowGap: theme.spacing.sm }}>
            <Row justify="space-between">
              <Label>{t('dashboard.sections.recentActivity')}</Label>
              {canViewAuditLog ? (
                <TextButton
                  label={t('dashboard.viewAll')}
                  onPress={() => router.push(Routes.adminAuditLogs)}
                />
              ) : null}
            </Row>
            <AdminActivityFeed items={summary.data.recentActivity} />
          </View>
          <View style={{ flex: 1, width: '100%', rowGap: theme.spacing.sm }}>
            <Label>{t('dashboard.sections.pendingTasks')}</Label>
            <AdminPendingTasksList items={summary.data.pendingTasks} />
          </View>
        </View>
      ) : null}
    </ScrollView>
  );

  if (isWide) {
    return (
      <SafeAreaScreen>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <AdminDashboardSidebar cards={visibleCards} cardLabel={cardLabel} onCardPress={openCard} />
          <View style={{ flex: 1 }}>{mainContent}</View>
        </View>
      </SafeAreaScreen>
    );
  }

  return <SafeAreaScreen>{mainContent}</SafeAreaScreen>;
}
