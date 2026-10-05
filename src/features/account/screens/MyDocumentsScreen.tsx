import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Linking, Pressable, RefreshControl, View } from 'react-native';

import { Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { ImageViewer } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import type { MyDocument } from '../api/accountApi';
import { useMyDocuments } from '../hooks/useMyProfile';

const isImage = (d: MyDocument) => d.mimeType.startsWith('image/');

/**
 * Route `/(app)/profile/documents` — "المستندات والوثائق" (reference design).
 * The caller's own verification documents from `GET /veterinarians/me/documents`
 * — read-only (they were reviewed with the account), shown with a thumbnail
 * and the date added; tapping opens the image full-screen or the file (PDF).
 */
export default function MyDocumentsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('profile');
  const q = useMyDocuments();
  const [viewing, setViewing] = useState<string | null>(null);

  const docs = q.data?.documents ?? [];
  const notice =
    q.data?.applicationStatus === 'PENDING' ? t('documents.pendingNotice') : t('documents.notice');

  const open = (d: MyDocument) => {
    if (isImage(d)) setViewing(d.downloadUrl);
    else void Linking.openURL(d.downloadUrl);
  };

  return (
    <SafeAreaScreen>
      <AppHeader title={t('documents.title')} showBack />
      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <View style={{ padding: theme.screenPadding }}>
          <ErrorState error={q.error} onRetry={() => void q.refetch()} />
        </View>
      ) : (
        <FlatList
          data={docs}
          keyExtractor={(d, i) => `${d.kind}:${i}`}
          ListHeaderComponent={
            docs.length > 0 ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  columnGap: theme.spacing.sm,
                  padding: theme.spacing.lg,
                  borderRadius: theme.radius.lg,
                  backgroundColor: theme.colors.primarySoft,
                  marginBottom: theme.spacing.md,
                }}
              >
                <Icon name="information-circle" size="iconMd" color="primary" />
                <Caption style={{ flex: 1 }}>{notice}</Caption>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t(`documents.kinds.${item.kind}`)} — ${t('documents.open')}`}
              onPress={() => open(item)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                columnGap: theme.spacing.md,
                padding: theme.spacing.md,
                borderRadius: theme.radius.lg,
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View
                style={{
                  width: 120,
                  height: 84,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.surfaceMuted,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  overflow: 'hidden',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isImage(item) ? (
                  <Image
                    source={{ uri: item.downloadUrl }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <Icon name="document-outline" size="iconLg" color="textMuted" />
                )}
              </View>
              <View style={{ flex: 1, rowGap: theme.spacing.xs }}>
                <Text variant="bodyStrong" numberOfLines={2}>
                  {t(`documents.kinds.${item.kind}`)}
                </Text>
                <Caption color="textSecondary">
                  {t('documents.addedAt', { date: formatDate(item.createdAt) })}
                </Caption>
              </View>
              <Icon name="document-text-outline" size="iconLg" color="primary" />
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
          ListEmptyComponent={
            <EmptyState
              icon="document-outline"
              title={t('documents.empty')}
              message={t('documents.emptyHint')}
            />
          }
          contentContainerStyle={{
            padding: theme.screenPadding,
            paddingBottom: theme.spacing.huge,
            flexGrow: 1,
            width: '100%',
            maxWidth: 720,
            alignSelf: 'center',
          }}
          refreshControl={
            <RefreshControl
              refreshing={q.isRefetching}
              onRefresh={() => void q.refetch()}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
      <ImageViewer
        visible={viewing !== null}
        images={viewing ? [viewing] : []}
        onClose={() => setViewing(null)}
      />
    </SafeAreaScreen>
  );
}
