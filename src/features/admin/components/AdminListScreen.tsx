import type { ReactElement, ReactNode } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import type { IconName } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { useTheme } from '@/theme';

/** Minimal shape of a react-query infinite result the list scaffold needs. */
export interface InfiniteListQuery {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => Promise<unknown> | void;
  isRefetching: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => Promise<unknown> | void;
}

export interface AdminListScreenProps<T> {
  title: string;
  right?: ReactNode;
  /** Rendered under the header, above the list (filters). */
  filterBar?: ReactNode;
  query: InfiniteListQuery;
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactElement;
  /** A single skeleton row, repeated while loading. */
  skeletonRow: ReactElement;
  emptyIcon?: IconName;
  emptyTitle: string;
  emptyMessage?: string;
  loadingMoreLabel?: string;
}

export function AdminListScreen<T>({
  title,
  right,
  filterBar,
  query,
  data,
  keyExtractor,
  renderItem,
  skeletonRow,
  emptyIcon = 'file-tray-outline',
  emptyTitle,
  emptyMessage,
  loadingMoreLabel,
}: AdminListScreenProps<T>) {
  const theme = useTheme();

  return (
    <SafeAreaScreen>
      <AppHeader title={title} showBack right={right} />
      {filterBar}

      {query.isLoading ? (
        <View
          style={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.md,
            rowGap: theme.spacing.md,
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i}>{skeletonRow}</View>
          ))}
        </View>
      ) : query.isError ? (
        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          renderItem={({ item }) => renderItem(item)}
          ListEmptyComponent={
            <EmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />
          }
          ListFooterComponent={
            query.isFetchingNextPage ? <Loading label={loadingMoreLabel} /> : null
          }
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing.huge,
            rowGap: theme.spacing.md,
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              onRefresh={() => void query.refetch()}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </SafeAreaScreen>
  );
}
