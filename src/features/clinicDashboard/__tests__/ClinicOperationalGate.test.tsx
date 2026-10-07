import { Text } from 'react-native';

import { organizationsApi } from '@/features/organizations';
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

  it('expired subscription for a staff member → locked, without the owner-only renewal CTA', async () => {
    get.mockResolvedValue(clinic({ myRole: 'VETERINARIAN' }, { subscriptionStatus: 'EXPIRED' }));
    renderGate();
    await waitFor(() => expect(screen.getByText('انتهى اشتراك العيادة')).toBeOnTheScreen());
    expect(screen.queryByText('طلب تجديد الاشتراك')).toBeNull();
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
