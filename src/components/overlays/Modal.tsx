import type { ReactNode } from 'react';
import { Modal as RNModal, Pressable, View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Dismiss when the backdrop is tapped. Default `true`. */
  dismissable?: boolean;
}

/** Centred dialog surface over a scrim. */
export function Modal({ visible, onClose, title, children, dismissable = true }: ModalProps) {
  const theme = useTheme();
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        accessibilityLabel="Dismiss"
        onPress={dismissable ? onClose : undefined}
        style={{
          flex: 1,
          backgroundColor: theme.colors.overlay,
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing.xl,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 420,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.xxl,
            padding: theme.spacing.xxl,
            rowGap: theme.spacing.lg,
            ...theme.shadows.overlay,
          }}
        >
          {title ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text variant="title" weight="bold" style={{ flex: 1 }}>
                {title}
              </Text>
              <IconButton icon="close" accessibilityLabel="Close" size="sm" onPress={onClose} />
            </View>
          ) : null}
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
