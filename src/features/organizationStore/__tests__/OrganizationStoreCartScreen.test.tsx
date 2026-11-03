import { organizationStoreService } from '../api';
import OrganizationStoreCartScreen from '../screens/OrganizationStoreCartScreen';
import type { OrgStoreCart } from '../types';

import { organizationsApi } from '@/features/organizations/api';
import { renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, setSearchParams } from '@/test-utils/routerMock';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const getCart = jest.spyOn(organizationStoreService, 'getCart');
const getPublic = jest.spyOn(organizationsApi, 'getPublic');

const cart: OrgStoreCart = {
  id: 'cart1',
  organizationId: 'org1',
  items: [
    {
      id: 'i1',
      productId: 'p1',
      name: 'شامبو طبي',
      primaryImageUrl: null,
      unitPrice: '12500.00',
      currency: 'IQD',
      quantity: 2,
      lineTotal: '25000.00',
      available: true,
    },
  ],
  itemCount: 2,
  subtotalAmount: '25000.00',
  deliveryFee: '0.00',
  totalAmount: '25000.00',
  currency: 'IQD',
};

beforeEach(() => {
  resetRouterMock();
  setSearchParams({ organizationId: 'org1' });
  getCart.mockReset().mockResolvedValue(cart);
  getPublic.mockReset().mockRejectedValue(new Error('not needed'));
});
afterAll(() => jest.restoreAllMocks());

describe('OrganizationStoreCartScreen', () => {
  it('renders the lines and totals in the store currency', async () => {
    renderWithProviders(<OrganizationStoreCartScreen />);
    await waitFor(() => expect(screen.getByText('شامبو طبي')).toBeTruthy());
    expect(getCart).toHaveBeenCalledWith('org1');
    expect(screen.getAllByText('25,000 د.ع').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('يحدد عند الاستلام')).toBeTruthy();
    expect(screen.getByText('متابعة الطلب')).toBeTruthy();
  });

  it('warns about unavailable lines (checkout would be refused)', async () => {
    getCart.mockResolvedValue({
      ...cart,
      items: [{ ...cart.items[0]!, available: false }],
    });
    renderWithProviders(<OrganizationStoreCartScreen />);
    await waitFor(() =>
      expect(screen.getByText('بعض المنتجات لم تعد متاحة. أزلها لإتمام الطلب.')).toBeTruthy(),
    );
  });

  it('shows the empty state for an empty cart', async () => {
    getCart.mockResolvedValue({ ...cart, id: null, items: [], itemCount: 0, currency: null });
    renderWithProviders(<OrganizationStoreCartScreen />);
    await waitFor(() => expect(screen.getByText('السلة فارغة')).toBeTruthy());
  });
});
