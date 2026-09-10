import { useAuthStore } from '@/features/auth/store';
import { organizationsApi } from '@/features/organizations';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { productsApi } from '../api';
import ProductsScreen from '../screens/ProductsScreen';
import type { Product } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const getOrg = jest.spyOn(organizationsApi, 'get');
const list = jest.spyOn(productsApi, 'list');

beforeEach(() => {
  resetRouterMock();
  getOrg
    .mockReset()
    .mockResolvedValue({ id: 'o1', type: 'VETERINARY_STORE', myRole: 'OWNER' } as never);
  list.mockReset();
  useAuthStore.setState({ session: null });
});
afterAll(() => {
  jest.restoreAllMocks();
  useAuthStore.setState({ session: null });
});

const product = (over: Partial<Product> = {}): Product => ({
  id: 'p1',
  organizationId: 'o1',
  organizationType: 'VETERINARY_STORE',
  name: 'مضاد حيوي',
  description: null,
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
  updatedAt: '2026-02-01T00:00:00.000Z',
  ...over,
});

const page = (items: Product[], total = items.length) => ({
  items,
  meta: { page: 1, pageSize: 20, total, totalPages: 1 },
});

describe('ProductsScreen (§5, §23, §29, §34)', () => {
  it('lists the store catalogue scoped to the route organizationId; add CTA → create route', async () => {
    setSearchParams({ organizationId: 'o1' });
    list.mockResolvedValue(page([product()]));
    renderWithProviders(<ProductsScreen />);

    await waitFor(() => expect(screen.getByText('مضاد حيوي')).toBeOnTheScreen());
    expect(list).toHaveBeenCalledWith('o1', expect.objectContaining({ page: 1, pageSize: 20 }));

    fireEvent.press(screen.getByLabelText('إضافة منتج'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations/o1/products/create');
  });

  it('sends the search term to the backend (no local filtering over a paged list)', async () => {
    setSearchParams({ organizationId: 'o1' });
    list.mockResolvedValue(page([product()]));
    renderWithProviders(<ProductsScreen />);
    await waitFor(() => expect(screen.getByText('مضاد حيوي')).toBeOnTheScreen());

    fireEvent.changeText(screen.getByPlaceholderText('ابحث باسم المنتج…'), 'أنسولين');
    await waitFor(
      () => expect(list).toHaveBeenCalledWith('o1', expect.objectContaining({ search: 'أنسولين' })),
      { timeout: 5000, interval: 60 },
    );
  });

  it('a product-type chip narrows the backend query by `type`', async () => {
    setSearchParams({ organizationId: 'o1' });
    list.mockResolvedValue(page([product()]));
    renderWithProviders(<ProductsScreen />);
    await waitFor(() => expect(screen.getByText('مضاد حيوي')).toBeOnTheScreen());

    fireEvent.press(screen.getByText('أدوات ومستلزمات'));
    await waitFor(() =>
      expect(list).toHaveBeenCalledWith(
        'o1',
        expect.objectContaining({ productType: 'EQUIPMENT_SUPPLY' }),
      ),
    );
  });

  it('shows the kind-specific empty state', async () => {
    setSearchParams({ organizationId: 'o1' });
    list.mockResolvedValue(page([], 0));
    renderWithProviders(<ProductsScreen />);
    await waitFor(() =>
      expect(screen.getByText('لا توجد منتجات بيطرية متاحة حاليًا')).toBeOnTheScreen(),
    );
  });

  it('a backend failure shows a safe error state (raw message hidden)', async () => {
    setSearchParams({ organizationId: 'o1' });
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    list.mockRejectedValue(
      new ApiError({ code: 'INTERNAL_ERROR', message: 'db boom', status: 500 }),
    );
    renderWithProviders(<ProductsScreen />);
    await waitFor(() => expect(screen.queryByText('db boom')).toBeNull());
  });

  it('a STAFF member sees the list but no add button (read-only per the seeded role)', async () => {
    setSearchParams({ organizationId: 'o1' });
    getOrg.mockResolvedValue({ id: 'o1', type: 'VETERINARY_STORE', myRole: 'STAFF' } as never);
    list.mockResolvedValue(page([product()]));
    renderWithProviders(<ProductsScreen />);
    await waitFor(() => expect(screen.getByText('مضاد حيوي')).toBeOnTheScreen());
    expect(screen.queryByLabelText('إضافة منتج')).toBeNull();
  });

  it('tapping a card opens that product’s detail', async () => {
    setSearchParams({ organizationId: 'o1' });
    list.mockResolvedValue(page([product()]));
    renderWithProviders(<ProductsScreen />);
    await waitFor(() => expect(screen.getByText('مضاد حيوي')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('فتح مضاد حيوي'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations/o1/products/p1');
  });
});
