import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Badge, Card, Icon } from '@/components/content';
import { EmptyState, ErrorState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { ImageViewer } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import type { AdPlacement } from '../../types';
import { useAdminAdCampaigns } from '../hooks';

/** Route `/(app)/admin/ads/[placement]` — campaigns for one placement. */
export default function AdminAdCampaignsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('ads');
  const { placement } = useLocalSearchParams<{ placement: AdPlacement }>();

  const q = useAdminAdCampaigns({ placement });
  const campaigns = q.data?.items ?? [];
  const [viewerImages, setViewerImages] = useState<string[] | null>(null);

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t(`placements.${placement}`)}
        showBack
        right={
          <IconButton
            icon="add"
            accessibilityLabel={t('admin.add')}
            onPress={() => router.push(Routes.adminAdCreate(placement))}
          />
        }
      />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : (
        <FlatList
          data={campaigns}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => {
            const images = item.slides
              .map((s) => s.imageUrl)
              .filter((url): url is string => Boolean(url));
            return (
            <Card
              variant="outlined"
              padding="md"
              onPress={() => router.push(Routes.adminAdCampaign(placement, item.id))}
              accessibilityLabel={item.title}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  columnGap: theme.spacing.sm,
                }}
              >
                <Pressable
                  disabled={images.length === 0}
                  onPress={() => setViewerImages(images)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: theme.radius.md,
                    overflow: 'hidden',
                    backgroundColor: theme.colors.surfaceAccent,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {images[0] ? (
                    <Image source={{ uri: images[0] }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : (
                    <Icon name="image-outline" size="iconSm" color="textMuted" />
                  )}
                </Pressable>
                <View style={{ flex: 1, rowGap: 4 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Caption numberOfLines={1}>
                    {t(`admin.campaignType.${item.type}`)} ·{' '}
                    {t('admin.sortOrderValue', { value: item.sortOrder })} ·{' '}
                    {t('admin.slidesCount', { count: item.slides.length })}
                  </Caption>
                </View>
                <Badge
                  label={t(item.isActive ? 'admin.active' : 'admin.inactive')}
                  tone={item.isActive ? 'success' : 'neutral'}
                  size="sm"
                />
              </View>
            </Card>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="megaphone-outline"
              title={t('admin.empty')}
              message={t('admin.emptyHint')}
              actionLabel={t('admin.add')}
              onAction={() => router.push(Routes.adminAdCreate(placement))}
            />
          }
          contentContainerStyle={{
            padding: theme.screenPadding,
            rowGap: theme.spacing.sm,
            flexGrow: 1,
            paddingBottom: theme.spacing.huge,
          }}
        />
      )}

      <ImageViewer
        visible={viewerImages !== null}
        images={viewerImages ?? []}
        onClose={() => setViewerImages(null)}
      />
    </SafeAreaScreen>
  );
}
