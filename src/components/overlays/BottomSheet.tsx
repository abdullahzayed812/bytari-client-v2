import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * Bottom-anchored panel. Phase 1 uses a plain slide-up `Modal` — no gesture
 * library dependency. A draggable variant can replace this behind the same API
 * later without touching call sites.
 */
export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/*
       * Backdrop and panel are siblings (not nested Pressables) so a scrolling
       * child (e.g. a long `Select` list) owns its touches, and the panel is
       * capped at 90% of the screen so long content scrolls instead of
       * overflowing off-screen.
       */}
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityLabel="Dismiss"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.overlay }]}
        />
        <View
          style={{
            maxHeight: '90%',
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.radius.xxl,
            borderTopRightRadius: theme.radius.xxl,
            paddingHorizontal: theme.spacing.xl,
            paddingTop: theme.spacing.md,
            paddingBottom: Math.max(insets.bottom, theme.spacing.xl),
            rowGap: theme.spacing.lg,
            ...theme.shadows.overlay,
          }}
        >
          <View
            style={{
              alignSelf: 'center',
              width: 44,
              height: 5,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.borderStrong,
            }}
          />
          {title ? (
            <Text variant="title" weight="bold">
              {title}
            </Text>
          ) : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}
