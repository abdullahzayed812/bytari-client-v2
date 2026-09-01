import { useRouter } from 'expo-router';

import { IconButton } from '@/components/actions';

export interface BackButtonProps {
  accessibilityLabel?: string;
  onPress?: () => void;
  /** Chevron mirrors for RTL by default. Pass `false` to keep it pointing left (pinned-left headers). */
  directional?: boolean;
}

/** Directional back control — the chevron mirrors automatically in RTL. */
export function BackButton({
  accessibilityLabel = 'Back',
  onPress,
  directional = true,
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
