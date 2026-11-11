import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import { TextButton } from '@/components/actions';
import { Card } from '@/components/content';
import { EmptyState, ErrorState, SkeletonText, useToast } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Text } from '@/components/typography';
import { useBlockedUsers, useUnblockUser } from '@/features/safety';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

/** Route `/(app)/settings/blocked-users` — "المستخدمون المحظورون". */
export default function BlockedUsersScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { t } = useTranslation('settings');
  const q = useBlockedUsers();
  const unblock = useUnblockUser();

  return (
    <SafeAreaScreen>
      <AppHeader title={t('blocked.title')} showBack />
      {q.isLoading ? (
        <View style={{ padding: theme.screenPadding }}>
          <SkeletonText lines={4} />
        </View>
      ) : q.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={q.data ?? []}
          keyExtractor={(b) => b.userId}
          contentContainerStyle={{
            padding: theme.screenPadding,
            rowGap: theme.spacing.md,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <EmptyState
              icon="shield-checkmark-outline"
              title={t('blocked.empty')}
              message={t('blocked.emptyBody')}
            />
          }
          renderItem={({ item }) => (
            <Card padding="lg">
              <View
                style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}
              >
                <Text variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
                  {`${item.firstName} ${item.lastName}`.trim()}
                </Text>
                <TextButton
                  label={t('blocked.unblock')}
                  disabled={unblock.isPending}
                  onPress={() =>
                    unblock.mutate(item.userId, {
                      onSuccess: () =>
                        toast.show({ tone: 'success', message: t('blocked.unblocked') }),
                      onError: (e) => toast.show({ tone: 'danger', message: apiErrorMessage(e) }),
                    })
                  }
                />
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaScreen>
  );
}
