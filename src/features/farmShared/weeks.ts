/**
 * Weekly daily-data cycles (Week N: Day 1 … Day 7) — shared by the poultry,
 * sheep and cattle farm features. Mirrors the server's `DailyRecordWeeksDTO`.
 */

/** One batch-relative week (mirrors the server's `DailyRecordWeekSummary`). */
export interface DailyRecordWeekSummary {
  weekNumber: number;
  daysRecorded: number;
  complete: boolean;
  firstDate: string | null;
  lastDate: string | null;
  totalMortality: number;
  totalFeedKg: number;
  totalWaterLiters: number;
  totalExpenses: number;
  /** Grams for poultry, kg for sheep / cattle (the caller formats the unit). */
  latestAverageWeight: string | null;
}

/** `GET …/daily-records/weeks`. */
export interface DailyRecordWeeks {
  /** The week the next daily record goes into. */
  currentWeek: number;
  nextDay: number;
  /** Every week with at least one record, newest first. */
  weeks: DailyRecordWeekSummary[];
}
