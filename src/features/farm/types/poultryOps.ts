/**
 * Poultry Farm operations contract — the Farm Details screen. Mirrors
 * `server/src/modules/farms/domain/poultry-ops.types.ts` and the `poultryOps`
 * OpenAPI fragment EXACTLY. Backend `numeric` columns surface as strings;
 * server-computed summary figures are numbers.
 */

export const FARM_CATEGORIES = [
  'BROILER',
  'LAYER',
  'MIXED',
  'BREEDER',
  'HATCHERY',
  'OTHER',
] as const;
export type FarmCategory = (typeof FARM_CATEGORIES)[number];

export const POULTRY_APPETITE_LEVELS = ['GOOD', 'NORMAL', 'WEAK', 'NONE'] as const;
export type PoultryAppetite = (typeof POULTRY_APPETITE_LEVELS)[number];

export const POULTRY_ACTIVITY_LEVELS = ['ACTIVE', 'NORMAL', 'LETHARGIC'] as const;
export type PoultryActivity = (typeof POULTRY_ACTIVITY_LEVELS)[number];

export const FARM_EXPENSE_CATEGORIES = [
  'FEED',
  'MEDICINE',
  'WATER_TRANSPORT',
  'LABOR',
  'UTILITIES',
  'EQUIPMENT',
  'OTHER',
] as const;
export type FarmExpenseCategory = (typeof FARM_EXPENSE_CATEGORIES)[number];

export const POULTRY_HEALTH_EVENT_KINDS = ['TREATMENT', 'VACCINATION'] as const;
export type PoultryHealthEventKind = (typeof POULTRY_HEALTH_EVENT_KINDS)[number];

export const POULTRY_HEALTH_EVENT_STATUSES = ['SCHEDULED', 'ONGOING', 'DONE', 'RECOVERED'] as const;
export type PoultryHealthEventStatus = (typeof POULTRY_HEALTH_EVENT_STATUSES)[number];

export const FARM_APPOINTMENT_CATEGORIES = [
  'VACCINATION',
  'TREATMENT',
  'INDIVIDUAL_CASE',
  'VET_VISIT',
  'OTHER',
] as const;
export type FarmAppointmentCategory = (typeof FARM_APPOINTMENT_CATEGORIES)[number];

export const FARM_APPOINTMENT_STATUSES = ['UPCOMING', 'DONE', 'CANCELLED'] as const;
export type FarmAppointmentStatus = (typeof FARM_APPOINTMENT_STATUSES)[number];

export const POULTRY_CASE_STATUSES = ['UNDER_TREATMENT', 'RECOVERED', 'DECEASED'] as const;
export type PoultryCaseStatus = (typeof POULTRY_CASE_STATUSES)[number];

export const POULTRY_CASE_SEXES = ['MALE', 'FEMALE', 'UNKNOWN'] as const;
export type PoultryCaseSex = (typeof POULTRY_CASE_SEXES)[number];

// --- farm profile -----------------------------------------------

export interface FarmProfile {
  imageUrl: string | null;
  location: string | null;
  governorate: string | null;
  address: string | null;
  capacity: number | null;
  currentBirdCount: number | null;
  establishedOn: string | null;
  poultryProductionType: FarmCategory | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
}

export interface UpdateFarmProfileInput {
  location?: string | null;
  governorate?: string | null;
  address?: string | null;
  capacity?: number | null;
  currentBirdCount?: number | null;
  establishedOn?: string | null;
  poultryProductionType?: FarmCategory | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}

/** `POST /organizations/farms` body — the "Add Poultry Farm" form. */
export interface CreatePoultryFarmInput {
  name: string;
  location: string;
  governorate: string;
  poultryProductionType: FarmCategory;
  description?: string | null;
  address?: string | null;
  capacity?: number | null;
  currentBirdCount?: number | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
}

// --- daily records -------------------------------------------

