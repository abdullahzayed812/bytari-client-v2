import { ImageBackground, Pressable, View } from 'react-native';

import { Button } from '@/components/actions';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

export interface BannerProps {
  title: string;
  body?: string;
  /** Optional hero image behind a green scrim. */
  imageUri?: string;
  actionLabel?: string;
  onAction?: () => void;
  onPress?: () => void;
}

/** Large rounded promotional banner from the home surface design. */
export function Banner({ title, body, imageUri, actionLabel, onAction, onPress }: BannerProps) {
  const theme = useTheme();

  const content = (
    <View style={{ rowGap: theme.spacing.sm }}>
      <Text variant="title" color="textInverse" weight="bold">
        {title}
      </Text>
      {body ? (
        <Text variant="body" color="textInverse" style={{ opacity: 0.92 }}>
          {body}
        </Text>
      ) : null}
      {actionLabel ? (
        <View style={{ marginTop: theme.spacing.sm }}>
          <Button label={actionLabel} variant="secondary" size="sm" onPress={onAction} />
        </View>
      ) : null}
    </View>
  );

  const inner = imageUri ? (
    <ImageBackground
      source={{ uri: imageUri }}
      resizeMode="cover"
      style={{ minHeight: theme.sizes.bannerHeight, justifyContent: 'center' }}
      imageStyle={{ borderRadius: theme.radius.xxl }}
    >
      <View
        style={{
          ...StyleFill,
          borderRadius: theme.radius.xxl,
          backgroundColor: 'rgba(9, 122, 61, 0.72)',
        }}
      />
      <View style={{ padding: theme.spacing.xxl }}>{content}</View>
    </ImageBackground>
  ) : (
    <View
      style={{
        minHeight: theme.sizes.bannerHeight,
        justifyContent: 'center',
        padding: theme.spacing.xxl,
        borderRadius: theme.radius.xxl,
        backgroundColor: theme.colors.primary,
      }}
    >
      {content}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
        style={({ pressed }) => [
          { borderRadius: theme.radius.xxl, overflow: 'hidden', ...theme.shadows.card },
          pressed && { opacity: 0.95 },
        ]}
      >
        {inner}
      </Pressable>
    );
  }
  return (
    <View style={{ borderRadius: theme.radius.xxl, overflow: 'hidden', ...theme.shadows.card }}>
      {inner}
    </View>
  );
}

const StyleFill = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;
