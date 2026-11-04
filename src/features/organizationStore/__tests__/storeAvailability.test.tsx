import { Switch as RNSwitch } from 'react-native';

import { organizationStoreService } from '../api';
import { OrderAvailabilityCard, OrgStoreAddToCart, OrgStoreCartButton } from '../components';
import OrganizationStoreCartScreen from '../screens/OrganizationStoreCartScreen';
import type { OrgStoreCart } from '../types';

import { organizationsApi } from '@/features/organizations/api';
import type { PublicOrganizationDetail } from '@/features/organizations/types';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, setSearchParams } from '@/test-utils/routerMock';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const getCart = jest.spyOn(organizationStoreService, 'getCart');
const getPublic = jest.spyOn(organizationsApi, 'getPublic');
const getSettings = jest.spyOn(organizationStoreService, 'getOrderSettings');
const updateSettings = jest.spyOn(organizationStoreService, 'updateOrderSettings');

const PAUSED = 'المتجر لا يستقبل طلبات جديدة حالياً. يمكنك تصفح المنتجات والعودة لاحقاً.';

const publicOrg = (over: Partial<PublicOrganizationDetail>) =>
  ({ id: 'org1', type: 'CLINIC', name: 'عيادة', ...over }) as PublicOrganizationDetail;

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
      quantity: 1,
      lineTotal: '12500.00',
      available: true,
    },
  ],
  itemCount: 1,
  subtotalAmount: '12500.00',
  deliveryFee: '0.00',
  totalAmount: '12500.00',
  currency: 'IQD',
};

beforeEach(() => {
  resetRouterMock();
  setSearchParams({ organizationId: 'org1' });
  getCart.mockReset().mockResolvedValue(cart);
  getPublic.mockReset();
  getSettings.mockReset();
  updateSettings.mockReset();
});
afterAll(() => jest.restoreAllMocks());

describe('store availability — customer side', () => {
  it('product page: paused orders replace "add to cart" with a notice', async () => {
    getPublic.mockResolvedValue(publicOrg({ ordersEnabled: false }));
    renderWithProviders(<OrgStoreAddToCart organizationId="org1" productId="p1" hasPrice />);
    await waitFor(() => expect(screen.getByText(PAUSED)).toBeTruthy());
    expect(screen.queryByText('أضف إلى السلة')).toBeNull();
  });

  it('product page: an open store still offers "add to cart"', async () => {
    getPublic.mockResolvedValue(publicOrg({ ordersEnabled: true, storeEnabled: true }));
    renderWithProviders(<OrgStoreAddToCart organizationId="org1" productId="p1" hasPrice />);
    await waitFor(() => expect(screen.getByText('أضف إلى السلة')).toBeTruthy());
  });

  it('cart: checkout is blocked while the seller paused orders', async () => {
    getPublic.mockResolvedValue(publicOrg({ ordersEnabled: false }));
    renderWithProviders(<OrganizationStoreCartScreen />);
    await waitFor(() => expect(screen.getByText(PAUSED)).toBeTruthy());
    expect(screen.getByRole('button', { name: 'متابعة الطلب' })).toBeDisabled();
  });

  it('cart button disappears for a clinic store the Admin turned off', async () => {
    getPublic.mockResolvedValue(publicOrg({ storeEnabled: false }));
    renderWithProviders(<OrgStoreCartButton organizationId="org1" />);
    await waitFor(() => expect(getPublic).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByLabelText(/السلة/)).toBeNull());
    expect(getCart).not.toHaveBeenCalled();
  });
});

describe('OrderAvailabilityCard — seller side', () => {
  it('a manager toggles receiving new orders', async () => {
    getSettings.mockResolvedValue({ ordersEnabled: true });
    updateSettings.mockResolvedValue({ ordersEnabled: false });
    renderWithProviders(<OrderAvailabilityCard organizationId="org1" canManage />);
    await waitFor(() =>
      expect(
        screen.getByText('يمكن للزبائن إضافة المنتجات إلى السلة وإرسال طلبات جديدة.'),
      ).toBeTruthy(),
    );
    fireEvent(screen.getByRole('switch'), 'valueChange', false);
    await waitFor(() => expect(updateSettings).toHaveBeenCalledWith('org1', false));
    await waitFor(() => expect(screen.getByText(/استقبال الطلبات متوقف/)).toBeTruthy());
  });

  it('is read-only without store.order.manage', async () => {
    getSettings.mockResolvedValue({ ordersEnabled: true });
    renderWithProviders(<OrderAvailabilityCard organizationId="org1" canManage={false} />);
    await waitFor(() => expect(getSettings).toHaveBeenCalled());
    // The RN Switch host mock drops `disabled`; assert on the composite.
    expect(screen.UNSAFE_getByType(RNSwitch).props.disabled).toBe(true);
  });
});
