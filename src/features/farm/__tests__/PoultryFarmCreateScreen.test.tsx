import { useAuthStore } from '@/features/auth/store';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import { farmApi } from '../api';
import PoultryFarmCreateScreen from '../screens/PoultryFarmCreateScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);
jest.mock('@/services/media', () => ({
  ...jest.requireActual('@/services/media'),
  pickImage: jest.fn(),
}));

const createFarm = jest.spyOn(farmApi, 'createFarm');

const fill = (placeholder: string, value: string): void =>
  fireEvent.changeText(screen.getByPlaceholderText(placeholder), value);
const submit = (): void =>
  fireEvent.press(screen.getByRole('button', { name: 'إنشاء حقل الدواجن' }));

/** Fill the four required fields (name, location, governorate, production is pre-set). */
const fillRequired = (): void => {
  fill('مثال: مزرعة النور للدواجن', 'مزرعة الاختبار');
  fill('مثال: بغداد - الدورة', 'بغداد - الدورة');
  fireEvent.press(screen.getByRole('button', { name: 'المحافظة *' }));
  fireEvent.press(screen.getByText('بغداد'));
};

describe('PoultryFarmCreateScreen', () => {
  beforeEach(() => {
    resetRouterMock();
    useAuthStore.setState({ session: null });
    createFarm.mockReset();
  });
  afterAll(() => jest.restoreAllMocks());

  it('blocks submission and never calls the API while required fields are empty', async () => {
    renderWithProviders(<PoultryFarmCreateScreen />);
    submit();
    await waitFor(() => expect(screen.getByText('اسم الحقل مطلوب.')).toBeOnTheScreen());
    expect(screen.getByText('الموقع مطلوب.')).toBeOnTheScreen();
    expect(createFarm).not.toHaveBeenCalled();
  });

  it('requires the terms checkbox before it will submit', async () => {
    renderWithProviders(<PoultryFarmCreateScreen />);
    fillRequired();
    submit();
    await waitFor(() =>
      expect(screen.getByText('يجب الموافقة على الشروط والأحكام للمتابعة.')).toBeOnTheScreen(),
    );
    expect(createFarm).not.toHaveBeenCalled();
  });

  it('POSTs the mapped farm body once, then replaces to the new Farm Details', async () => {
    createFarm.mockResolvedValueOnce({
      id: 'o-new',
      type: 'FARM',
      name: 'مزرعة الاختبار',
      status: 'PENDING',
      myRole: 'OWNER',
    } as never);

    renderWithProviders(<PoultryFarmCreateScreen />);
    fillRequired();
    fireEvent.press(screen.getByRole('checkbox', { name: 'أوافق على شروط وأحكام قسم الدواجن' }));
    submit();

    await waitFor(() =>
      expect(createFarm).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'مزرعة الاختبار',
          location: 'بغداد - الدورة',
          governorate: 'بغداد',
          farmCategory: 'BROILER',
          // unset optionals are normalised to null (never omitted / undefined)
          description: null,
          capacity: null,
          currentBirdCount: null,
          contactEmail: null,
        }),
      ),
    );
    expect(createFarm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith('/(app)/poultry/o-new'));
  });

  it('surfaces a mapped Arabic error on a backend rejection, no navigation', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    createFarm.mockRejectedValueOnce(
      new ApiError({ code: 'VALIDATION_ERROR', message: 'raw backend text', status: 422 }),
    );

    renderWithProviders(<PoultryFarmCreateScreen />);
    fillRequired();
    fireEvent.press(screen.getByRole('checkbox', { name: 'أوافق على شروط وأحكام قسم الدواجن' }));
    submit();

    await waitFor(() => expect(createFarm).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('raw backend text')).toBeNull();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });
});
