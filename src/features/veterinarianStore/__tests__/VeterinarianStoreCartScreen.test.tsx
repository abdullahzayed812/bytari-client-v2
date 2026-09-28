import { veterinarianStoreService } from '../api';
import VeterinarianStoreCartScreen from '../screens/VeterinarianStoreCartScreen';
import type { VetStoreCart } from '../types';

import { renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock } from '@/test-utils/routerMock';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const getCart = jest.spyOn(veterinarianStoreService, 'getCart');
const updateCartItem = jest.spyOn(veterinarianStoreService, 'updateCartItem');

const cart: VetStoreCart = {
  id: 'cart1',
  items: [
    {
      id: 'i1',
      productId: 'p1',
      name: 'طعام جاف للكلاب',
      primaryImageUrl: null,
      unitPrice: '85.00',
      quantity: 2,
      lineTotal: '170.00',
      inStock: true,
      availableStock: 10,
    },
  ],
  itemCount: 2,
  subtotalAmount: '170.00',
  deliveryFee: '0.00',
  totalAmount: '170.00',
  currency: 'IQD',
};

beforeEach(() => {
  resetRouterMock();
  getCart.mockReset().mockResolvedValue(cart);
  updateCartItem.mockReset().mockResolvedValue(cart);
});
afterAll(() => jest.restoreAllMocks());

describe('VeterinarianStoreCartScreen', () => {
  it('renders cart line items and the totals', async () => {
    renderWithProviders(<VeterinarianStoreCartScreen />);
    await waitFor(() => expect(screen.getByText('طعام جاف للكلاب')).toBeTruthy());
    // "170 د.ع" appears for subtotal + total; delivery is NOT advertised as free —
    // the fee is settled on delivery and excluded from the total.
    expect(screen.getAllByText('170 د.ع').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('مجاني')).toBeNull();
    expect(screen.getByText('تُحدَّد عند التسليم')).toBeTruthy();
  });

  it('shows the empty state when the cart has no items', async () => {
    getCart.mockResolvedValue({
      ...cart,
      items: [],
      itemCount: 0,
      subtotalAmount: '0.00',
      totalAmount: '0.00',
    });
    renderWithProviders(<VeterinarianStoreCartScreen />);
    await waitFor(() => expect(screen.getByText('سلة المشتريات فارغة')).toBeTruthy());
  });
});
