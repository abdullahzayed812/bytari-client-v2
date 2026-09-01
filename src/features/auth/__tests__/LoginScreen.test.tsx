import { initI18n } from '@/i18n';
import { ApiError } from '@/services/api';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock } from '@/test-utils/routerMock';

import LoginScreen from '../screens/LoginScreen';
import { useAuthStore } from '../store';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

beforeAll(() => initI18n('ar'));

describe('LoginScreen', () => {
  const login = jest.spyOn(useAuthStore.getState(), 'login');

  beforeEach(() => {
    resetRouterMock();
    login.mockReset();
  });
  afterAll(() => jest.restoreAllMocks());

  it('renders the localized title + a submit button', () => {
    renderWithProviders(<LoginScreen />);
    // title + button share the same Arabic string, so assert on the button role.
    expect(screen.getByRole('button', { name: 'تسجيل الدخول' })).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('name@example.com')).toBeOnTheScreen();
  });

  it('shows validation errors and does not call login for an empty form', async () => {
    renderWithProviders(<LoginScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'تسجيل الدخول' }));
    await waitFor(() => {
      expect(screen.getByText('البريد الإلكتروني مطلوب.')).toBeOnTheScreen();
    });
    expect(login).not.toHaveBeenCalled();
  });

  it('surfaces a mapped Arabic message on a backend 401 (never the raw error)', async () => {
    login.mockRejectedValueOnce(
      new ApiError({ code: 'INVALID_CREDENTIALS', message: 'raw backend text', status: 401 }),
    );
    renderWithProviders(<LoginScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('name@example.com'), 'user@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'secret123');
    fireEvent.press(screen.getByRole('button', { name: 'تسجيل الدخول' }));

    await waitFor(() => {
      expect(screen.getByText(/كلمة المرور غير صحيحة/)).toBeOnTheScreen();
    });
    expect(screen.queryByText('raw backend text')).toBeNull();
  });

  it('calls login with trimmed credentials on a valid submit', async () => {
    login.mockResolvedValueOnce(undefined);
    renderWithProviders(<LoginScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('name@example.com'), '  user@example.com  ');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'secret123');
    fireEvent.press(screen.getByRole('button', { name: 'تسجيل الدخول' }));

    await waitFor(() => expect(login).toHaveBeenCalledTimes(1));
    expect(login.mock.calls[0]?.[0]).toEqual({ email: 'user@example.com', password: 'secret123' });
  });
});
