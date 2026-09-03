import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { EmptyState } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { useTheme } from '@/theme';

type Section = 'treatments' | 'cases' | 'appointments' | 'expenses' | 'daily' | 'weekly';

const TITLE_KEY = {
  treatments: 'sections.treatments',
  cases: 'sections.cases',
  appointments: 'sections.appointments',
  expenses: 'sections.expenses',
  daily: 'daily.title',
  weekly: 'weekly.title',
} as const satisfies Record<Section, string>;

const ICON: Record<Section, Parameters<typeof EmptyState>[0]['icon']> = {
  treatments: 'medkit-outline',
  cases: 'pulse-outline',
  appointments: 'calendar-outline',
  expenses: 'wallet-outline',
  daily: 'clipboard-outline',
  weekly: 'stats-chart-outline',
};

/**
 * Farm Details management sub-page placeholder. The backend for each of these
 * entities is live (`/organizations/:id/...`); the screens are delivered with
 * their own screenshots. This is the navigation placeholder required by the
 * project's convention — never a dead button.
 */
export default function FarmSectionPlaceholderScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultry');
  const { section } = useLocalSearchParams<{ section: Section }>();
  const key = (section ?? 'expenses') as Section;

  return (
    <SafeAreaScreen>
      <AppHeader title={t(TITLE_KEY[key])} showBack />
      <View style={{ flex: 1, justifyContent: 'center', padding: theme.screenPadding }}>
        <EmptyState
          icon={ICON[key]}
          title={t('sections.comingSoonTitle')}
          message={t('sections.comingSoonBody')}
        />
      </View>
    </SafeAreaScreen>
  );
}
