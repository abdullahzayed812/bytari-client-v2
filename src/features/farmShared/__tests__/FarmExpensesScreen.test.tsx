import { TextInput } from 'react-native';

import type { FarmExpense } from '@/features/farm/types';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { farmOpsApi } from '../api';
import FarmExpensesScreen from '../screens/FarmExpensesScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);
jest.mock('@/lib/env', () => ({ ...jest.requireActual('@/lib/env'), devDataEnabled: false }));

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
  batch: null,
  ...over,
});

describe('FarmExpensesScreen — manual cards, daily-record amounts in the totals', () => {
  beforeEach(() => {
    resetRouterMock();
    setSearchParams({ organizationId: 'o1' });
    jest.spyOn(farmOpsApi, 'expenseSummary').mockResolvedValue({
      totalThisWeek: 2350,
      totalThisMonth: 2350,
      dailyAverageThisMonth: 200,
      dailyRecordsTotal: 850,
      manualTotal: 1500,
      overallTotal: 2350,
    });
    jest.spyOn(farmOpsApi, 'listExpenses').mockResolvedValue({
      items: [
        // Newest added first, as the server orders them.
        expense({
          id: 'm2',
          description: 'علاج الدفعة',
          category: 'MEDICINE',
          poultryFlockId: 'f1',
          batch: { kind: 'POULTRY', id: 'f1', name: 'الدفعة الأولى', batchNumber: 1 },
        }),
        expense({ id: 'm1', description: 'شراء علف أسبوعي' }),
      ],
      meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    });
    jest
      .spyOn(farmOpsApi, 'listActiveBatches')
      .mockResolvedValue([{ id: 'f1', name: 'الدفعة الأولى', batchNumber: 1 }]);
  });
  afterEach(() => jest.restoreAllMocks());

  it('shows the daily-record amount in the summary area, not as a card', async () => {
    renderWithProviders(<FarmExpensesScreen />);
    expect(await screen.findByText('مصاريف السجلات اليومية')).toBeOnTheScreen();
    expect(screen.getByText('850 د.ع')).toBeOnTheScreen();
    expect(screen.getByText('إجمالي المصاريف')).toBeOnTheScreen();
    expect(screen.queryByText('مصروف السجل اليومي')).toBeNull();
    // Cards: the manual expenses only, in server order, with the linked batch.
    expect(await screen.findByText('علاج الدفعة')).toBeOnTheScreen();
    expect(screen.getByText('الدفعة: الدفعة الأولى')).toBeOnTheScreen();
    expect(screen.getByText('شراء علف أسبوعي')).toBeOnTheScreen();
  });

  it('every card opens the expense detail', async () => {
    renderWithProviders(<FarmExpensesScreen />);
    fireEvent.press(await screen.findByText('شراء علف أسبوعي'));
    expect(routerMock.push).toHaveBeenCalledTimes(1);
  });

  it('the add dialog accepts a decimal amount and an optional batch link', async () => {
    const create = jest.spyOn(farmOpsApi, 'createExpense').mockResolvedValue(expense({}));
    renderWithProviders(<FarmExpensesScreen batchKind="SHEEP" />);
    fireEvent.press(await screen.findByRole('button', { name: 'إضافة مصروف' }));

    fireEvent.press(screen.getByRole('button', { name: 'نوع المصروف' }));
    // "علف" is also a filter chip behind the dialog — the sheet's option is the last match.
    fireEvent.press((await screen.findAllByText('علف')).at(-1)!);
    const amountInput = screen
      .UNSAFE_getAllByType(TextInput)
      .find((i) => i.props.keyboardType === 'decimal-pad')!;
    fireEvent.changeText(amountInput, '1250.5');
    fireEvent.changeText(screen.getByPlaceholderText('2026-9-1'), '2026-10-12');
    // The picker is enabled once the farm's active batches have loaded.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'الدفعة (اختياري)' })).toBeEnabled(),
    );
    fireEvent.press(screen.getByRole('button', { name: 'الدفعة (اختياري)' }));
    fireEvent.press(await screen.findByText('الدفعة الأولى (#1)'));
    fireEvent.press(screen.getByRole('button', { name: 'حفظ' }));

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create).toHaveBeenCalledWith(
      'o1',
      expect.objectContaining({ category: 'FEED', amount: 1250.5, sheepBatchId: 'f1' }),
    );
    expect(farmOpsApi.listActiveBatches).toHaveBeenCalledWith('o1', 'SHEEP');
  });
});
