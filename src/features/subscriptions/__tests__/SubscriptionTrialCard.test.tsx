import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import { subscriptionsApi } from '../api';
import { SubscriptionTrialCard } from '../SubscriptionTrialCard';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

describe('SubscriptionTrialCard', () => {
  const info = jest.spyOn(subscriptionsApi, 'info');
  const send = jest.spyOn(subscriptionsApi, 'sendInfoRequest');

  beforeEach(() => {
    resetRouterMock();
    info.mockReset().mockResolvedValue({ subject: 'VETERINARY_OFFICE', freeTrialDays: 30 });
    send.mockReset().mockResolvedValue({ threadId: 't1' });
  });
  afterAll(() => jest.restoreAllMocks());

  it('shows the server-configured free trial and sends the info request into a support thread', async () => {
    renderWithProviders(<SubscriptionTrialCard subject="VETERINARY_OFFICE" organizationId="o1" />);
    expect(await screen.findByText(/30/)).toBeTruthy();
    fireEvent.press(screen.getByText('إرسال معلومات الاشتراك'));
    await waitFor(() =>
      expect(send).toHaveBeenCalledWith({ subject: 'VETERINARY_OFFICE', organizationId: 'o1' }),
    );
    await waitFor(() =>
      expect(routerMock.push).toHaveBeenCalledWith('/(app)/support/support-messages/t1'),
    );
  });

  it('hides the send action when the viewer cannot manage the subscription', async () => {
    renderWithProviders(<SubscriptionTrialCard subject="POULTRY_TRADER" canSend={false} />);
    expect(await screen.findByText(/30/)).toBeTruthy();
    expect(screen.queryByText('إرسال معلومات الاشتراك')).toBeNull();
  });
});
