/**
 * Poultry Farms feature — Mobile Phase 7. FARM-organization operations
 * specific to poultry: the flock domain (list / detail / create / edit /
 * delete / close) and its daily records / health events / individual cases.
 *
 * A Farm is still an Organization — members / veterinarians / supervisors /
 * profile reuse the Phase 4 `features/organizations` APIs and screens.
 * Genuinely cross-farm-type infrastructure (join-code, subscription renewal,
 * generic farm profile/expenses/appointments, and several presentational
 * components) lives in `@/features/farmShared` and is re-exported here for
 * backward compatibility. No chat / realtime / notifications.
 */
export {
  farmApi,
  poultryApi,
  poultryOpsApi,
  poultryKeys,
  poultryOpsKeys,
  type FarmApi,
  type PoultryApi,
  type PoultryOpsApi,
} from './api';
export {
  usePoultryFlocks,
  usePoultryFlock,
  useCreatePoultryFlock,
  useUpdatePoultryFlock,
  useDeletePoultryFlock,
  usePoultryFarms,
  useMyFarms,
  useCreatePoultryFarm,
  useBatchSummary,
  useWeeklySummary,
  useDailyRecords,
  useCreateDailyRecord,
  useUpdateDailyRecord,
  useDeleteDailyRecord,
  usePoultryCaseSummary,
  useHealthEvents,
  useCreateHealthEvent,
  usePoultryCases,
  useCreatePoultryCase,
  useHealthEvent,
  usePoultryCase,
  type UsePoultryFlocksParams,
} from './hooks';
export {
  FarmJoinCodeCard,
  PoultryCard,
  PoultryCardSkeleton,
  PoultryFlockForm,
  PoultryFarmForm,
  AddFarmCard,
  MarketNavCard,
  PoultryFarmCard,
  FarmHeaderCard,
  BatchSummaryCard,
  DailyRecordCard,
  DailyRecordEmptyCard,
  WeeklySummaryCard,
  FarmSectionCard,
  FarmStaffRow,
  FarmStatusCard,
  ExpenseCard,
  HealthEventCard,
  PoultryCaseCard,
  AppointmentCard,
  DateFieldInput,
  isValidIsoDate,
  type PoultryCardProps,
  type PoultryFlockFormProps,
  type PoultryFarmFormProps,
  type PoultryFarmCardProps,
  type FarmBirdStats,
  type FarmStatusCardProps,
} from './components';
export {
  JoinFarmScreen,
  PoultryFlocksScreen,
  PoultryFlockDetailScreen,
  PoultryFlockFormScreen,
  PoultryFarmCreateScreen,
  PoultryFarmsLandingScreen,
  PoultryFarmDetailsScreen,
  PoultryMarketScreen,
  FarmSectionPlaceholderScreen,
  FarmSubscriptionRenewalScreen,
  FarmExpensesScreen,
  TreatmentsScreen,
  IndividualCasesScreen,
  FarmAppointmentsScreen,
  ExpenseDetailScreen,
  HealthEventDetailScreen,
  AppointmentDetailScreen,
  PoultryCaseDetailScreen,
  DailyRecordsScreen,
  WeeklyReportScreen,
} from './screens';
export {
  birdTypeIcon,
  BIRD_TYPE_ICON,
  BIRD_TYPE_ORDER,
  FLOCK_STATUS_TONE,
  CASE_STATUS_ICON,
  CASE_STATUS_TONE,
  POULTRY_PRODUCTION_TYPES,
  IRAQ_GOVERNORATES,
  type PoultryProductionType,
} from './constants';
export {
  buildPoultryFlockSchema,
  buildCreatePoultryFarmSchema,
  buildFarmSettingsInfoSchema,
  type PoultryFlockFormValues,
  type CreatePoultryFarmFormValues,
  type FarmSettingsInfoFormValues,
  type PoultryTFn,
} from './validation/schemas';
export * from './types';

// Genuinely cross-farm-type infrastructure — canonical home is `@/features/farmShared`;
// re-exported here for backward compatibility with existing `@/features/farm` imports.
export {
  farmSubscriptionApi,
  farmKeys,
  type FarmSubscriptionApi,
  useFarmJoinCode,
  useRegenerateFarmJoinCode,
  useJoinFarmByCode,
  useFarmSubscriptionRenewals,
  useRequestFarmRenewal,
  useFarmProfile,
  useUpdateFarmProfile,
  useFarmExpenses,
  useFarmExpenseSummary,
  useCreateFarmExpense,
  useFarmExpense,
  useFarmAppointments,
  useCreateFarmAppointment,
  useFarmAppointment,
  FARM_ORG_TYPE,
  organizationIsFarm,
  buildJoinFarmSchema,
  farmErrorMessage,
  type JoinFarmFormValues,
  type FarmTFn,
} from '@/features/farmShared';
