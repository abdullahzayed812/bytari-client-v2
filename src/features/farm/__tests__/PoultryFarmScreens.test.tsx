import { useAuthStore } from '@/features/auth/store';
import { organizationsApi } from '@/features/organizations';
import { renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { poultryApi, poultryOpsApi } from '../api';
import FarmDetailsScreen from '../screens/FarmDetailsScreen';
import PoultryFarmsLandingScreen from '../screens/PoultryFarmsLandingScreen';
import type { BatchSummary, PoultryFlock } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);
jest.mock('@/features/ads', () => ({
  Advertisement: () => null,
  useAds: () => ({ data: [] }),
}));

const listMine = jest.spyOn(organizationsApi, 'listMine');
const getOrg = jest.spyOn(organizationsApi, 'get');
const listFlocks = jest.spyOn(poultryApi, 'list');
const getProfile = jest.spyOn(poultryOpsApi, 'getFarmProfile');
const getBatchSummary = jest.spyOn(poultryOpsApi, 'batchSummary');
const getWeekly = jest.spyOn(poultryOpsApi, 'weeklySummary');
const listDaily = jest.spyOn(poultryOpsApi, 'listDailyRecords');
const listMembers = jest.spyOn(organizationsApi, 'listMembers');

const flock = (over: Partial<PoultryFlock> = {}): PoultryFlock => ({
  id: 'f1',
  organizationId: 'o1',
  name: 'الدفعة الأولى',
  birdType: 'CHICKEN',
  birdCount: 5000,
  arrivalDate: '2026-01-02',
  status: 'ACTIVE',
  notes: null,
  batchNumber: 1,
  initialBirdCount: 5000,
  averageWeightGrams: '230',
  targetPricePerKg: null,
  expectedSaleDate: null,
  createdByUserId: 'u1',
  closedAt: null,
  createdAt: '2026-01-02T10:00:00.000Z',
  updatedAt: '2026-01-02T10:00:00.000Z',
  ...over,
});

const summary = (over: Partial<BatchSummary> = {}): BatchSummary => ({
  flockId: 'f1',
  batchNumber: 1,
  status: 'ACTIVE',
  birdType: 'CHICKEN',
  name: 'الدفعة الأولى',
  arrivalDate: '2026-01-02',
  initialBirdCount: 5000,
  currentBirdCount: 4950,
  totalMortality: 50,
  ageDays: 32,
  ageWeeks: 4,
  ageMonths: 1,
  averageWeightGrams: '230',
  targetPricePerKg: null,
  expectedSaleDate: null,
  totalExpenses: 1000,
  estimatedProfit: null,
  recordsCount: 3,
  ...over,
});

beforeEach(() => {
  resetRouterMock();
  useAuthStore.setState({ session: null });
  [
    listMine,
    getOrg,
    listFlocks,
    getProfile,
    getBatchSummary,
    getWeekly,
    listDaily,
    listMembers,
  ].forEach((s) => s.mockReset());
});

describe('PoultryFarmsLandingScreen', () => {
  it('renders the ad slot, add-farm card and the membership-scoped farm list', async () => {
    listMine.mockResolvedValue({
      items: [
        {
          id: 'o1',
          type: 'FARM',
          name: 'حقل الجنوب للدواجن',
          description: 'محافظة بابل',
          myRole: 'OWNER',
        } as never,
      ],
      meta: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
    });
    listFlocks.mockResolvedValue({
      items: [flock()],
      meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
    });

    renderWithProviders(<PoultryFarmsLandingScreen />);

    expect(await screen.findByText('إضافة حقل دواجن')).toBeTruthy();
    expect(await screen.findByText('حقل الجنوب للدواجن')).toBeTruthy();
    // farms list came from the membership-scoped org list, never a public discovery call
    await waitFor(() => expect(listMine).toHaveBeenCalled());
  });

  it('shows the empty state when the user has no farms', async () => {
    listMine.mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 50, total: 0, totalPages: 1 },
    });
    renderWithProviders(<PoultryFarmsLandingScreen />);
    expect(await screen.findByText('لا توجد حقول دواجن بعد')).toBeTruthy();
  });
});

describe('FarmDetailsScreen', () => {
  beforeEach(() => {
    setSearchParams({ organizationId: 'o1' });
    getOrg.mockResolvedValue({
      id: 'o1',
      type: 'FARM',
      name: 'مزرعة السعادة للدواجن',
      description: 'المنصورة',
      myRole: 'OWNER',
    } as never);
    getProfile.mockResolvedValue({
      imageUrl: null,
      address: 'المنصورة - الدقهلية',
      capacity: 10000,
      establishedOn: '2024-01-01',
      farmCategory: 'MIXED',
    });
    listMembers.mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    getWeekly.mockResolvedValue({
      flockId: 'f1',
      weekStart: '2026-01-27',
      weekEnd: '2026-02-02',
      recordsCount: 0,
      averageMortality: 0,
      averageFeedKg: 0,
      averageWaterLiters: 0,
      totalMortality: 0,
      totalFeedKg: 0,
      totalWaterLiters: 0,
      totalExpenses: 0,
      weightChangeGrams: null,
    });
    listDaily.mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
  });

  it('renders the farm header and a server-computed batch summary', async () => {
    listFlocks.mockResolvedValue({
      items: [flock()],
      meta: { page: 1, pageSize: 1, total: 1, totalPages: 1 },
    });
    getBatchSummary.mockResolvedValue(summary());

    renderWithProviders(<FarmDetailsScreen />);

    expect(await screen.findByText('مزرعة السعادة للدواجن')).toBeTruthy();
    expect(await screen.findByText('الدفعة رقم 1')).toBeTruthy();
    // current count is derived server-side (5000 initial − 50 mortality)
    expect(await screen.findByText('4,950')).toBeTruthy();
    expect(getBatchSummary).toHaveBeenCalledWith('o1', 'f1');
  });

  it('shows the empty-batch state when there is no active batch', async () => {
    listFlocks.mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 1, total: 0, totalPages: 1 },
    });

    renderWithProviders(<FarmDetailsScreen />);

    expect(await screen.findByText('لا توجد دفعة نشطة حالياً')).toBeTruthy();
    expect(getBatchSummary).not.toHaveBeenCalled();
  });

  it('turns a 403 into a plain "no access" state, never an authz detail', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    getOrg.mockRejectedValue(
      new ApiError({ code: 'FORBIDDEN', message: 'forbidden', status: 403 }),
    );
    listFlocks.mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 1, total: 0, totalPages: 1 },
    });
    renderWithProviders(<FarmDetailsScreen />);
    await waitFor(() => expect(screen.getByText('لا تملك صلاحية الوصول')).toBeOnTheScreen());
    expect(screen.queryByText('forbidden')).toBeNull();
    expect(routerMock.push).not.toHaveBeenCalled();
  });
});
