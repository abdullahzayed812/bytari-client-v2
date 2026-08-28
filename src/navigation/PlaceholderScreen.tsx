import type { IconName } from '@/components/content';
import { EmptyState } from '@/components/feedback';
import { Screen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';

interface PlaceholderScreenProps {
  title: string;
  icon?: IconName;
  note?: string;
}

/**
 * Neutral placeholder for a not-yet-built destination. Verifies navigation +
 * header + safe areas render. Feature phases replace these files.
 */
export function PlaceholderScreen({
  title,
  icon = 'construct-outline',
  note,
}: PlaceholderScreenProps) {
  return (
    <Screen>
      <AppHeader title={title} />
      <EmptyState icon={icon} title={title} message={note ?? 'ستتوفر هذه الميزة في مرحلة قادمة.'} />
    </Screen>
  );
}
