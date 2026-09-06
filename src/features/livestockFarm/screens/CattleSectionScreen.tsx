import { useLocalSearchParams } from 'expo-router';

import { FarmAppointmentsScreen, FarmExpensesScreen } from '@/features/farmShared';

import CattleDailyRecordsScreen from './CattleDailyRecordsScreen';
import CattleIndividualCasesScreen from './CattleIndividualCasesScreen';
import CattleTreatmentsScreen from './CattleTreatmentsScreen';
import CattleWeeklyReportScreen from './CattleWeeklyReportScreen';

export type CattleFarmSection = 'treatments' | 'cases' | 'appointments' | 'expenses' | 'daily' | 'weekly';

/** Route `/(app)/livestock/cattle/[organizationId]/sections/[section]`. Mirrors `SheepSectionScreen`. */
export default function CattleSectionScreen() {
  const { section } = useLocalSearchParams<{ section: CattleFarmSection }>();
  switch (section) {
    case 'treatments':
      return <CattleTreatmentsScreen />;
    case 'cases':
      return <CattleIndividualCasesScreen />;
    case 'appointments':
      return <FarmAppointmentsScreen />;
    case 'expenses':
      return <FarmExpensesScreen />;
    case 'weekly':
      return <CattleWeeklyReportScreen />;
    case 'daily':
    default:
      return <CattleDailyRecordsScreen />;
  }
}
