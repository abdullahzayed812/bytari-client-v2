import { useAuthStore } from '@/features/auth/store';
import { organizationsApi } from '@/features/organizations';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { veterinaryStoreProductsApi } from '../api';
import VeterinaryStoreProductDetailScreen from '../screens/VeterinaryStoreProductDetailScreen';
import type { VeterinaryStoreProduct } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const getOrg = jest.spyOn(organizationsApi, 'get');
const detail = jest.spyOn(veterinaryStoreProductsApi, 'get');
const update = jest.spyOn(veterinaryStoreProductsApi, 'update');
const del = jest.spyOn(veterinaryStoreProductsApi, 'remove');
const adjust = jest.spyOn(veterinaryStoreProductsApi, 'adjustStock');

beforeEach(() => {
  resetRouterMock();
  getOrg
    .mockReset()
    .mockResolvedValue({ id: 'o1', type: 'VETERINARY_STORE', myRole: 'OWNER' } as never);
  [detail, update, del, adjust].forEach((s) => s.mockReset());
  useAuthStore.setState({ session: null });
});
afterAll(() => {
  jest.restoreAllMocks();
  useAuthStore.setState({ session: null });
});

const product = (over: Partial<VeterinaryStoreProduct> = {}): VeterinaryStoreProduct => ({
  id: 'p1',
  organizationId: 'o1',
  name: 'مضاد حيوي',
  description: 'للاستخدام البيطري',
  productType: 'MEDICINE',
  price: '120.00',
  stockQuantity: 40,
  status: 'ACTIVE',
  primaryImageUrl: null,
  images: [],
  subtype: null,
  weight: null,
  usageInstructions: null,
  dosage: null,
  shelfLife: null,
  manufacturer: null,
  highlights: [],
  createdByUserId: 'u1',
  createdAt: '2026-02-01T00:00:00.000Z',
  updatedAt: '2026-02-02T00:00:00.000Z',
  ...over,
});

describe('VeterinaryStoreProductDetailScreen (§6, §12, §23, §24)', () => {
  it('renders only backend DTO fields + manage actions for an authorised member', async () => {
    setSearchParams({ organizationId: 'o1', productId: 'p1' });
    detail.mockResolvedValue(product());
    renderWithProviders(<VeterinaryStoreProductDetailScreen />);
    await waitFor(() => expect(screen.getByText('المعلومات الأساسية')).toBeOnTheScreen());
    expect(screen.getAllByText('مضاد حيوي').length).toBeGreaterThan(0);
    expect(screen.getByText('للاستخدام البيطري')).toBeOnTheScreen();
    // no invented image / vendor / rating sections
    expect(screen.queryByText('المورّد')).toBeNull();
    expect(screen.getByText('تعديل المنتج')).toBeOnTheScreen();
  });

  it('a STAFF member sees the detail but no manage actions', async () => {
    setSearchParams({ organizationId: 'o1', productId: 'p1' });
    getOrg.mockResolvedValue({ id: 'o1', type: 'VETERINARY_STORE', myRole: 'STAFF' } as never);
    detail.mockResolvedValue(product());
    renderWithProviders(<VeterinaryStoreProductDetailScreen />);
    await waitFor(() => expect(screen.getByText('المعلومات الأساسية')).toBeOnTheScreen());
    expect(screen.queryByText('تعديل المنتج')).toBeNull();
    expect(screen.queryByText('تعديل المخزون')).toBeNull();
  });

  it('deactivate → confirm → DELETE (soft-delete)', async () => {
    setSearchParams({ organizationId: 'o1', productId: 'p1' });
    detail.mockResolvedValue(product());
    del.mockResolvedValue(product({ status: 'INACTIVE' }));
    renderWithProviders(<VeterinaryStoreProductDetailScreen />);
    await waitFor(() => expect(screen.getByText('إيقاف المنتج')).toBeOnTheScreen());
    fireEvent.press(screen.getByText('إيقاف المنتج'));
    await waitFor(() => expect(screen.getByText(/سيصبح المنتج غير متاح/)).toBeOnTheScreen());
    const confirms = screen.getAllByText('إيقاف المنتج');
    fireEvent.press(confirms[confirms.length - 1]!);
    await waitFor(() => expect(del).toHaveBeenCalledWith('o1', 'p1'));
  });

  it('reactivate on an INACTIVE product → PATCH { status: ACTIVE }', async () => {
    setSearchParams({ organizationId: 'o1', productId: 'p1' });
    detail.mockResolvedValue(product({ status: 'INACTIVE' }));
    update.mockResolvedValue(product({ status: 'ACTIVE' }));
    renderWithProviders(<VeterinaryStoreProductDetailScreen />);
    await waitFor(() => expect(screen.getByText('إعادة تفعيل المنتج')).toBeOnTheScreen());
    fireEvent.press(screen.getByText('إعادة تفعيل المنتج'));
    await waitFor(() => expect(update).toHaveBeenCalledWith('o1', 'p1', { status: 'ACTIVE' }));
  });

  it('adjust stock → POSTs a numeric signed delta to the stock endpoint', async () => {
    setSearchParams({ organizationId: 'o1', productId: 'p1' });
    detail.mockResolvedValue(product());
    adjust.mockResolvedValue(product({ stockQuantity: 28 }));
    renderWithProviders(<VeterinaryStoreProductDetailScreen />);
    await waitFor(() => expect(screen.getByText('تعديل المخزون')).toBeOnTheScreen());
    fireEvent.press(screen.getByText('تعديل المخزون'));
    await waitFor(() => expect(screen.getByPlaceholderText('مثال: 25 أو 12-')).toBeOnTheScreen());
    fireEvent.changeText(screen.getByPlaceholderText('مثال: 25 أو 12-'), '-12');
    fireEvent.press(screen.getByRole('button', { name: 'تطبيق التغيير' }));
    await waitFor(() =>
      expect(adjust).toHaveBeenCalledWith('o1', 'p1', { delta: -12, reason: undefined }),
    );
  });

  it('maps a 409 INSUFFICIENT_STOCK to the "below zero" message (raw hidden)', async () => {
    setSearchParams({ organizationId: 'o1', productId: 'p1' });
    detail.mockResolvedValue(product());
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    adjust.mockRejectedValue(
      new ApiError({ code: 'INSUFFICIENT_STOCK' as never, message: 'raw', status: 409 }),
    );
    renderWithProviders(<VeterinaryStoreProductDetailScreen />);
    await waitFor(() => expect(screen.getByText('تعديل المخزون')).toBeOnTheScreen());
    fireEvent.press(screen.getByText('تعديل المخزون'));
    fireEvent.changeText(screen.getByPlaceholderText('مثال: 25 أو 12-'), '-999');
    fireEvent.press(screen.getByRole('button', { name: 'تطبيق التغيير' }));
    await waitFor(() =>
      expect(
        screen.getByText('لا يمكن أن يصبح المخزون أقل من صفر بعد هذا التغيير.'),
      ).toBeOnTheScreen(),
    );
    expect(screen.queryByText('raw')).toBeNull();
  });

  it('404 → plain not-found state (no backend detail leaked)', async () => {
    setSearchParams({ organizationId: 'o1', productId: 'x' });
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    detail.mockRejectedValue(new ApiError({ code: 'NOT_FOUND', message: 'secret', status: 404 }));
    renderWithProviders(<VeterinaryStoreProductDetailScreen />);
    await waitFor(() => expect(screen.getByText('المنتج غير متاح')).toBeOnTheScreen());
    expect(screen.queryByText('secret')).toBeNull();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });
});
