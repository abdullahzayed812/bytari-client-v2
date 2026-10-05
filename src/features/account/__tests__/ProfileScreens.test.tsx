import { TextInput } from 'react-native';

import { useAuthStore } from '@/features/auth/store';
import type { SessionSnapshot, User } from '@/features/auth/types';
import ChangePasswordScreen from '@/features/settings/screens/ChangePasswordScreen';
import { apiClient, ApiError, ApiErrorCode } from '@/services/api';
import { useAppModeStore } from '@/store';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import AccountScreen from '../screens/AccountScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import MyDocumentsScreen from '../screens/MyDocumentsScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function user(overrides: Partial<User> = {}): User {
  return {
    id: 'me',
    email: 'zuhair@example.test',
    firstName: 'زهير',
    lastName: 'جميل',
    phone: '+964 777 756 4666',
    whatsapp: '+964 777 756 4666',
    country: 'IQ',
    governorate: 'بغداد',
    specialization: 'طبيب بيطري عام',
    bio: 'طبيب بيطري مختص في صحة الحيوانات ورعايتها.',
    status: 'ACTIVE',
    veterinarianStatus: 'APPROVED',
    traderStatus: 'NOT_REGISTERED',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

function signIn(u: User) {
  const approved = u.veterinarianStatus === 'APPROVED';
  const session: SessionSnapshot = {
    user: u,
    roles: approved ? ['PET_OWNER', 'VETERINARIAN'] : ['PET_OWNER'],
    permissions: [],
    isAdmin: false,
    supervisorDomains: [],
    veterinarian: { status: u.veterinarianStatus, approved },
    trader: { status: 'NOT_REGISTERED', approved: false },
  };
  useAuthStore.setState({ user: u, session });
}

beforeEach(() => {
  resetRouterMock();
  jest.restoreAllMocks();
  useAppModeStore.setState({ activeMode: 'owner' });
});
afterAll(() => {
  useAuthStore.setState({ user: null, session: null, tokens: null });
  useAppModeStore.setState({ activeMode: 'owner' });
});

describe('AccountScreen — profile page', () => {
  it('shows the verified vet identity, contact row, bio and the account grid', () => {
    signIn(user());
    useAppModeStore.setState({ activeMode: 'veterinarian' });
    renderWithProviders(<AccountScreen />);

    expect(screen.getByText('د. زهير جميل')).toBeTruthy();
    expect(screen.getByText('موثق')).toBeTruthy();
    expect(screen.getByText('طبيب بيطري عام')).toBeTruthy();
    expect(screen.getByText('بغداد')).toBeTruthy();
    expect(screen.getByText('zuhair@example.test')).toBeTruthy();
    expect(screen.getAllByText('+964 777 756 4666')).toHaveLength(2);
    expect(screen.getByText('نبذة عني')).toBeTruthy();
    expect(screen.getByText('طبيب بيطري مختص في صحة الحيوانات ورعايتها.')).toBeTruthy();

    fireEvent.press(screen.getByText('تعديل الملف الشخصي'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/profile/edit');
    fireEvent.press(screen.getByText('المستندات والتوثيق'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/profile/documents');
    fireEvent.press(screen.getByText('طلباتي'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/veterinarian-store/orders');
    fireEvent.press(screen.getByText('إعلاناتي وطلباتي'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/profile/ads');
    fireEvent.press(screen.getByText('الإعدادات'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/settings');
    expect(screen.getByText('المحفوظات')).toBeTruthy();
    expect(screen.getByText('تسجيل الخروج')).toBeTruthy();
  });

  it('a pet owner gets no vet-only items and the pet store orders', () => {
    signIn(
      user({ veterinarianStatus: 'NOT_APPLIED', specialization: null, bio: null, whatsapp: null }),
    );
    renderWithProviders(<AccountScreen />);

    expect(screen.getByText('زهير جميل')).toBeTruthy();
    expect(screen.queryByText('موثق')).toBeNull();
    expect(screen.queryByText('المستندات والتوثيق')).toBeNull();
    expect(screen.queryByText('المحفوظات')).toBeNull();
    expect(screen.getByText('لم تضف نبذة عنك بعد.')).toBeTruthy();
    fireEvent.press(screen.getByText('طلباتي'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/pet-owner-store/orders');
  });
});

describe('EditProfileScreen', () => {
  it('sends only the changed fields to PATCH /users/me', async () => {
    signIn(user());
    const patch = jest.spyOn(apiClient, 'patch').mockResolvedValue(user({ bio: 'نبذة جديدة' }));
    renderWithProviders(<EditProfileScreen />);

    fireEvent.changeText(
      screen.getByDisplayValue('طبيب بيطري مختص في صحة الحيوانات ورعايتها.'),
      'نبذة جديدة',
    );
    fireEvent.press(screen.getByText('حفظ التغييرات'));

    await waitFor(() => expect(patch).toHaveBeenCalledWith('/users/me', { bio: 'نبذة جديدة' }));
    await waitFor(() => expect(routerMock.back).toHaveBeenCalled());
  });

  it('validates phone numbers locally and never sends the email', async () => {
    signIn(user());
    const patch = jest.spyOn(apiClient, 'patch');
    renderWithProviders(<EditProfileScreen />);

    const [, whatsapp] = screen.getAllByDisplayValue('+964 777 756 4666');
    fireEvent.changeText(whatsapp!, 'not-a-phone');
    fireEvent.press(screen.getByText('حفظ التغييرات'));

    expect(await screen.findByText('رقم الهاتف غير صالح')).toBeTruthy();
    expect(patch).not.toHaveBeenCalled();
  });
});

describe('ChangePasswordScreen', () => {
  it('validates locally, maps a wrong current password, then stores the fresh tokens', async () => {
    signIn(user());
    const tokens = {
      accessToken: 'new-access',
      refreshToken: 'new-refresh-token-value',
      tokenType: 'Bearer' as const,
      expiresIn: 900,
    };
    const post = jest
      .spyOn(apiClient, 'post')
      .mockRejectedValueOnce(
        new ApiError({
          code: ApiErrorCode.INVALID_CURRENT_PASSWORD,
          message: 'Current password is incorrect',
          status: 400,
        }),
      )
      .mockResolvedValueOnce({ success: true, revokedSessions: 2, tokens });

    renderWithProviders(<ChangePasswordScreen />);
    const inputs = screen.UNSAFE_getAllByType(TextInput);
    expect(inputs).toHaveLength(3);

    // mismatch → no request
    fireEvent.changeText(inputs[0]!, 'old-password-1');
    fireEvent.changeText(inputs[1]!, 'brand-new-password');
    fireEvent.changeText(inputs[2]!, 'different-password');
    fireEvent.press(screen.getByText('حفظ كلمة المرور'));
    expect(screen.getByText('كلمتا المرور غير متطابقتين')).toBeTruthy();
    expect(post).not.toHaveBeenCalled();

    // wrong current password → field error, still signed in
    fireEvent.changeText(inputs[2]!, 'brand-new-password');
    fireEvent.press(screen.getByText('حفظ كلمة المرور'));
    expect(await screen.findByText('كلمة المرور الحالية غير صحيحة')).toBeTruthy();
    expect(post).toHaveBeenCalledWith('/auth/change-password', {
      currentPassword: 'old-password-1',
      newPassword: 'brand-new-password',
    });

    // success → the new token pair keeps this device signed in
    fireEvent.changeText(inputs[0]!, 'correct-password-1');
    fireEvent.press(screen.getByText('حفظ كلمة المرور'));
    await waitFor(() => expect(useAuthStore.getState().tokens).toEqual(tokens));
    await waitFor(() => expect(routerMock.back).toHaveBeenCalled());
  });
});

describe('MyDocumentsScreen', () => {
  it('lists the own documents read-only with their added date', async () => {
    signIn(user());
    jest.spyOn(apiClient, 'get').mockResolvedValue({
      applicationStatus: 'APPROVED',
      documents: [
        {
          kind: 'LICENSE_OR_ID',
          filename: 'id.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1000,
          createdAt: '2024-01-15T10:00:00.000Z',
          downloadUrl: 'https://signed.example/id.jpg',
        },
      ],
    });
    renderWithProviders(<MyDocumentsScreen />);
    expect(await screen.findByText('هوية نقابة الأطباء البيطريين / الترخيص')).toBeTruthy();
    expect(screen.getByText('تاريخ الإضافة: 2024-1-15')).toBeTruthy();
    expect(
      screen.getByText('هذه المستندات تم اعتمادها آلياً لتسجيل الحساب ولا يمكن تعديلها أو حذفها.'),
    ).toBeTruthy();
  });
});
