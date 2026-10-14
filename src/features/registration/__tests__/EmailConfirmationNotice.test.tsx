import { renderWithProviders, screen } from '@/test-utils/render';

import PetOwnerRegisterScreen from '../screens/PetOwnerRegisterScreen';
import VeterinarianRegisterScreen from '../screens/VeterinarianRegisterScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const NOTICE =
  'ستحتاج إلى تأكيد بريدك الإلكتروني لإكمال التسجيل، لذا أدخل بريدًا إلكترونيًا صحيحًا يمكنك الوصول إليه. سنرسل إليه رمز التفعيل بعد إنشاء الحساب.';

describe('registration — email confirmation reminder', () => {
  it('the Pet Owner form tells the user they must confirm a reachable email', () => {
    renderWithProviders(<PetOwnerRegisterScreen />);
    expect(screen.getByText(NOTICE)).toBeOnTheScreen();
    // A reminder only — nothing claims the email is already verified.
    expect(screen.queryByText(/تم تأكيد|تم تفعيل البريد/)).toBeNull();
  });

  it('the Veterinarian form shows the same reminder', () => {
    renderWithProviders(<VeterinarianRegisterScreen />);
    expect(screen.getByText(NOTICE)).toBeOnTheScreen();
    expect(screen.queryByText(/تم تأكيد|تم تفعيل البريد/)).toBeNull();
  });
});
