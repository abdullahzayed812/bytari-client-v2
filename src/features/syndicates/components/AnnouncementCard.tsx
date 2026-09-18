import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/actions';
import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatDate } from '@/utils';

import type { SyndicateAnnouncement } from '../types';

import { SyndicateAnnouncementTypeBadge } from './badges';

export interface AnnouncementCardProps {
  announcement: SyndicateAnnouncement;
  onPress: () => void;
  /** Opens a full-screen `ImageViewer` for the announcement's photo, if present. Tapping the image calls this instead of `onPress`. */
  onImagePress?: () => void;
  /** Fixed card width — pass when rendered inside a horizontal carousel. */
  width?: number;
}

/** An announcement card, matching both the home-screen carousel and "الإعلانات والتبليغات" list. */
export function AnnouncementCard({ announcement, onPress, onImagePress, width }: AnnouncementCardProps) {
  const theme = useTheme();
  const { t } = useTranslation('syndicates');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={announcement.title}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width,
          borderRadius: theme.radius.xl,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: 'hidden',
          ...theme.shadows.xs,
        },
        pressed && { opacity: 0.9 },
      ]}
    >
      <Pressable
        disabled={!announcement.imageUrl || !onImagePress}
        onPress={onImagePress}
        style={{ height: 140, backgroundColor: theme.colors.surfaceAccent }}
      >
        {announcement.imageUrl ? (
          <Image source={{ uri: announcement.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Icon
              name={announcement.type === 'IMPORTANT_NOTICE' ? 'alert-circle-outline' : 'megaphone-outline'}
              size="iconXl"
              color={announcement.type === 'IMPORTANT_NOTICE' ? 'danger' : 'success'}
            />
          </View>
        )}
        <View style={{ position: 'absolute', top: theme.spacing.sm, insetInlineEnd: theme.spacing.sm }}>
          <SyndicateAnnouncementTypeBadge type={announcement.type} />
        </View>
      </Pressable>

      <View style={{ padding: theme.spacing.md, rowGap: 4 }}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {announcement.title}
        </Text>
        <Caption numberOfLines={2} color="textSecondary">
          {announcement.body}
        </Caption>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: theme.spacing.sm,
            columnGap: theme.spacing.sm,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
            <Icon name="calendar-outline" size="iconXs" color="textMuted" />
            <Caption color="textMuted">{formatDate(announcement.publishedAt)}</Caption>
          </View>
          <Button label={t('announcements.viewDetails')} variant="primary" size="sm" onPress={onPress} />
        </View>
      </View>
    </Pressable>
  );
}
