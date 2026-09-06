import { useLocalSearchParams } from 'expo-router';

import { FarmAppointmentsScreen, FarmExpensesScreen } from '@/features/farmShared';

import SheepDailyRecordsScreen from './SheepDailyRecordsScreen';
import SheepIndividualCasesScreen from './SheepIndividualCasesScreen';
import SheepTreatmentsScreen from './SheepTreatmentsScreen';
import SheepWeeklyReportScreen from './SheepWeeklyReportScreen';

export type SheepFarmSection = 'treatments' | 'cases' | 'appointments' | 'expenses' | 'daily' | 'weekly';

/** Route `/(app)/livestock/sheep/[organizationId]/sections/[section]` — dispatches by section. Mirrors the poultry sections switch. */
export default function SheepSectionScreen() {
  const { section } = useLocalSearchParams<{ section: SheepFarmSection }>();
  switch (section) {
    case 'treatments':
      return <SheepTreatmentsScreen />;
    case 'cases':
      return <SheepIndividualCasesScreen />;
    case 'appointments':
      return <FarmAppointmentsScreen />;
    case 'expenses':
      return <FarmExpensesScreen />;
    case 'weekly':
      return <SheepWeeklyReportScreen />;
    case 'daily':
    default:
      return <SheepDailyRecordsScreen />;
  }
}
