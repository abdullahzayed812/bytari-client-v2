import { ActivityIndicator, Pressable, View } from 'react-native';

import { Card, Icon, type IconName } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { formatBytes } from '@/utils';

export interface FilePreviewProps {
  name: string;
  mimeType?: string;
  size?: number;
  progress?: number;
  uploading?: boolean;
  error?: boolean;
  onRemove?: () => void;
  onRetry?: () => void;
  onOpen?: () => void;
}

function iconFor(mime?: string): IconName {
  if (!mime) return 'document-outline';
  if (mime.startsWith('image/')) return 'image-outline';
  if (mime === 'application/pdf') return 'document-text-outline';
  if (mime.startsWith('video/')) return 'videocam-outline';
  if (mime.startsWith('audio/')) return 'musical-notes-outline';
  return 'document-outline';
}

/** A picked/uploaded document row with status + remove/retry. */
export function FilePreview({
  name,
  mimeType,
  size,
  progress,
  uploading,
  error,
  onRemove,
  onRetry,
  onOpen,
}: FilePreviewProps) {
  const theme = useTheme();
  const sub = [formatBytes(size), uploading ? `${Math.round((progress ?? 0) * 100)}%` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card variant="outlined" padding="md" onPress={onOpen} accessibilityLabel={name}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.md }}>
        <Icon name={iconFor(mimeType)} size="iconMd" color={error ? 'danger' : 'primary'} />
        <View style={{ flex: 1 }}>
          <Text variant="caption" numberOfLines={1}>
            {name}
          </Text>
          {error ? (
            <Caption color="danger">{'upload failed'}</Caption>
          ) : sub ? (
            <Caption>{sub}</Caption>
          ) : null}
        </View>
        {uploading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : error && onRetry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="retry"
            onPress={onRetry}
            hitSlop={8}
          >
            <Icon name="refresh" size="iconSm" color="primary" />
          </Pressable>
        ) : onRemove ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="remove"
            onPress={onRemove}
            hitSlop={8}
          >
            <Icon name="close-circle" size="iconSm" color="textMuted" />
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}
