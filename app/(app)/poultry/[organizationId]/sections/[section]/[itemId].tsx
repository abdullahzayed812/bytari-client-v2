/** Route: /(app)/poultry/[organizationId]/sections/[section]/[itemId] — one item's detail (view / edit / delete). */
import { useLocalSearchParams } from 'expo-router';

import {
  AppointmentDetailScreen,
  ExpenseDetailScreen,
  FarmCaseDetailScreen,
  FarmHealthEventDetailScreen,
  FarmSectionPlaceholderScreen,
} from '@/features/farmShared/screens';

type Section = 'treatments' | 'cases' | 'appointments' | 'expenses';

export default function FarmSectionItemRoute() {
  const { section } = useLocalSearchParams<{ section: Section }>();

  switch (section) {
    case 'treatments':
      return <FarmHealthEventDetailScreen scope="poultry" />;
    case 'cases':
      return <FarmCaseDetailScreen scope="poultry" />;
    case 'appointments':
      return <AppointmentDetailScreen />;
    case 'expenses':
      return <ExpenseDetailScreen />;
    default:
      return <FarmSectionPlaceholderScreen />;
  }
}
