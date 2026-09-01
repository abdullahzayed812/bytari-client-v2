import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { CONTENT_FILE_KIND_ICON, formatFileSize, isViewableMime, mimeLabel } from '../constants';
import type { ContentFile } from '../types';

export interface ContentFileRowProps {
  file: ContentFile;
  onPress?: () => void;
}

/** A downloadable content file (MAIN document / attachment). Cover files are shown separately. */
export function ContentFileRow({ file, onPress }: ContentFileRowProps) {
  const theme = useTheme();
  const { t } = useTranslation('content');
  const viewable = isViewableMime(file.mimeType);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('file.openLabel', { name: file.originalFilename })}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: theme.spacing.md,
          padding: theme.spacing.md,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Icon name={CONTENT_FILE_KIND_ICON[file.kind]} size="iconMd" color="primary" />
      <View style={{ flex: 1, rowGap: 2 }}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {file.originalFilename}
        </Text>
        <Caption>
          {mimeLabel(file.mimeType)} · {formatFileSize(file.sizeBytes)}
          {viewable ? '' : ` · ${t('file.notPreviewable')}`}
        </Caption>
      </View>
      <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
    </Pressable>
  );
}
