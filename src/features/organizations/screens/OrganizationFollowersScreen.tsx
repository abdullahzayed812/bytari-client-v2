import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';

import { Button } from '@/components/actions';
import { Avatar, Card } from '@/components/content';
import { EmptyState, ErrorState, Loading, useToast } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useStartConversation } from '@/features/chat/hooks/useChatMutations';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { fullName } from '@/utils';

import { orgCapabilities } from '../constants';
import { useOrganization, useOrganizationFollowers } from '../hooks';
import type { OrganizationFollower } from '../types';

/**
 * Route `/organizations/[organizationId]/followers` — the clinic / veterinary
 * office dashboard "Followers" page. Each row is the follower's name and a
 * "Send Message" button that opens (or resumes) the organization's chat with
 * them. Deliberately no profile link: the row is not pressable and the
 * backend returns nothing but the name.
 */
export default function OrganizationFollowersScreen() {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const toast = useToast();
  const { isAdmin } = useCapabilities();
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const orgId = organizationId ?? '';

  const detail = useOrganization(orgId);
  const caps = orgCapabilities(detail.data?.myRole, isAdmin, detail.data?.myPermissions);
  const q = useOrganizationFollowers(orgId, { enabled: caps.canSendBroadcast });
  const start = useStartConversation();
  const [startingFor, setStartingFor] = useState<string | null>(null);

  const message = (f: OrganizationFollower) => {
    if (start.isPending) return;
    setStartingFor(f.userId);
    start.mutate(
      { organizationId: orgId, targetUserId: f.userId },
      {
        onSuccess: (conversation) => router.push(Routes.chatThread(conversation.id)),
        onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
        onSettled: () => setStartingFor(null),
      },
    );
  };

  const padded = { paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md };

  return (
    <SafeAreaScreen>
      <AppHeader title={t('followers.title')} showBack />

      {detail.isLoading || q.isLoading ? (
        <Loading fill />
      ) : !caps.canSendBroadcast ? (
        <View style={padded}>
          <EmptyState icon="lock-closed-outline" title={t('followers.noPermission')} />
        </View>
      ) : q.isError ? (
        <View style={padded}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.followers}
          keyExtractor={(f) => f.userId}
          renderItem={({ item }) => {
            const name = fullName(item.firstName, item.lastName) || t('followers.unnamed');
            return (
              <Card variant="outlined" padding="md">
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    columnGap: theme.spacing.md,
                  }}
                >
                  <Avatar name={name} size="avatarMd" />
                  <Text variant="bodyMedium" numberOfLines={1} style={{ flex: 1 }}>
                    {name}
                  </Text>
                  <Button
                    label={t('followers.sendMessage')}
                    size="sm"
                    leftIcon="chatbubble-outline"
                    loading={startingFor === item.userId}
                    disabled={start.isPending}
                    onPress={() => message(item)}
                    accessibilityLabel={t('followers.sendMessageTo', { name })}
                  />
                </View>
              </Card>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title={t('followers.empty')}
              message={t('followers.emptyHint')}
            />
          }
          ListFooterComponent={
            q.isFetchingNextPage ? <Loading label={t('list.loadingMore')} /> : null
          }
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.md,
            paddingBottom: theme.spacing.huge,
            rowGap: theme.spacing.sm,
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
