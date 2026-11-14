import { initI18n } from '@/i18n';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock } from '@/test-utils/routerMock';

import PetOwnerRegisterScreen from '../screens/PetOwnerRegisterScreen';
import VeterinarianRegisterScreen from '../screens/VeterinarianRegisterScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const mockRegister = jest.fn();

jest.mock('@/features/auth', () => ({
  ...jest.requireActual('@/features/auth'),
  useRegisterMutation: () => ({ mutate: mockRegister, isPending: false }),
  useAuth: () => ({ requiresEmailVerification: false, logout: jest.fn() }),
}));

jest.mock('../hooks', () => ({
  uploadRegistrationAvatar: jest.fn(),
  uploadRegistrationDocument: jest.fn(),
  useSubmitVeterinarianApplication: () => ({ mutate: jest.fn(), isPending: false }),
}));

// Picking a real image isn't possible under jest — a button stages a fake file.
jest.mock('../components/DocumentUploadTile', () => ({
  DocumentUploadTile: ({
    label,
    onChange,
  }: {
    label: string;
    onChange: (file: unknown) => void;
  }) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`pick ${label}`}
        onPress={() =>
          onChange({ uri: 'file:///doc.jpg', name: 'doc.jpg', mimeType: 'image/jpeg' })
        }
      >
        <Text>{label}</Text>
      </Pressable>
    );
  },
}));

beforeAll(() => initI18n('ar'));
beforeEach(() => {
  resetRouterMock();
  jest.clearAllMocks();
});

function fillPersonal(phone: string) {
  fireEvent.changeText(screen.getByPlaceholderText('مثال: ريم'), 'ريم');
  fireEvent.changeText(screen.getByPlaceholderText('مثال: أحمد'), 'أحمد');
  fireEvent.changeText(screen.getByPlaceholderText('name@example.com'), 'reem@example.com');
  fireEvent.changeText(screen.getByPlaceholderText('7xx xxx xxxx'), phone);
  fireEvent.changeText(screen.getByPlaceholderText('10 أحرف على الأقل'), '1234567890');
  fireEvent.changeText(screen.getByPlaceholderText('أعد إدخال كلمة المرور'), '1234567890');
  fireEvent.press(screen.getByRole('button', { name: 'المحافظة' }));
  fireEvent.press(screen.getByRole('menuitem', { name: /بغداد/ }));
  fireEvent.press(screen.getByRole('radio', { name: 'أنثى' }));
  fireEvent.press(screen.getByRole('checkbox', { name: 'أوافق على الشروط والأحكام' }));
}

describe('registration phone with calling code', () => {
  it('pet owner: defaults to +964 and submits one international number', async () => {
    renderWithProviders(<PetOwnerRegisterScreen />);
    // Iraq +964 is preselected (LRM keeps "+964" LTR inside RTL text).
    expect(screen.getByText('‎+964')).toBeTruthy();

    fillPersonal('0770 123 4567');
    fireEvent.press(screen.getByRole('button', { name: 'إنشاء الحساب' }));

    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));
    expect(mockRegister.mock.calls[0][0]).toMatchObject({
      email: 'reem@example.com',
      phone: '+9647701234567',
      country: 'IQ',
    });
    expect(mockRegister.mock.calls[0][0]).not.toHaveProperty('phoneCountry');
  });

  it('pet owner: blocks submit on an invalid number', async () => {
    renderWithProviders(<PetOwnerRegisterScreen />);
    fillPersonal('123');
    fireEvent.press(screen.getByRole('button', { name: 'إنشاء الحساب' }));
    expect(await screen.findByText('رقم الهاتف غير صحيح.')).toBeTruthy();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('veterinarian: another calling code can be chosen and is submitted', async () => {
    renderWithProviders(<VeterinarianRegisterScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'رمز الدولة' }));
    // Searchable by dial code.
    fireEvent.changeText(screen.getByLabelText('بحث'), '20');
    fireEvent.press(screen.getByRole('menuitem', { name: /مصر/ }));
    expect(screen.getByText('‎+20')).toBeTruthy();

    fillPersonal('010 1234 5678');
    fireEvent.press(screen.getByRole('button', { name: /pick صورة مزاولة المهنة/ }));
    fireEvent.press(screen.getByRole('button', { name: 'إنشاء الحساب وتقديم الطلب' }));

    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));
    expect(mockRegister.mock.calls[0][0]).toMatchObject({
      phone: '+201012345678',
      accountType: 'VETERINARIAN',
    });
  });
});
