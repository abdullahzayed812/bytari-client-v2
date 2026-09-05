/**
 * Farm feature — Mobile Phase 7. FARM-organization operations that Phase 4
 * didn't cover: the Farm-ID join-code flow (owner shares → vet enters → vet
 * joins, no approval step) and the poultry domain (flock list / detail /
 * create / edit / delete / close).
 *
 * A Farm is still an Organization — members / veterinarians / supervisors /
 * profile reuse the Phase 4 `features/organizations` APIs and screens. No
 * cattle / sheep operations (backend has no finalised API — §16). No chat /
 * realtime / notifications.
 */
export {
  farmApi,
  poultryApi,
  poultryOpsApi,
  farmKeys,
  poultryKeys,
  poultryOpsKeys,
  type FarmApi,
  type PoultryApi,
  type PoultryOpsApi,
} from './api';
export {
  useFarmJoinCode,
  useRegenerateFarmJoinCode,
  useJoinFarmByCode,
  usePoultryFlocks,
  usePoultryFlock,
  useCreatePoultryFlock,
  useUpdatePoultryFlock,
  useDeletePoultryFlock,
  usePoultryFarms,
  useCreatePoultryFarm,
  useFarmProfile,
  useBatchSummary,
  useWeeklySummary,
  useDailyRecords,
  useFarmExpenses,
  useFarmExpenseSummary,
  usePoultryCaseSummary,
  useCreateFarmExpense,
  useUpdateFarmProfile,
  type UsePoultryFlocksParams,
} from './hooks';
export {
  FarmJoinCodeCard,
  PoultryCard,
  PoultryCardSkeleton,
  PoultryFlockForm,
  PoultryFarmForm,
  AddFarmCard,
  PoultryMarketCard,
  PoultryFarmCard,
  FarmHeaderCard,
  BatchSummaryCard,
  DailyRecordCard,
  DailyRecordEmptyCard,
  WeeklySummaryCard,
  FarmSectionCard,
  FarmStaffRow,
  type PoultryCardProps,
  type PoultryFlockFormProps,
  type PoultryFarmFormProps,
  type PoultryFarmCardProps,
  type FarmBirdStats,
} from './components';
export {
  JoinFarmScreen,
  PoultryFlocksScreen,
  PoultryFlockDetailScreen,
  PoultryFlockFormScreen,
  PoultryFarmCreateScreen,
  PoultryFarmsLandingScreen,
  FarmDetailsScreen,
  PoultryMarketScreen,
  FarmSectionPlaceholderScreen,
} from './screens';
export {
  FARM_ORG_TYPE,
  organizationIsFarm,
  birdTypeIcon,
  BIRD_TYPE_ICON,
  BIRD_TYPE_ORDER,
  FLOCK_STATUS_TONE,
  FARM_PRODUCTION_TYPES,
  IRAQ_GOVERNORATES,
  type FarmProductionType,
} from './constants';
export {
  buildJoinFarmSchema,
  buildPoultryFlockSchema,
  buildCreatePoultryFarmSchema,
  farmErrorMessage,
  type JoinFarmFormValues,
  type PoultryFlockFormValues,
  type CreatePoultryFarmFormValues,
  type FarmTFn,
} from './validation/schemas';
export * from './types';
