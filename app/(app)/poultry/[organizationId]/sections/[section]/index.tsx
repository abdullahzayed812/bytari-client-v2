/** Route: /(app)/poultry/[organizationId]/sections/[section] — Farm management sub-pages. */
import { useLocalSearchParams } from 'expo-router';

import {
  DailyRecordsScreen,
  FarmAppointmentsScreen,
  FarmExpensesScreen,
  IndividualCasesScreen,
  TreatmentsScreen,
  WeeklyReportScreen,
} from '@/features/farm/screens';

type Section = 'treatments' | 'cases' | 'appointments' | 'expenses' | 'daily' | 'weekly';

export default function FarmSectionRoute() {
  const { section } = useLocalSearchParams<{ section: Section }>();

  switch (section) {
    case 'treatments':
      return <TreatmentsScreen />;
    case 'cases':
      return <IndividualCasesScreen />;
    case 'appointments':
      return <FarmAppointmentsScreen />;
    case 'expenses':
      return <FarmExpensesScreen />;
    case 'daily':
      return <DailyRecordsScreen />;
    case 'weekly':
      return <WeeklyReportScreen />;
    default:
      return null;
  }
}
