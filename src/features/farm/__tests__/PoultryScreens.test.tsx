import { useAuthStore } from '@/features/auth/store';
import { organizationsApi } from '@/features/organizations';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { poultryApi } from '../api';
import PoultryFlockDetailScreen from '../screens/PoultryFlockDetailScreen';
import PoultryFlockFormScreen from '../screens/PoultryFlockFormScreen';
import PoultryFlocksScreen from '../screens/PoultryFlocksScreen';
import type { PoultryFlock } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const getOrg = jest.spyOn(organizationsApi, 'get');
const list = jest.spyOn(poultryApi, 'list');
const detail = jest.spyOn(poultryApi, 'get');
const create = jest.spyOn(poultryApi, 'create');
const update = jest.spyOn(poultryApi, 'update');
const del = jest.spyOn(poultryApi, 'remove');

beforeEach(() => {
  resetRouterMock();
  getOrg.mockReset().mockResolvedValue({ id: 'o1', type: 'FARM', myRole: 'OWNER' } as never);
  [list, detail, create, update, del].forEach((s) => s.mockReset());
  useAuthStore.setState({ session: null });
});
afterAll(() => {
  jest.restoreAllMocks();
  useAuthStore.setState({ session: null });
});

const flock = (over: Partial<PoultryFlock> = {}): PoultryFlock => ({
  id: 'f1',
  organizationId: 'o1',
  name: 'قطيع الشمال',
  birdType: 'CHICKEN',
  birdCount: 500,
  arrivalDate: '2026-01-02',
  status: 'ACTIVE',
  notes: null,
  batchNumber: 1,
  initialBirdCount: 500,
  averageWeightGrams: null,
  targetPricePerKg: null,
  expectedSaleDate: null,
  createdByUserId: 'u1',
  closedAt: null,
  createdAt: '2026-01-02T10:00:00.000Z',
  updatedAt: '2026-01-02T10:00:00.000Z',
  ...over,
});

