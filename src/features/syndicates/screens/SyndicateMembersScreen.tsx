import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { Avatar, Card, Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SearchInput } from '@/components/forms';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { useSyndicateMembers } from '../hooks';

/**
 * Route `/(app)/syndicates/[organizationId]/members` — the syndicate admin's
 * list of registered members (`syndicate.member.read`, enforced server-side
 * for THIS syndicate only). Tapping a row opens the read-only member details.
 */
export default function SyndicateMembersScreen() {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(id);
  }, [search]);

  const q = useSyndicateMembers(organizationId, debounced);

  return (
    <SafeAreaScreen>
      <AppHeader title={t('members.title')} showBack />
      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.sm }}>
        <SearchInput
          value={search}
          onChangeText={setSearch}
          onClear={() => setSearch('')}
          placeholder={t('members.searchPlaceholder')}
        />
      </View>
      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.members}
          keyExtractor={(m) => m.registrationId}
          onEndReached={() => {
            if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
          }}
          onRefresh={() => void q.refetch()}
          refreshing={q.isRefetching && !q.isFetchingNextPage}
          renderItem={({ item }) => (
            <Card
              variant="outlined"
              padding="md"
              onPress={() =>
                router.push({
                  pathname: '/(app)/syndicates/[organizationId]/members/[userId]',
                  params: { organizationId: organizationId ?? '', userId: item.userId },
                })
              }
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
                <Avatar uri={item.avatarUrl} name={`${item.firstName} ${item.lastName}`} size="avatarMd" />
                <View style={{ flex: 1, rowGap: 2 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {item.firstName} {item.lastName}
                  </Text>
                  {item.governorate ? <Caption numberOfLines={1}>{item.governorate}</Caption> : null}
                  <Caption color="textMuted">
                    {t('members.registeredOn', { date: formatDate(item.registeredAt) })}
                  </Caption>
                </View>
                {item.isVeterinarian ? <Icon name="medkit-outline" size="iconSm" color="primary" /> : null}
                <Icon name="chevron-back" directional size="iconSm" color="textMuted" />
              </View>
            </Card>
          )}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.sm }} />}
          ListEmptyComponent={
            <EmptyState icon="people-outline" title={t('members.empty')} message={t('members.emptyHint')} />
          }
          ListFooterComponent={q.isFetchingNextPage ? <Loading /> : null}
          contentContainerStyle={{ padding: theme.screenPadding, paddingBottom: theme.spacing.huge }}
        />
      )}
    </SafeAreaScreen>
  );
}
