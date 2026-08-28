import { useRouter } from 'expo-router';

import { IconButton } from '@/components/actions';

export interface BackButtonProps {
  accessibilityLabel?: string;
  onPress?: () => void;
}

/** Directional back control — the chevron mirrors automatically in RTL. */
export function BackButton({ accessibilityLabel = 'Back', onPress }: BackButtonProps) {
  const router = useRouter();
  return (
    <IconButton
      icon="chevron-back"
      directional
      accessibilityLabel={accessibilityLabel}
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
    />
  );
}
