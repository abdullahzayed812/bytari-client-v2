import type { Product } from '@/features/store';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { veterinaryOfficeProductsApi } from '../api';
import VeterinaryOfficeProductsScreen from '../screens/VeterinaryOfficeProductsScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const product = (over: Partial<Product> = {}): Product => ({
  id: 'p1',
  organizationId: 'o1',
  organizationType: 'VETERINARY_OFFICE',
  name: 'أنتي بيك',
  description: 'مضاد حيوي واسع المجال',
  productType: 'MEDICINE',
  price: '25000.00',
  stockQuantity: 10,
  status: 'ACTIVE',
  subtype: null,
  weight: null,
  usageInstructions: null,
  dosage: null,
  shelfLife: null,
  manufacturer: null,
  highlights: [],
  primaryImageUrl: null,
  images: [],
  createdByUserId: 'u1',
  createdAt: '',
  updatedAt: '',
  ...over,
});

const page = (items: Product[]) => ({
  items,
  meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 },
});

describe('VeterinaryOfficeProductsScreen', () => {
  const list = jest.spyOn(veterinaryOfficeProductsApi, 'list');

  beforeEach(() => {
    resetRouterMock();
    list.mockReset().mockResolvedValue(page([]));
    setSearchParams({ officeId: 'o1' });
  });
  afterAll(() => jest.restoreAllMocks());

  it('lists the office’s public products with name, description and price', async () => {
    list.mockResolvedValue(page([product()]));
    renderWithProviders(<VeterinaryOfficeProductsScreen />);
    await waitFor(() => expect(screen.getByText('أنتي بيك')).toBeOnTheScreen());
    expect(screen.getByText('مضاد حيوي واسع المجال')).toBeOnTheScreen();
    expect(screen.getByText('25,000 د.ع')).toBeOnTheScreen();
  });

  it('shows the empty state with no products', async () => {
    renderWithProviders(<VeterinaryOfficeProductsScreen />);
    await waitFor(() => expect(screen.getByText('لا توجد منتجات بعد')).toBeOnTheScreen());
  });

  it('sends the search term to the backend (server-side, no local filtering)', async () => {
    renderWithProviders(<VeterinaryOfficeProductsScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('ابحث عن منتج...'), 'أنتي');
    await waitFor(
      () => expect(list).toHaveBeenCalledWith('o1', expect.objectContaining({ search: 'أنتي' })),
      { timeout: 5000, interval: 60 },
    );
  });

  it('a category chip narrows the backend query by `type`', async () => {
    renderWithProviders(<VeterinaryOfficeProductsScreen />);
    await waitFor(() => expect(list).toHaveBeenCalled());
    fireEvent.press(screen.getByText('مكملات'));
    await waitFor(() =>
      expect(list).toHaveBeenCalledWith('o1', expect.objectContaining({ productType: 'SUPPLEMENT' })),
    );
  });

  it('pressing a product navigates to its details screen', async () => {
    list.mockResolvedValue(page([product()]));
    renderWithProviders(<VeterinaryOfficeProductsScreen />);
    await waitFor(() => expect(screen.getByText('أنتي بيك')).toBeOnTheScreen());
    fireEvent.press(screen.getByText('أنتي بيك'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/veterinary-offices/o1/products/p1');
  });
});
