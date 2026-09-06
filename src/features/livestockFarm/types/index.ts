/**
 * Sheep Farms & Cattle Farms contract. Mirrors `server/src/modules/livestock`
 * exactly. A Farm is still an Organization of type `FARM` (Phase 3/4) — join
 * code, membership, subscription, expenses, and appointments are genuinely
 * shared and live in `@/features/farmShared`; this file only adds the two
 * species-specific "batch" domains (sheep = flock terminology, cattle = herd
 * terminology, both stored as a `Batch` entity per the approved naming plan).
 */
import type { FarmProfile } from '@/features/farm';

// --- shared enums (mirror poultry's daily/health/case enums exactly) ------
export const LIVESTOCK_APPETITE_LEVELS = ['GOOD', 'NORMAL', 'WEAK', 'NONE'] as const;
export type LivestockAppetite = (typeof LIVESTOCK_APPETITE_LEVELS)[number];

export const LIVESTOCK_ACTIVITY_LEVELS = ['ACTIVE', 'NORMAL', 'LETHARGIC'] as const;
export type LivestockActivity = (typeof LIVESTOCK_ACTIVITY_LEVELS)[number];

/** NEW vs. poultry — "نوع العلف" on the daily record, per the details screenshot. */
export const FEED_TYPES = ['CONCENTRATED', 'GREEN_FODDER', 'MIXED', 'OTHER'] as const;
export type FeedType = (typeof FEED_TYPES)[number];

export const LIVESTOCK_HEALTH_EVENT_KINDS = ['TREATMENT', 'VACCINATION'] as const;
export type LivestockHealthEventKind = (typeof LIVESTOCK_HEALTH_EVENT_KINDS)[number];

export const LIVESTOCK_HEALTH_EVENT_STATUSES = ['SCHEDULED', 'ONGOING', 'DONE', 'RECOVERED'] as const;
export type LivestockHealthEventStatus = (typeof LIVESTOCK_HEALTH_EVENT_STATUSES)[number];

export const LIVESTOCK_CASE_STATUSES = ['UNDER_TREATMENT', 'RECOVERED', 'DECEASED'] as const;
export type LivestockCaseStatus = (typeof LIVESTOCK_CASE_STATUSES)[number];

export const LIVESTOCK_CASE_SEXES = ['MALE', 'FEMALE', 'UNKNOWN'] as const;
export type LivestockCaseSex = (typeof LIVESTOCK_CASE_SEXES)[number];

export const LIVESTOCK_BATCH_STATUSES = ['ACTIVE', 'CLOSED'] as const;
export type LivestockBatchStatus = (typeof LIVESTOCK_BATCH_STATUSES)[number];

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

// --- sheep ---------------------------------------------------------

export const SHEEP_PRODUCTION_TYPES = ['MEAT', 'DAIRY', 'WOOL', 'BREEDING', 'MIXED', 'OTHER'] as const;
export type SheepProductionType = (typeof SHEEP_PRODUCTION_TYPES)[number];