describe('PoultryFlocksScreen (§13, §19)', () => {
  it('lists flocks scoped to the route organizationId; add CTA navigates to create', async () => {
    setSearchParams({ organizationId: 'o1' });
    list.mockResolvedValue({
      items: [flock()],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<PoultryFlocksScreen />);
    await waitFor(() => expect(screen.getByText('قطيع الشمال')).toBeOnTheScreen());
    expect(list).toHaveBeenCalledWith('o1', {
      page: 1,
      pageSize: 20,
      status: undefined,
      birdType: undefined,
    });
    fireEvent.press(screen.getAllByLabelText('تسجيل قطيع')[0]!);
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations/o1/poultry/create');
  });

  it('empty state', async () => {
    setSearchParams({ organizationId: 'o1' });
    list.mockResolvedValue({ items: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } });
    renderWithProviders(<PoultryFlocksScreen />);
    await waitFor(() => expect(screen.getByText('لا توجد بيانات دواجن')).toBeOnTheScreen());
  });

  it('a 403 surfaces the safe forbidden message', async () => {
    setSearchParams({ organizationId: 'o1' });
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    list.mockRejectedValue(new ApiError({ code: 'FORBIDDEN', message: 'secret', status: 403 }));
    renderWithProviders(<PoultryFlocksScreen />);
    await waitFor(() =>
      expect(screen.getByText('لا تملك صلاحية تنفيذ هذا الإجراء.')).toBeOnTheScreen(),
    );
  });

  it('a STAFF member sees the list but NO add button (read-only per seed)', async () => {
    setSearchParams({ organizationId: 'o1' });
    getOrg.mockResolvedValue({ id: 'o1', type: 'FARM', myRole: 'STAFF' } as never);
    list.mockResolvedValue({
      items: [flock()],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<PoultryFlocksScreen />);
    await waitFor(() => expect(screen.getByText('قطيع الشمال')).toBeOnTheScreen());
    expect(screen.queryByLabelText('تسجيل قطيع')).toBeNull();
  });
});

describe('PoultryFlockDetailScreen (§14, §15, §33)', () => {
  it('shows only backend-backed sections and manage actions for an authorised member', async () => {
    setSearchParams({ organizationId: 'o1', flockId: 'f1' });
    detail.mockResolvedValue(flock());
    renderWithProviders(<PoultryFlockDetailScreen />);
    await waitFor(() => expect(screen.getByText('المعلومات الأساسية')).toBeOnTheScreen());
    // the flock name appears in both the header and the info card
    expect(screen.getAllByText('قطيع الشمال').length).toBeGreaterThan(0);
    // no invented health / production / feed sections
    expect(screen.queryByText('الصحة')).toBeNull();
    expect(screen.getByText('تعديل القطيع')).toBeOnTheScreen();
  });

  it('close flock → PATCH { status: CLOSED }', async () => {
    setSearchParams({ organizationId: 'o1', flockId: 'f1' });
    detail.mockResolvedValue(flock());
    update.mockResolvedValue(flock({ status: 'CLOSED' }));
    renderWithProviders(<PoultryFlockDetailScreen />);
    await waitFor(() => expect(screen.getByText('إغلاق القطيع')).toBeOnTheScreen());
    fireEvent.press(screen.getByText('إغلاق القطيع'));
    await waitFor(() => expect(update).toHaveBeenCalledWith('o1', 'f1', { status: 'CLOSED' }));
  });

  it('delete → confirm → DELETE → back to list', async () => {
    setSearchParams({ organizationId: 'o1', flockId: 'f1' });
    detail.mockResolvedValue(flock());
    del.mockResolvedValue({ deleted: true });
    renderWithProviders(<PoultryFlockDetailScreen />);
    await waitFor(() => expect(screen.getByText('حذف القطيع')).toBeOnTheScreen());
    fireEvent.press(screen.getByText('حذف القطيع'));
    await waitFor(() =>
      expect(screen.getByText(/هل أنت متأكد من حذف هذا القطيع/)).toBeOnTheScreen(),
    );
    const confirms = screen.getAllByText('حذف القطيع');
    fireEvent.press(confirms[confirms.length - 1]!);
    await waitFor(() => expect(del).toHaveBeenCalledWith('o1', 'f1'));
    await waitFor(() =>
      expect(routerMock.replace).toHaveBeenCalledWith('/(app)/organizations/o1/poultry'),
    );
  });

  it('404 → plain not-found state (no auth detail leaked)', async () => {
    setSearchParams({ organizationId: 'o1', flockId: 'x' });
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    detail.mockRejectedValue(new ApiError({ code: 'NOT_FOUND', message: 'secret', status: 404 }));
    renderWithProviders(<PoultryFlockDetailScreen />);
    await waitFor(() => expect(screen.getByText('القطيع غير موجود')).toBeOnTheScreen());
    expect(screen.queryByText('secret')).toBeNull();
  });
});

describe('PoultryFlockFormScreen (§15, §32)', () => {
  beforeEach(() => setSearchParams({ organizationId: 'o1' }));

  it('blocks submit until name / count / arrival date are valid', async () => {
    renderWithProviders(<PoultryFlockFormScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'حفظ القطيع' }));
    await waitFor(() => expect(screen.getByText('اسم القطيع مطلوب.')).toBeOnTheScreen());
    expect(create).not.toHaveBeenCalled();
  });

  it('creates a flock with a numeric birdCount and the route organization id', async () => {
    create.mockResolvedValueOnce(flock());
    renderWithProviders(<PoultryFlockFormScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('مثال: قطيع الحظيرة الشمالية'), 'قطيع الشمال');
    fireEvent.changeText(screen.getByPlaceholderText('0'), '500');
    fireEvent.changeText(screen.getByPlaceholderText('YYYY-MM-DD'), '2026-01-02');
    fireEvent.press(screen.getByRole('button', { name: 'حفظ القطيع' }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        'o1',
        expect.objectContaining({ name: 'قطيع الشمال', birdCount: 500, arrivalDate: '2026-01-02' }),
      ),
    );
  });

  it('edit mode prefills the flock and PATCHes it', async () => {
    setSearchParams({ organizationId: 'o1', flockId: 'f1' });
    detail.mockResolvedValue(flock());
    update.mockResolvedValueOnce(flock());
    renderWithProviders(<PoultryFlockFormScreen />);
    await waitFor(() => expect(screen.getByDisplayValue('قطيع الشمال')).toBeOnTheScreen());
    expect(screen.getByDisplayValue('500')).toBeOnTheScreen();
    // The owner sees the sale price field (the estimated-profit input) and must fill it.
    await screen.findByText(/سعر البيع المتوقع/);
    const price = screen.getByPlaceholderText('0.00');
    fireEvent.changeText(price, '3.25');
    fireEvent.press(screen.getByRole('button', { name: 'حفظ التعديلات' }));
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(
        'o1',
        'f1',
        expect.objectContaining({ name: 'قطيع الشمال', birdCount: 500, targetPricePerKg: 3.25 }),
      ),
    );
  });

  it('a farm veterinarian edits without seeing or sending the sale price', async () => {
    setSearchParams({ organizationId: 'o1', flockId: 'f1' });
    getOrg.mockResolvedValue({ id: 'o1', type: 'FARM', myRole: 'VETERINARIAN' } as never);
    detail.mockResolvedValue(flock());
    update.mockResolvedValueOnce(flock());
    renderWithProviders(<PoultryFlockFormScreen />);
    await waitFor(() => expect(screen.getByDisplayValue('قطيع الشمال')).toBeOnTheScreen());
    await waitFor(() => expect(getOrg).toHaveBeenCalled());
    expect(screen.queryByText(/سعر البيع المتوقع/)).toBeNull();
    expect(screen.queryByPlaceholderText('0.00')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'حفظ التعديلات' }));
    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update.mock.calls[0]?.[2]).not.toHaveProperty('targetPricePerKg', expect.anything());
  });

  it('maps a 409 POULTRY_FLOCK_NOT_ACTIVE to the closed-flock message', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    create.mockRejectedValueOnce(
      new ApiError({ code: 'POULTRY_FLOCK_NOT_ACTIVE' as never, message: 'raw', status: 409 }),
    );
    renderWithProviders(<PoultryFlockFormScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('مثال: قطيع الحظيرة الشمالية'), 'x');
    fireEvent.changeText(screen.getByPlaceholderText('0'), '1');
    fireEvent.changeText(screen.getByPlaceholderText('YYYY-MM-DD'), '2026-01-02');
    fireEvent.press(screen.getByRole('button', { name: 'حفظ القطيع' }));
    await waitFor(() =>
      expect(screen.getByText('هذا القطيع مغلق ولا يمكن تعديل بياناته.')).toBeOnTheScreen(),
    );
    expect(screen.queryByText('raw')).toBeNull();
  });
});
