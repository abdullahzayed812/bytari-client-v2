/** Route: /(app)/poultry/[organizationId]/sections/[section]/[itemId] — one item's read-only detail. */
import { useLocalSearchParams } from 'expo-router';

import {
  AppointmentDetailScreen,
  ExpenseDetailScreen,
  FarmSectionPlaceholderScreen,
  HealthEventDetailScreen,
  PoultryCaseDetailScreen,
} from '@/features/farm/screens';

type Section = 'treatments' | 'cases' | 'appointments' | 'expenses';

export default function FarmSectionItemRoute() {
  const { section } = useLocalSearchParams<{ section: Section }>();

  switch (section) {
    case 'treatments':
      return <HealthEventDetailScreen />;
    case 'cases':
      return <PoultryCaseDetailScreen />;
    case 'appointments':
      return <AppointmentDetailScreen />;
    case 'expenses':
      return <ExpenseDetailScreen />;
    default:
      return <FarmSectionPlaceholderScreen />;
  }
}
