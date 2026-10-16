import { useRouter } from 'expo-router';

import { IconButton } from '@/components/actions';

export interface BackButtonProps {
  accessibilityLabel?: string;
  onPress?: () => void;
  /**
   * Mirror the chevron for RTL. Off by default: back arrows point LEFT in
   * both languages (see the back-navigation convention in `lib/rtl`).
   */
  directional?: boolean;
}

/** Back control — the chevron points left in both Arabic (RTL) and English (LTR). */
export function BackButton({
  accessibilityLabel = 'Back',
  onPress,
  directional = false,
}: BackButtonProps) {
  const router = useRouter();
  return (
    <IconButton
      icon="chevron-back"
      directional={directional}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
    />
  );
}
