import { TextInput } from 'react-native';

import { authApi } from '@/features/auth/api';
import { tokenStorage } from '@/features/auth/services';
import { ApiError } from '@/services/api/errors';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import PrivacySecurityScreen from '../screens/PrivacySecurityScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const change = jest.spyOn(authApi, 'changePassword');
const logoutAll = jest.spyOn(authApi, 'logoutAll');
const saveTokens = jest.spyOn(tokenStorage, 'saveTokens');

const tokens = {
  accessToken: 'a2',
  refreshToken: 'r2',
  tokenType: 'Bearer' as const,
  expiresIn: 900,
};

beforeEach(() => {
  resetRouterMock();
  change.mockReset();
  logoutAll.mockReset().mockResolvedValue({ success: true, revokedSessions: 1 });
  saveTokens.mockReset().mockResolvedValue(undefined);
});
afterAll(() => jest.restoreAllMocks());

const fill = (current: string, next: string, confirm: string): void => {
  const [a, b, c] = screen.UNSAFE_getAllByType(TextInput);
  fireEvent.changeText(a!, current);
  fireEvent.changeText(b!, next);
  fireEvent.changeText(c!, confirm);
};

describe('ChangePasswordScreen — "تغيير كلمة المرور"', () => {
  it('validates locally before calling the API', () => {
    renderWithProviders(<ChangePasswordScreen />);
    fill('OldPassword1', 'short', 'short');
    fireEvent.press(screen.getByText('حفظ كلمة المرور'));
    expect(screen.getByText('كلمة المرور يجب أن تكون 10 أحرف على الأقل')).toBeTruthy();
    expect(change).not.toHaveBeenCalled();
  });

  it('posts current + new password, keeps the fresh session and goes back', async () => {
    change.mockResolvedValue({ success: true, revokedSessions: 2, tokens });
    renderWithProviders(<ChangePasswordScreen />);
    fill('OldPassword1', 'NewPassword12', 'NewPassword12');
    fireEvent.press(screen.getByText('حفظ كلمة المرور'));
    await waitFor(() => expect(routerMock.back).toHaveBeenCalled());
    expect(change).toHaveBeenCalledWith({
      currentPassword: 'OldPassword1',
      newPassword: 'NewPassword12',
    });
    expect(saveTokens).toHaveBeenCalledWith(tokens);
  });

  it('shows a field error for a wrong current password (no session teardown)', async () => {
    change.mockRejectedValue(
      new ApiError({ code: 'INVALID_CURRENT_PASSWORD', message: 'x', status: 400 }),
    );
    renderWithProviders(<ChangePasswordScreen />);
    fill('WrongPassword', 'NewPassword12', 'NewPassword12');
    fireEvent.press(screen.getByText('حفظ كلمة المرور'));
    expect(await screen.findByText('كلمة المرور الحالية غير صحيحة')).toBeTruthy();
    expect(routerMock.back).not.toHaveBeenCalled();
  });
});

describe('PrivacySecurityScreen — "الخصوصية والأمان"', () => {
  it('opens change password and signs out of every device after confirmation', async () => {
    renderWithProviders(<PrivacySecurityScreen />);
    fireEvent.press(screen.getByText('تغيير كلمة المرور'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/settings/change-password');

    fireEvent.press(screen.getAllByText('تسجيل الخروج من جميع الأجهزة')[0]!);
    const confirmButtons = await screen.findAllByText('تسجيل الخروج من جميع الأجهزة');
    fireEvent.press(confirmButtons[confirmButtons.length - 1]!);
    await waitFor(() => expect(logoutAll).toHaveBeenCalled());
  });
});
