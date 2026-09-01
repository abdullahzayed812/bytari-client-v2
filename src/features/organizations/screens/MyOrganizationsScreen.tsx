import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { OrganizationCard, OrganizationCardSkeleton } from '../components';
import { useOrganizations } from '../hooks';
import type { MyOrganization } from '../types';

/** "My Organizations" — every org the vet is an ACTIVE member of. Backend-scoped. */
export default function MyOrganizationsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const q = useOrganizations();

  const goToDetail = (org: MyOrganization) => router.push(Routes.organizationDetail(org.id));
  const goToCreate = () => router.push(Routes.organizationsCreate);

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('list.title')}
        showBack
        right={
          <IconButton
            icon="add"
            variant="soft"
            accessibilityLabel={t('list.createCta')}
            onPress={goToCreate}
          />
        }
      />

      {q.isLoading ? (
        <View
          style={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.md,
            rowGap: theme.spacing.md,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <OrganizationCardSkeleton key={i} />
          ))}
        </View>
      ) : q.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.organizations}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => (
            <OrganizationCard organization={item} onPress={() => goToDetail(item)} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="business-outline"
              title={t('list.empty')}
              message={t('list.emptyHint')}
              actionLabel={t('list.createCta')}
              onAction={goToCreate}
            />
          }
          ListFooterComponent={
            q.isFetchingNextPage ? <Loading label={t('list.loadingMore')} /> : null
          }
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingBottom: theme.spacing.huge,
            rowGap: theme.spacing.md,
            flexGrow: 1,
          }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
          }}
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching && !q.isFetchingNextPage}
              onRefresh={() => void q.refetch()}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </SafeAreaScreen>
  );
}
