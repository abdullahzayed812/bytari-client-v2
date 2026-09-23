import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';

import { Icon } from '@/components/content';
import { EmptyState, Loading } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { ImageViewer } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import { SyndicateAnnouncementTypeBadge } from '../components';
import { useSyndicateAnnouncement } from '../hooks';

/** Route `/(app)/syndicates/announcements/[id]` — announcement detail. */
export default function SyndicateAnnouncementDetailsScreen() {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useSyndicateAnnouncement(id);
  const announcement = q.data;
  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <SafeAreaScreen>
      <AppHeader title={t('announcements.detailsTitle')} showBack />
      {q.isLoading ? (
        <Loading fill />
      ) : q.isError || !announcement ? (
        <EmptyState icon="megaphone-outline" title={t('announcements.notFound')} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.huge }}>
          <View style={{ height: 220, backgroundColor: theme.colors.surfaceAccent }}>
            {announcement.imageUrl ? (
              <Pressable
                accessibilityRole="imagebutton"
                accessibilityLabel={announcement.title}
                onPress={() => setViewerOpen(true)}
                style={{ width: '100%', height: '100%' }}
              >
                <Image source={{ uri: announcement.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              </Pressable>
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="megaphone-outline" size="iconXl" color="textMuted" />
              </View>
            )}
          </View>
          <View style={{ padding: theme.screenPadding, rowGap: theme.spacing.md }}>
            <SyndicateAnnouncementTypeBadge type={announcement.type} />
            <Heading level={3}>{announcement.title}</Heading>
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
              <Icon name="business-outline" size="iconSm" color="textMuted" />
              <Caption>{announcement.syndicateName}</Caption>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
              <Icon name="calendar-outline" size="iconSm" color="textMuted" />
              <Caption>{formatDate(announcement.publishedAt)}</Caption>
            </View>
            <Text variant="body" color="textSecondary">
              {announcement.body}
            </Text>
          </View>

          <ImageViewer
            visible={viewerOpen}
            images={announcement.imageUrl ? [announcement.imageUrl] : []}
            onClose={() => setViewerOpen(false)}
          />
        </ScrollView>
      )}
    </SafeAreaScreen>
  );
}
