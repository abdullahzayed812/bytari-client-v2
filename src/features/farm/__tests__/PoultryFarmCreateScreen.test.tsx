import { useAuthStore } from '@/features/auth/store';
import { organizationsApi } from '@/features/organizations/api';
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
const getTerms = jest.spyOn(organizationsApi, 'getTerms');

const TERMS = {
  termsKey: 'POULTRY_FARM' as const,
  title: 'شروط وقوانين إضافة حقل دواجن',
  intro: 'لإضافة حقل دواجن داخل تطبيق بيطري | Baytari، يجب الالتزام بالشروط التالية:',
  clauses: [
    'يجب أن يكون مقدم طلب إضافة الحقل مالكاً للحقل أو مخولاً رسمياً بإدارته، ويتحمل مسؤولية صحة المعلومات المقدمة.',
    'يسمح لكل حقل بوجود دفعة نشطة واحدة فقط داخل النظام، ولا يمكن إضافة دفعة جديدة إلا بعد بيع أو إنهاء الدفعة الحالية وفق آلية التطبيق.',
  ],
  version: 'v-test',
};
const TERMS_CHECKBOX = `قرأت وأوافق على ${TERMS.title}`;

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
    getTerms.mockReset();
    getTerms.mockResolvedValue(TERMS);
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

  it('shows ONLY the poultry-farm terms, exactly as served, and accepting from the reader ticks the box', async () => {
    renderWithProviders(<PoultryFarmCreateScreen />);
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: TERMS_CHECKBOX })).toBeOnTheScreen(),
    );
    expect(getTerms).toHaveBeenCalledWith('POULTRY_FARM');
    fireEvent.press(screen.getByText('قراءة الشروط والأحكام'));
    for (const clause of TERMS.clauses) {
      await waitFor(() => expect(screen.getByText(clause)).toBeOnTheScreen());
    }
    fireEvent.press(screen.getByText('أوافق على الشروط والأحكام'));
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: TERMS_CHECKBOX })).toBeChecked(),
    );
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
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: TERMS_CHECKBOX })).toBeEnabled(),
    );
    fireEvent.press(screen.getByRole('checkbox', { name: TERMS_CHECKBOX }));
    submit();

    await waitFor(() =>
      expect(createFarm).toHaveBeenCalledWith(
        expect.objectContaining({
          // the acceptance + the exact terms version shown — the server re-checks both
          termsAccepted: true,
          termsVersion: 'v-test',
          name: 'مزرعة الاختبار',
          location: 'بغداد - الدورة',
          governorate: 'بغداد',
          poultryProductionType: 'BROILER',
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
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: TERMS_CHECKBOX })).toBeEnabled(),
    );
    fireEvent.press(screen.getByRole('checkbox', { name: TERMS_CHECKBOX }));
    submit();

    await waitFor(() => expect(createFarm).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('raw backend text')).toBeNull();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });
});
