import { Text } from 'react-native';

import { organizationsApi } from '@/features/organizations';
import { subscriptionsApi } from '@/features/subscriptions';
import { ApiError } from '@/services/api';
import { createQueryClient } from '@/lib/queryClient';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import { ClinicOperationalGate } from '../components';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function clinic(over: Record<string, unknown> = {}, details: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    type: 'CLINIC',
    name: 'عيادة',
    status: 'ACTIVE',
    myRole: 'OWNER',
    details: { subscriptionStatus: 'ACTIVE', ...details },
    ...over,
  } as never;
}

const renderGate = () =>
  renderWithProviders(
    <ClinicOperationalGate organizationId="c1">
      <Text>DASHBOARD CONTENT</Text>
    </ClinicOperationalGate>,
  );

describe('ClinicOperationalGate', () => {
  const get = jest.spyOn(organizationsApi, 'get');
  beforeEach(() => {
    resetRouterMock();
    get.mockReset();
  });
  afterAll(() => jest.restoreAllMocks());

  it('renders the dashboard for an active clinic with a valid subscription', async () => {
    get.mockResolvedValue(clinic());
    renderGate();
    await waitFor(() => expect(screen.getByText('DASHBOARD CONTENT')).toBeOnTheScreen());
  });

  it('pending approval → under-review state, never the dashboard', async () => {
    get.mockResolvedValue(clinic({ status: 'PENDING' }, { subscriptionStatus: 'NOT_STARTED' }));
    renderGate();
    await waitFor(() => expect(screen.getByText('العيادة قيد المراجعة')).toBeOnTheScreen());
    expect(screen.queryByText('DASHBOARD CONTENT')).toBeNull();
    fireEvent.press(screen.getByText('عرض ملف العيادة'));
    expect(routerMock.replace).toHaveBeenCalledWith('/(app)/organizations/c1');
  });

  it('expired subscription → renewal-required state (owner gets the renewal CTA)', async () => {
    get.mockResolvedValue(clinic({}, { subscriptionStatus: 'EXPIRED' }));
    renderGate();
    await waitFor(() => expect(screen.getByText('انتهى اشتراك العيادة')).toBeOnTheScreen());
    expect(screen.queryByText('DASHBOARD CONTENT')).toBeNull();
    fireEvent.press(screen.getByText('طلب تجديد الاشتراك'));
    expect(routerMock.replace).toHaveBeenCalledWith('/(app)/organizations/c1/subscription-renewal');
  });

  describe('expired subscription → "التواصل مع الإدارة" (send subscription info)', () => {
    const send = jest.spyOn(subscriptionsApi, 'sendInfoRequest');
    beforeEach(() => {
      send.mockReset().mockResolvedValue({ threadId: 't9' });
      get.mockResolvedValue(clinic({}, { subscriptionStatus: 'EXPIRED' }));
    });

    it('confirms first, then sends the CLINIC info request and opens the support thread', async () => {
      renderGate();
      fireEvent.press(await screen.findByText('التواصل مع الإدارة'));
      expect(await screen.findByText('إرسال معلومات الاشتراك؟')).toBeOnTheScreen();
      expect(send).not.toHaveBeenCalled();
      fireEvent.press(screen.getByText('إرسال'));
      await waitFor(() =>
        expect(send).toHaveBeenCalledWith({ subject: 'CLINIC', organizationId: 'c1' }),
      );
      await waitFor(() =>
        expect(routerMock.push).toHaveBeenCalledWith('/(app)/support/support-messages/t9'),
      );
      expect(send).toHaveBeenCalledTimes(1);
      // Still locked — contacting the administration grants no access.
      expect(screen.queryByText('DASHBOARD CONTENT')).toBeNull();
    });

    it('cancelling the confirmation sends nothing', async () => {
      renderGate();
      fireEvent.press(await screen.findByText('التواصل مع الإدارة'));
      fireEvent.press(await screen.findByText('إلغاء'));
      await waitFor(() => expect(screen.queryByText('إرسال معلومات الاشتراك؟')).toBeNull());
      expect(send).not.toHaveBeenCalled();
    });

    it('a double tap on confirm sends once; a failure keeps the dialog open', async () => {
      send.mockReset().mockRejectedValue(new Error('boom'));
      renderGate();
      fireEvent.press(await screen.findByText('التواصل مع الإدارة'));
      const confirm = await screen.findByText('إرسال');
      fireEvent.press(confirm);
      fireEvent.press(confirm);
      expect(await screen.findByText(/تعذّر إرسال معلومات الاشتراك/)).toBeOnTheScreen();
      expect(send).toHaveBeenCalledTimes(1);
      expect(screen.getByText('إرسال معلومات الاشتراك؟')).toBeOnTheScreen();
    });
  });

  it.each(['VETERINARIAN', 'STAFF', 'SUPERVISOR'])(
    'expired subscription for a %s (staff) → keeps working: the dashboard renders',
    async (myRole) => {
      get.mockResolvedValue(clinic({ myRole }, { subscriptionStatus: 'EXPIRED' }));
      renderGate();
      await waitFor(() => expect(screen.getByText('DASHBOARD CONTENT')).toBeOnTheScreen());
      expect(screen.queryByText('طلب تجديد الاشتراك')).toBeNull();
    },
  );

  it('expired subscription for a non-member (no myRole) → still locked', async () => {
    get.mockResolvedValue(clinic({ myRole: null }, { subscriptionStatus: 'EXPIRED' }));
    renderGate();
    await waitFor(() => expect(screen.getByText('انتهى اشتراك العيادة')).toBeOnTheScreen());
    expect(screen.queryByText('DASHBOARD CONTENT')).toBeNull();
  });

  it('renewal restores the owner: an ACTIVE refetch opens the dashboard', async () => {
    get.mockResolvedValue(clinic({}, { subscriptionStatus: 'ACTIVE' }));
    renderGate();
    await waitFor(() => expect(screen.getByText('DASHBOARD CONTENT')).toBeOnTheScreen());
  });

  it('a staff member of a suspended clinic sees the inactive state with the contact path', async () => {
    get.mockResolvedValue(clinic({ myRole: 'STAFF', status: 'SUSPENDED' }));
    renderGate();
    await waitFor(() => expect(screen.getByText('العيادة غير نشطة')).toBeOnTheScreen());
    expect(screen.getByText('تواصل معنا')).toBeOnTheScreen();
    expect(screen.queryByText('DASHBOARD CONTENT')).toBeNull();
  });

  it('a staff member of a pending clinic (403 on the profile) gets the not-available state', async () => {
    get.mockRejectedValue(
      new ApiError({ code: 'ORGANIZATION_NOT_ACTIVE', message: 'x', status: 403 }),
    );
    renderGate();
    await waitFor(() => expect(screen.getByText('لوحة العيادة غير متاحة')).toBeOnTheScreen());
    expect(screen.queryByText('DASHBOARD CONTENT')).toBeNull();
  });

  it('always refetches on entry, so a cached "active" profile cannot keep the dashboard open', async () => {
    get
      .mockResolvedValueOnce(clinic())
      .mockResolvedValue(clinic({}, { subscriptionStatus: 'EXPIRED' }));
    const first = renderGate();
    await waitFor(() => expect(screen.getByText('DASHBOARD CONTENT')).toBeOnTheScreen());
    first.unmount();
    renderGate();
    await waitFor(() => expect(screen.getByText('انتهى اشتراك العيادة')).toBeOnTheScreen());
  });
});

describe('query client lock-error hook', () => {
  it('an ORGANIZATION_SUBSCRIPTION_EXPIRED failure invalidates cached organization profiles', async () => {
    const client = createQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    await client
      .fetchQuery({
        queryKey: ['clinic-dashboard', 'summary', 'c1'],
        queryFn: () =>
          Promise.reject(
            new ApiError({ code: 'ORGANIZATION_SUBSCRIPTION_EXPIRED', message: 'x', status: 403 }),
          ),
        retry: false,
      })
      .catch(() => undefined);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['organizations', 'detail'] });
  });
});
