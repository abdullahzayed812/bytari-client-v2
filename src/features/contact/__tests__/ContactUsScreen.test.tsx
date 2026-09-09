import { useAuthStore } from '@/features/auth/store';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import { supportMessageApi } from '@/features/support';
import ContactUsScreen from '../screens/ContactUsScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);
jest.mock('@/services/realtime', () => ({
  realtimeClient: { on: jest.fn(() => ({ unsubscribe: jest.fn() })) },
}));

const create = jest.spyOn(supportMessageApi, 'create');

function signIn() {
  const user = {
    id: 'u1',
    email: 'zuhairalrawi0@gmail.com',
    firstName: 'زهير',
    lastName: 'الراوي',
    phone: null,
    status: 'ACTIVE' as const,
    veterinarianStatus: 'NOT_APPLIED' as const,
    traderStatus: 'NOT_REGISTERED' as const,
    createdAt: '',
    updatedAt: '',
  };
  useAuthStore.setState({
    user,
    status: 'authenticated',
    session: {
      user,
      roles: ['PET_OWNER'],
      permissions: [],
      isAdmin: false,
      supervisorDomains: [],
    } as never,
  });
}

beforeEach(() => {
  resetRouterMock();
  signIn();
  create.mockReset();
});
afterAll(() => jest.restoreAllMocks());

describe('ContactUsScreen — "تواصل معنا"', () => {
  it('shows the contact channels and support types', () => {
    renderWithProviders(<ContactUsScreen />);
    expect(screen.getByText('baytariapp@gmail.com')).toBeTruthy();
    expect(screen.getByText('بغداد، العراق')).toBeTruthy();
    expect(screen.getByText('الدعم الفني')).toBeTruthy();
    expect(screen.getByText('الشكاوى والاقتراحات')).toBeTruthy();
  });

  it('prefills the signed-in user name + email (read-only)', () => {
    renderWithProviders(<ContactUsScreen />);
    expect(screen.getByDisplayValue('زهير الراوي')).toBeTruthy();
    expect(screen.getByDisplayValue('zuhairalrawi0@gmail.com')).toBeTruthy();
  });

  it('sends the message with no recipient, then opens the reply thread', async () => {
    create.mockResolvedValue({
      id: 't1',
      kind: 'SUPPORT',
      status: 'OPEN',
      createdByUserId: 'u1',
      animalId: null,
      senderBlocked: false,
      aiResponded: false,
      lastMessageAt: null,
      closedAt: null,
      createdAt: '',
      updatedAt: '',
    });

    renderWithProviders(<ContactUsScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('رسالتك...'), 'التطبيق يتوقف فجأة');
    fireEvent.press(screen.getByText('إرسال الرسالة'));

    await waitFor(() => expect(create).toHaveBeenCalledWith({ body: 'التطبيق يتوقف فجأة' }));
    await waitFor(() =>
      expect(routerMock.push).toHaveBeenCalledWith('/(app)/support/support-messages/t1'),
    );
  });

  it('validates a required message', () => {
    renderWithProviders(<ContactUsScreen />);
    fireEvent.press(screen.getByText('إرسال الرسالة'));
    expect(create).not.toHaveBeenCalled();
    expect(screen.getByText('الرجاء كتابة رسالتك.')).toBeTruthy();
  });
});
