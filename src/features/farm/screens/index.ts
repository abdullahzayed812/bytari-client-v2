export { default as PoultryFlocksScreen } from './PoultryFlocksScreen';
export { default as PoultryFlockDetailScreen } from './PoultryFlockDetailScreen';
export { default as PoultryFlockFormScreen } from './PoultryFlockFormScreen';
export { default as PoultryFarmsLandingScreen } from './PoultryFarmsLandingScreen';
export { default as PoultryFarmDetailsScreen } from './PoultryFarmDetailsScreen';
export { default as PoultryMarketScreen } from './PoultryMarketScreen';
export { default as PoultryFarmCreateScreen } from './PoultryFarmCreateScreen';
export { default as TreatmentsScreen } from './TreatmentsScreen';
export { default as IndividualCasesScreen } from './IndividualCasesScreen';
export { default as HealthEventDetailScreen } from './HealthEventDetailScreen';
export { default as PoultryCaseDetailScreen } from './PoultryCaseDetailScreen';
export { default as DailyRecordsScreen } from './DailyRecordsScreen';
export { default as WeeklyReportScreen } from './WeeklyReportScreen';

// Genuinely cross-farm-type screens moved to `@/features/farmShared` —
// re-exported here for backward compatibility with existing `@/features/farm` imports.
export {
  JoinFarmScreen,
  FarmSectionPlaceholderScreen,
  FarmSubscriptionRenewalScreen,
  FarmExpensesScreen,
  FarmAppointmentsScreen,
  ExpenseDetailScreen,
  AppointmentDetailScreen,
} from '@/features/farmShared';