export interface SheepBatch {
  id: string;
  organizationId: string;
  name: string;
  breed: string | null;
  headCount: number;
  lambCount: number | null;
  maleCount: number | null;
  femaleCount: number | null;
  arrivalDate: string;
  status: LivestockBatchStatus;
  notes: string | null;
  batchNumber: number | null;
  initialHeadCount: number | null;
  averageWeightKg: string | null;
  targetPricePerKg: string | null;
  expectedSaleDate: string | null;
  createdByUserId: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSheepBatchInput {
  name: string;
  breed?: string | null;
  headCount: number;
  lambCount?: number | null;
  maleCount?: number | null;
  femaleCount?: number | null;
  arrivalDate: string;
  notes?: string | null;
  initialHeadCount?: number | null;
  averageWeightKg?: number | null;
  targetPricePerKg?: number | null;
  expectedSaleDate?: string | null;
}

export interface UpdateSheepBatchInput extends Partial<CreateSheepBatchInput> {
  status?: LivestockBatchStatus;
}

export interface CreateSheepFarmInput {
  name: string;
  location: string;
  governorate: string;
  sheepProductionType: SheepProductionType;
  description?: string | null;
  address?: string | null;
  capacity?: number | null;
  currentSheepCount?: number | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}

export interface SheepDailyRecord {
  id: string;
  sheepBatchId: string;
  organizationId: string;
  recordDate: string;
  feedKg: string;
  waterLiters: string;
  appetite: LivestockAppetite | null;
  activity: LivestockActivity | null;
  mortalityCount: number;
  mortalityCause: string | null;
  sickCasesCount: number | null;
  feedType: FeedType | null;
  treatment: string | null;
  expenseAmount: string;
  averageWeightKg: string | null;
  notes: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSheepDailyRecordInput {
  recordDate: string;
  feedKg?: number;
  waterLiters?: number;
  appetite?: LivestockAppetite | null;
  activity?: LivestockActivity | null;
  mortalityCount?: number;
  mortalityCause?: string | null;
  sickCasesCount?: number;
  feedType?: FeedType | null;
  treatment?: string | null;
  expenseAmount?: number;
  averageWeightKg?: number | null;
  notes?: string | null;
}

export interface SheepBatchSummary {
  batchId: string;
  batchNumber: number | null;
  status: string;
  name: string;
  arrivalDate: string;
  initialHeadCount: number;
  currentHeadCount: number;
  totalMortality: number;
  ageDays: number;
  ageWeeks: number;
  ageMonths: number;
  averageWeightKg: string | null;
  targetPricePerKg: string | null;
  expectedSaleDate: string | null;
  totalExpenses: number;
  estimatedProfit: number | null;
  recordsCount: number;
}

export interface SheepWeeklySummary {
  batchId: string;
  weekStart: string;
  weekEnd: string;
  recordsCount: number;
  averageMortality: number;
  averageFeedKg: number;
  averageWaterLiters: number;
  totalMortality: number;
  totalFeedKg: number;
  totalWaterLiters: number;
  totalExpenses: number;
  weightChangeKg: number | null;
}

export interface SheepHealthEvent {
  id: string;
  sheepBatchId: string;
  organizationId: string;
  kind: LivestockHealthEventKind;
  name: string;
  medication: string | null;
  dose: string | null;
  eventDate: string;
  casesCount: number | null;
  coverageCount: number | null;
  nextDueDate: string | null;
  status: LivestockHealthEventStatus;
  notes: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface CreateSheepHealthEventInput {
  kind: LivestockHealthEventKind;
  name: string;
  medication?: string | null;
  dose?: string | null;
  eventDate: string;
  casesCount?: number | null;
  coverageCount?: number | null;
  nextDueDate?: string | null;
  status?: LivestockHealthEventStatus;
  notes?: string | null;
}

export interface SheepCase {
  id: string;
  sheepBatchId: string;
  organizationId: string;
  caseNumber: number | null;
  animalTag: string | null;
  sex: LivestockCaseSex;
  diagnosis: string | null;
  treatment: string | null;
  status: LivestockCaseStatus;
  startedOn: string;
  nextFollowupOn: string | null;
  imageUrl: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface CreateSheepCaseInput {
  animalTag?: string | null;
  sex?: LivestockCaseSex;
  diagnosis?: string | null;
  treatment?: string | null;
  startedOn: string;
  nextFollowupOn?: string | null;
}
export interface SheepCaseSummary {
  deceased: number;
  recovered: number;
  underTreatment: number;
}

export interface ListSheepBatchesFilter {
  page: number;
  pageSize: number;
  status?: LivestockBatchStatus;
}

// --- cattle (mirrors sheep exactly: calf/bull/cow instead of lamb/male/female) --

export const CATTLE_PRODUCTION_TYPES = ['DAIRY', 'BEEF', 'BREEDING', 'MIXED', 'OTHER'] as const;
export type CattleProductionType = (typeof CATTLE_PRODUCTION_TYPES)[number];

export interface CattleBatch {
  id: string;
  organizationId: string;
  name: string;
  breed: string | null;
  headCount: number;
  calfCount: number | null;
  bullCount: number | null;
  cowCount: number | null;
  arrivalDate: string;
  status: LivestockBatchStatus;
  notes: string | null;
  batchNumber: number | null;
  initialHeadCount: number | null;
  averageWeightKg: string | null;
  targetPricePerKg: string | null;
  expectedSaleDate: string | null;
  createdByUserId: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCattleBatchInput {
  name: string;
  breed?: string | null;
  headCount: number;
  calfCount?: number | null;
  bullCount?: number | null;
  cowCount?: number | null;
  arrivalDate: string;
  notes?: string | null;
  initialHeadCount?: number | null;
  averageWeightKg?: number | null;
  targetPricePerKg?: number | null;
  expectedSaleDate?: string | null;
}

export interface UpdateCattleBatchInput extends Partial<CreateCattleBatchInput> {
  status?: LivestockBatchStatus;
}

export interface CreateCattleFarmInput {
  name: string;
  location: string;
  governorate: string;
  cattleProductionType: CattleProductionType;
  description?: string | null;
  address?: string | null;
  capacity?: number | null;
  currentCattleCount?: number | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}

export interface CattleDailyRecord {
  id: string;
  cattleBatchId: string;
  organizationId: string;
  recordDate: string;
  feedKg: string;
  waterLiters: string;
  appetite: LivestockAppetite | null;
  activity: LivestockActivity | null;
  mortalityCount: number;
  mortalityCause: string | null;
  sickCasesCount: number | null;
  feedType: FeedType | null;
  treatment: string | null;
  expenseAmount: string;
  averageWeightKg: string | null;
  notes: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCattleDailyRecordInput {
  recordDate: string;
  feedKg?: number;
  waterLiters?: number;
  appetite?: LivestockAppetite | null;
  activity?: LivestockActivity | null;
  mortalityCount?: number;
  mortalityCause?: string | null;
  sickCasesCount?: number;
  feedType?: FeedType | null;
  treatment?: string | null;
  expenseAmount?: number;
  averageWeightKg?: number | null;
  notes?: string | null;
}

export interface CattleBatchSummary {
  batchId: string;
  batchNumber: number | null;
  status: string;
  name: string;
  arrivalDate: string;
  initialHeadCount: number;
  currentHeadCount: number;
  totalMortality: number;
  ageDays: number;
  ageWeeks: number;
  ageMonths: number;
  averageWeightKg: string | null;
  targetPricePerKg: string | null;
  expectedSaleDate: string | null;
  totalExpenses: number;
  estimatedProfit: number | null;
  recordsCount: number;
}

export interface CattleWeeklySummary {
  batchId: string;
  weekStart: string;
  weekEnd: string;
  recordsCount: number;
  averageMortality: number;
  averageFeedKg: number;
  averageWaterLiters: number;
  totalMortality: number;
  totalFeedKg: number;
  totalWaterLiters: number;
  totalExpenses: number;
  weightChangeKg: number | null;
}

export interface CattleHealthEvent {
  id: string;
  cattleBatchId: string;
  organizationId: string;
  kind: LivestockHealthEventKind;
  name: string;
  medication: string | null;
  dose: string | null;
  eventDate: string;
  casesCount: number | null;
  coverageCount: number | null;
  nextDueDate: string | null;
  status: LivestockHealthEventStatus;
  notes: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface CreateCattleHealthEventInput {
  kind: LivestockHealthEventKind;
  name: string;
  medication?: string | null;
  dose?: string | null;
  eventDate: string;
  casesCount?: number | null;
  coverageCount?: number | null;
  nextDueDate?: string | null;
  status?: LivestockHealthEventStatus;
  notes?: string | null;
}

export interface CattleCase {
  id: string;
  cattleBatchId: string;
  organizationId: string;
  caseNumber: number | null;
  animalTag: string | null;
  sex: LivestockCaseSex;
  diagnosis: string | null;
  treatment: string | null;
  status: LivestockCaseStatus;
  startedOn: string;
  nextFollowupOn: string | null;
  imageUrl: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface CreateCattleCaseInput {
  animalTag?: string | null;
  sex?: LivestockCaseSex;
  diagnosis?: string | null;
  treatment?: string | null;
  startedOn: string;
  nextFollowupOn?: string | null;
}
export interface CattleCaseSummary {
  deceased: number;
  recovered: number;
  underTreatment: number;
}

export interface ListCattleBatchesFilter {
  page: number;
  pageSize: number;
  status?: LivestockBatchStatus;
}

/**
 * The generic `FarmProfile` (from `@/features/farm`) plus the additive fields
 * the backend now returns for every FARM regardless of species. Bridges the
 * gap without editing the poultry-owned `FarmProfile` type.
 */
export interface LivestockFarmProfile extends FarmProfile {
  farmSpecies?: 'POULTRY' | 'SHEEP' | 'CATTLE' | 'MIXED' | null;
  currentSheepCount?: number | null;
  currentCattleCount?: number | null;
  sheepProductionType?: SheepProductionType | null;
  cattleProductionType?: CattleProductionType | null;
}