export interface PoultryDailyRecord {
  id: string;
  poultryFlockId: string;
  organizationId: string;
  recordDate: string;
  feedKg: string;
  waterLiters: string;
  appetite: PoultryAppetite | null;
  activity: PoultryActivity | null;
  mortalityCount: number;
  mortalityCause: string | null;
  treatment: string | null;
  expenseAmount: string;
  averageWeightGrams: string | null;
  notes: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyRecordInput {
  recordDate: string;
  feedKg?: number;
  waterLiters?: number;
  appetite?: PoultryAppetite | null;
  activity?: PoultryActivity | null;
  mortalityCount?: number;
  mortalityCause?: string | null;
  treatment?: string | null;
  expenseAmount?: number;
  averageWeightGrams?: number | null;
  notes?: string | null;
}

// --- batch + weekly summary (server-computed) --------------

export interface BatchSummary {
  flockId: string;
  batchNumber: number | null;
  status: string;
  birdType: string;
  name: string;
  arrivalDate: string;
  initialBirdCount: number;
  currentBirdCount: number;
  totalMortality: number;
  ageDays: number;
  ageWeeks: number;
  ageMonths: number;
  averageWeightGrams: string | null;
  targetPricePerKg: string | null;
  expectedSaleDate: string | null;
  totalExpenses: number;
  estimatedProfit: number | null;
  recordsCount: number;
}

export interface WeeklySummary {
  flockId: string;
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
  weightChangeGrams: number | null;
}

// --- expenses ---------------------------------------------

export interface FarmExpense {
  id: string;
  organizationId: string;
  poultryFlockId: string | null;
  category: FarmExpenseCategory;
  amount: string;
  description: string | null;
  spentOn: string;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FarmExpenseSummary {
  totalThisWeek: number;
  totalThisMonth: number;
  dailyAverageThisMonth: number;
}

export interface CreateFarmExpenseInput {
  category: FarmExpenseCategory;
  amount: number;
  description?: string | null;
  spentOn: string;
  poultryFlockId?: string | null;
}

// --- health events -------------------------------------

export interface PoultryHealthEvent {
  id: string;
  poultryFlockId: string;
  organizationId: string;
  kind: PoultryHealthEventKind;
  name: string;
  medication: string | null;
  dose: string | null;
  eventDate: string;
  casesCount: number | null;
  coverageCount: number | null;
  nextDueDate: string | null;
  status: PoultryHealthEventStatus;
  notes: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHealthEventInput {
  kind: PoultryHealthEventKind;
  name: string;
  medication?: string | null;
  dose?: string | null;
  eventDate: string;
  casesCount?: number | null;
  coverageCount?: number | null;
  nextDueDate?: string | null;
  status?: PoultryHealthEventStatus;
  notes?: string | null;
}

// --- appointments ------------------------------------

export interface FarmAppointment {
  id: string;
  organizationId: string;
  poultryFlockId: string | null;
  title: string;
  description: string | null;
  category: FarmAppointmentCategory;
  scheduledFor: string;
  status: FarmAppointmentStatus;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFarmAppointmentInput {
  title: string;
  description?: string | null;
  category?: FarmAppointmentCategory;
  scheduledFor: string;
  poultryFlockId?: string | null;
}

// --- individual cases ------------------------------

export interface PoultryCase {
  id: string;
  poultryFlockId: string;
  organizationId: string;
  caseNumber: number | null;
  animalTag: string | null;
  sex: PoultryCaseSex;
  diagnosis: string | null;
  treatment: string | null;
  status: PoultryCaseStatus;
  startedOn: string;
  nextFollowupOn: string | null;
  imageUrl: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePoultryCaseInput {
  animalTag?: string | null;
  sex?: PoultryCaseSex;
  diagnosis?: string | null;
  treatment?: string | null;
  startedOn: string;
  nextFollowupOn?: string | null;
}

export interface PoultryCaseSummary {
  deceased: number;
  recovered: number;
  underTreatment: number;
}
