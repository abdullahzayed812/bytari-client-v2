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
    // Opens the confirmation first — nothing is sent yet.
    expect(await screen.findByText('إرسال معلومات الاشتراك؟')).toBeTruthy();
    expect(send).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('إرسال'));
    await waitFor(() =>
      expect(send).toHaveBeenCalledWith({ subject: 'VETERINARY_OFFICE', organizationId: 'o1' }),
    );
    await waitFor(() =>
      expect(routerMock.push).toHaveBeenCalledWith('/(app)/support/support-messages/t1'),
    );
  });

  it('renders nothing (and fetches nothing) once the first free-trial period has ended', () => {
    renderWithProviders(
      <SubscriptionTrialCard subject="VETERINARY_OFFICE" organizationId="o1" freeTrialEnded />,
    );
    expect(screen.queryByText('الفترة المجانية')).toBeNull();
    expect(screen.queryByText('إرسال معلومات الاشتراك')).toBeNull();
    expect(info).not.toHaveBeenCalled();
  });

  it('hides the send action when the viewer cannot manage the subscription', async () => {
    renderWithProviders(<SubscriptionTrialCard subject="POULTRY_TRADER" canSend={false} />);
    expect(await screen.findByText(/30/)).toBeTruthy();
    expect(screen.queryByText('إرسال معلومات الاشتراك')).toBeNull();
  });

  it('cancelling the confirmation sends nothing', async () => {
    renderWithProviders(<SubscriptionTrialCard subject="VETERINARY_OFFICE" organizationId="o1" />);
    expect(await screen.findByText(/30/)).toBeTruthy();
    fireEvent.press(screen.getByText('إرسال معلومات الاشتراك'));
    expect(await screen.findByText('إرسال معلومات الاشتراك؟')).toBeTruthy();
    fireEvent.press(screen.getByText('إلغاء'));
    await waitFor(() => expect(screen.queryByText('إرسال معلومات الاشتراك؟')).toBeNull());
    expect(send).not.toHaveBeenCalled();
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it('a double tap on confirm sends exactly once', async () => {
    let resolve: (v: { threadId: string }) => void = () => {};
    send
      .mockReset()
      .mockImplementation(() => new Promise<{ threadId: string }>((r) => (resolve = r)));
    renderWithProviders(<SubscriptionTrialCard subject="VETERINARY_OFFICE" organizationId="o1" />);
    expect(await screen.findByText(/30/)).toBeTruthy();
    fireEvent.press(screen.getByText('إرسال معلومات الاشتراك'));
    const confirm = await screen.findByText('إرسال');
    fireEvent.press(confirm);
    fireEvent.press(confirm);
    await waitFor(() => expect(send).toHaveBeenCalledTimes(1));
    resolve({ threadId: 't1' });
    await waitFor(() =>
      expect(routerMock.push).toHaveBeenCalledWith('/(app)/support/support-messages/t1'),
    );
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('on failure shows an error and keeps the dialog open for a retry', async () => {
    send.mockReset().mockRejectedValue(new Error('boom'));
    renderWithProviders(<SubscriptionTrialCard subject="VETERINARY_OFFICE" organizationId="o1" />);
    expect(await screen.findByText(/30/)).toBeTruthy();
    fireEvent.press(screen.getByText('إرسال معلومات الاشتراك'));
    fireEvent.press(await screen.findByText('إرسال'));
    expect(await screen.findByText(/تعذّر إرسال معلومات الاشتراك/)).toBeTruthy();
    expect(screen.getByText('إرسال معلومات الاشتراك؟')).toBeTruthy();
    expect(routerMock.push).not.toHaveBeenCalled();
  });
});
