import { chatApi } from '@/features/chat/api/chatApi';
import { organizationsApi } from '@/features/organizations';
import { organizationSubscriptionApi } from '@/features/organizations/api';
import { subscriptionsApi } from '@/features/subscriptions';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { veterinaryOfficeDashboardApi, veterinaryOfficeProductsApi } from '../dashboard/api';
import VeterinaryOfficeDashboardHomeScreen from '../dashboard/screens/VeterinaryOfficeDashboardHomeScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function office(over: Record<string, unknown> = {}) {
  return {
    id: 'o1',
    type: 'VETERINARY_OFFICE',
    name: 'مكتب الشفاء',
    description: null,
    status: 'ACTIVE',
    decisionReason: null,
    details: { subscriptionStatus: 'ACTIVE', subscriptionEndDate: '2099-01-01' },
    myRole: 'OWNER',
    ...over,
  } as never;
}

const MANAGEMENT = [
  'إضافة منتج',
  'الإعدادات',
  'المنتجات المخفية',
  'إرسال رسالة للمتابعين',
  'الموظفون',
];

describe('VeterinaryOfficeDashboardHomeScreen — sections follow the member’s permissions', () => {
  const getOrg = jest.spyOn(organizationsApi, 'get');
  const getSummary = jest.spyOn(veterinaryOfficeDashboardApi, 'getSummary');
  const listProducts = jest.spyOn(veterinaryOfficeProductsApi, 'list');

  beforeEach(() => {
    resetRouterMock();
    setSearchParams({ organizationId: 'o1' });
    getOrg.mockReset();
    getSummary
      .mockReset()
      .mockResolvedValue({ followersCount: 3, productsCount: 0, rating: null } as never);
    listProducts.mockReset().mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 6, total: 0, totalPages: 1 },
    } as never);
    jest
      .spyOn(organizationSubscriptionApi, 'listRenewalRequests')
      .mockResolvedValue({ items: [] } as never);
    jest.spyOn(chatApi, 'getUnreadSummary').mockResolvedValue({
      unreadConversations: 0,
      unreadMessages: 0,
    });
    jest
      .spyOn(subscriptionsApi, 'info')
      .mockResolvedValue({ subject: 'VETERINARY_OFFICE', freeTrialDays: 30 } as never);
  });
  afterAll(() => jest.restoreAllMocks());

  it('the owner sees every management action', async () => {
    getOrg.mockResolvedValue(office());
    renderWithProviders(<VeterinaryOfficeDashboardHomeScreen />);
    await waitFor(() => expect(screen.getByText('المحادثات')).toBeOnTheScreen());
    for (const label of MANAGEMENT) expect(screen.getByText(label)).toBeOnTheScreen();
    // One Employees entry replaces the separate Members / Supervisors actions.
    expect(screen.queryByText('الأعضاء')).toBeNull();
    expect(screen.queryByText('المشرفون')).toBeNull();
    fireEvent.press(screen.getByText('الموظفون'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations/o1/employees');
  });

  it('a STAFF member (product.read only) sees the products and chats, nothing to manage', async () => {
    getOrg.mockResolvedValue(
      office({ myRole: 'STAFF', myPermissions: ['organization.read', 'product.read'] }),
    );
    renderWithProviders(<VeterinaryOfficeDashboardHomeScreen />);
    await waitFor(() => expect(screen.getByText('المحادثات')).toBeOnTheScreen());
    await waitFor(() => expect(listProducts).toHaveBeenCalled());
    expect(screen.getAllByText('المنتجات').length).toBeGreaterThan(0);
    for (const label of MANAGEMENT) expect(screen.queryByText(label)).toBeNull();
  });

  it('a SUPERVISOR granted only the broadcast sees just that (no products fetched)', async () => {
    getOrg.mockResolvedValue(
      office({
        myRole: 'SUPERVISOR',
        myPermissions: ['organization.read', 'organization.broadcast.send'],
      }),
    );
    renderWithProviders(<VeterinaryOfficeDashboardHomeScreen />);
    await waitFor(() => expect(screen.getByText('إرسال رسالة للمتابعين')).toBeOnTheScreen());
    expect(screen.queryByText('إضافة منتج')).toBeNull();
    expect(screen.queryByText('الموظفون')).toBeNull();
    expect(listProducts).not.toHaveBeenCalled();
    expect(getSummary).not.toHaveBeenCalled();
  });
});
