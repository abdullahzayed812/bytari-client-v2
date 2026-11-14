import { TextInput } from 'react-native';

import { initI18n } from '@/i18n';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import AddServiceRequestScreen from '../screens/AddServiceRequestScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const mockCreate = jest.fn();

jest.mock('../hooks', () => ({
  ...jest.requireActual('../hooks'),
  useCreateServiceRequest: () => ({ mutate: mockCreate, isPending: false, error: null }),
  useVetServiceImageProvider: () => ({ upload: jest.fn(), resolveUrl: jest.fn() }),
}));

jest.mock('@/components/media', () => ({
  ...jest.requireActual('@/components/media'),
  MultiImagePicker: () => null,
}));

beforeAll(() => initI18n('ar'));
beforeEach(() => {
  resetRouterMock();
  jest.clearAllMocks();
});

// title, description, count, age, district, address, budget, notes — in render order.
const inputs = () => screen.UNSAFE_getAllByType(TextInput);

describe('AddServiceRequestScreen', () => {
  it('opens with every user-entered field empty and nothing selected', () => {
    renderWithProviders(<AddServiceRequestScreen />);
    for (const input of inputs()) expect(input.props.value).toBe('');
    // Animal type / service type / governorate show the placeholder, not a value.
    expect(screen.getAllByText('اختر…')).toHaveLength(3);
    expect(screen.queryByDisplayValue('كشف بيطري لقطة مريضة')).toBeNull();
  });

  it('keeps required validation, then submits only what the user entered', async () => {
    renderWithProviders(<AddServiceRequestScreen />);
    fireEvent.press(screen.getByRole('checkbox', { name: 'أوافق على الشروط والأحكام' }));
    fireEvent.press(screen.getByRole('button', { name: 'نشر الطلب' }));
    expect(screen.getAllByText('هذا الحقل مطلوب').length).toBeGreaterThanOrEqual(5);
    expect(mockCreate).not.toHaveBeenCalled();

    const [title, description, count] = inputs();
    fireEvent.changeText(title, 'فحص كلب');
    fireEvent.changeText(description, 'كلب يعرج منذ يومين');
    fireEvent.press(screen.getByRole('button', { name: 'نوع الحيوان' }));
    fireEvent.press(screen.getAllByRole('menuitem')[0]);
    fireEvent.press(screen.getByRole('button', { name: 'نوع الخدمة' }));
    fireEvent.press(screen.getAllByRole('menuitem')[0]);
    fireEvent.press(screen.getByRole('button', { name: 'المحافظة' }));
    fireEvent.press(screen.getByRole('menuitem', { name: /بغداد/ }));

    // Optional count must be a positive whole number when given.
    fireEvent.changeText(count, '0');
    fireEvent.press(screen.getByRole('button', { name: 'نشر الطلب' }));
    expect(screen.getByText('أدخل عدداً صحيحاً أكبر من صفر.')).toBeTruthy();
    expect(mockCreate).not.toHaveBeenCalled();
    fireEvent.changeText(count, '');

    fireEvent.press(screen.getByRole('button', { name: 'نشر الطلب' }));
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
    const payload = mockCreate.mock.calls[0][0];
    expect(payload).toMatchObject({
      title: 'فحص كلب',
      description: 'كلب يعرج منذ يومين',
      governorate: 'بغداد',
      // Business defaults preserved.
      urgency: 'NORMAL',
      needsFieldVisit: false,
      imageKeys: [],
    });
    for (const key of [
      'animalCount',
      'animalAge',
      'district',
      'detailedAddress',
      'preferredDate',
      'budgetAmount',
      'extraNotes',
    ]) {
      expect(payload[key]).toBeUndefined();
    }

    mockCreate.mock.calls[0][1].onSuccess({ id: 'r1' });
    expect(routerMock.replace).toHaveBeenCalled();
  });
});
