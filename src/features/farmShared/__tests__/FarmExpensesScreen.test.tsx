import type { FarmExpense } from '@/features/farm/types';
import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { farmOpsApi } from '../api';
import FarmExpensesScreen from '../screens/FarmExpensesScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const expense = (over: Partial<FarmExpense>): FarmExpense => ({
  id: 'e1',
  organizationId: 'o1',
  poultryFlockId: null,
  category: 'FEED',
  amount: '1500.00',
  description: null,
  spentOn: '2026-10-12',
  createdByUserId: 'u1',
  createdAt: '2026-10-12T10:00:00.000Z',
  updatedAt: '2026-10-12T10:00:00.000Z',
  source: 'MANUAL',
  dailyRecord: null,
  ...over,
});

describe('FarmExpensesScreen — daily-record expenses', () => {
  beforeEach(() => {
    resetRouterMock();
    setSearchParams({ organizationId: 'o1' });
    jest.spyOn(farmOpsApi, 'expenseSummary').mockResolvedValue({
      totalThisWeek: 2350,
      totalThisMonth: 2350,
      dailyAverageThisMonth: 200,
    });
    jest.spyOn(farmOpsApi, 'listExpenses').mockResolvedValue({
      items: [
        expense({
          id: 'r1',
          category: 'OTHER',
          amount: '850.00',
          source: 'DAILY_RECORD',
          poultryFlockId: 'f1',
          dailyRecord: {
            recordId: 'r1',
            batchKind: 'POULTRY',
            batchId: 'f1',
            batchName: 'الدفعة الأولى',
            batchNumber: 1,
          },
        }),
        expense({ id: 'm1', description: 'شراء علف أسبوعي' }),
      ],
      meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    });
  });
  afterEach(() => jest.restoreAllMocks());

  it('lists the daily-record expense next to manual ones, labelled with its batch', async () => {
    renderWithProviders(<FarmExpensesScreen />);
    expect(await screen.findByText('مصروف السجل اليومي')).toBeOnTheScreen();
    expect(screen.getByText('الدفعة: الدفعة الأولى')).toBeOnTheScreen();
    expect(screen.getByText('شراء علف أسبوعي')).toBeOnTheScreen();
    // Totals come straight from the server (which counts each line once).
    expect(screen.getAllByText('2,350 د.ع').length).toBeGreaterThan(0);
  });

  it('only manual expenses open the expense detail (daily ones are edited in their daily record)', async () => {
    renderWithProviders(<FarmExpensesScreen />);
    fireEvent.press(await screen.findByText('مصروف السجل اليومي'));
    expect(routerMock.push).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('شراء علف أسبوعي'));
    expect(routerMock.push).toHaveBeenCalledTimes(1);
  });
});
