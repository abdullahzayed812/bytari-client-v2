import { petsApi } from '@/features/pets';
import type { Pet } from '@/features/pets/types';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { publicationsApi } from '../api';
import CreatePublicationScreen from '../screens/CreatePublicationScreen';
import type { AnimalPublication } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const createAnimal = jest.spyOn(petsApi, 'create');
const createPublication = jest.spyOn(publicationsApi, 'create');

const createdAnimal: Pet = {
  id: 'a1',
  name: 'ميمي',
  species: 'CAT',
  breed: null,
  sex: 'MALE',
  dateOfBirth: null,
  notes: null,
  status: 'ACTIVE',
  createdBy: 'u1',
  currentOwnerUserId: 'u1',
  createdAt: '',
  updatedAt: '',
};

const createdPublication: AnimalPublication = {
  id: 'p1',
  animalId: 'a1',
  kind: 'LOST',
  status: 'PENDING',
  note: null,
  createdByUserId: 'u1',
  reviewedByUserId: null,
  reviewedAt: null,
  rejectionReason: null,
  contactName: 'Test Contact',
  contactPhone: '07701234567',
  city: null,
  extraNotes: null,
  healthStatus: null,
  vaccinationStatus: null,
  isSterilized: null,
  lostDate: '2026-01-01',
  lostTime: null,
  lostGovernorate: 'بغداد',
  lostDistrict: 'الكرادة',
  lostLocationDetail: null,
  healthNotes: null,
  createdAt: '',
  updatedAt: '',
};

beforeEach(() => {
  resetRouterMock();
  createAnimal.mockReset();
  createPublication.mockReset();
});
afterAll(() => jest.restoreAllMocks());

const pickSelectOption = (selectLabel: string, optionText: string) => {
  fireEvent.press(screen.getByRole('button', { name: selectLabel }));
  fireEvent.press(screen.getByRole('menuitem', { name: optionText }));
};

const fillLostForm = () => {
  pickSelectOption('نوع الحيوان', 'قط');
  pickSelectOption('الجنس', 'ذكر');
  fireEvent.changeText(screen.getByPlaceholderText('اكتب اسم الحيوان'), 'ميمي');
  fireEvent.changeText(screen.getByPlaceholderText('اختر التاريخ'), '2026-01-01');
  fireEvent.changeText(screen.getByPlaceholderText('اختر المحافظة'), 'بغداد');
  fireEvent.changeText(screen.getByPlaceholderText('اكتب المنطقة أو الحي بالتفصيل'), 'الكرادة');
  fireEvent.changeText(screen.getByPlaceholderText('اكتب اسمك الكامل'), 'Test Contact');
  fireEvent.changeText(screen.getByPlaceholderText('07XXXXXXXX'), '07701234567');
};

describe('CreatePublicationScreen — new animal + listing in one submit', () => {
  it('an unknown [kind] slug is handled gracefully', () => {
    setSearchParams({ kind: 'giraffe' });
    renderWithProviders(<CreatePublicationScreen />);
    expect(screen.getAllByText('نوع إعلان غير معروف').length).toBeGreaterThan(0);
    expect(createAnimal).not.toHaveBeenCalled();
  });

  it('shows the "initial data" section for the animal profile fields', () => {
    setSearchParams({ kind: 'lost' });
    renderWithProviders(<CreatePublicationScreen />);
    expect(screen.getByText('البيانات الأولية')).toBeOnTheScreen();
    expect(screen.getByText('أدخل البيانات الأساسية للحيوان')).toBeOnTheScreen();
  });

  it('rejects submission with the required fields missing (no API calls)', async () => {
    setSearchParams({ kind: 'lost' });
    renderWithProviders(<CreatePublicationScreen />);
    fireEvent.press(screen.getByRole('button', { name: 'إرسال الطلب' }));
    await waitFor(() => expect(screen.getByText('يرجى اختيار نوع الحيوان.')).toBeOnTheScreen());
    expect(createAnimal).not.toHaveBeenCalled();
    expect(createPublication).not.toHaveBeenCalled();
  });

  it('creates the animal, then the LOST listing, then navigates back', async () => {
    setSearchParams({ kind: 'lost' });
    createAnimal.mockResolvedValueOnce(createdAnimal);
    createPublication.mockResolvedValueOnce(createdPublication);
    renderWithProviders(<CreatePublicationScreen />);

    fillLostForm();
    fireEvent.press(screen.getByRole('button', { name: 'إرسال الطلب' }));

    await waitFor(() =>
      expect(createAnimal).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'ميمي', species: 'CAT', sex: 'MALE' }),
      ),
    );
    await waitFor(() =>
      expect(createPublication).toHaveBeenCalledWith(
        'a1',
        expect.objectContaining({
          kind: 'LOST',
          lostDate: '2026-01-01',
          lostGovernorate: 'بغداد',
          lostDistrict: 'الكرادة',
          contactName: 'Test Contact',
          contactPhone: '07701234567',
        }),
      ),
    );
    await waitFor(() => expect(routerMock.back).toHaveBeenCalled());
  });

  it('falls back to "unnamed animal" when the name is left blank', async () => {
    setSearchParams({ kind: 'lost' });
    createAnimal.mockResolvedValueOnce(createdAnimal);
    createPublication.mockResolvedValueOnce(createdPublication);
    renderWithProviders(<CreatePublicationScreen />);

    pickSelectOption('نوع الحيوان', 'قط');
    pickSelectOption('الجنس', 'ذكر');
    fireEvent.changeText(screen.getByPlaceholderText('اختر التاريخ'), '2026-01-01');
    fireEvent.changeText(screen.getByPlaceholderText('اختر المحافظة'), 'بغداد');
    fireEvent.changeText(screen.getByPlaceholderText('اكتب المنطقة أو الحي بالتفصيل'), 'الكرادة');
    fireEvent.changeText(screen.getByPlaceholderText('اكتب اسمك الكامل'), 'Test Contact');
    fireEvent.changeText(screen.getByPlaceholderText('07XXXXXXXX'), '07701234567');
    fireEvent.press(screen.getByRole('button', { name: 'إرسال الطلب' }));

    await waitFor(() =>
      expect(createAnimal).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'حيوان بدون اسم' }),
      ),
    );
  });

  it('maps a backend rejection to a safe message (never the raw text)', async () => {
    setSearchParams({ kind: 'lost' });
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    createAnimal.mockRejectedValueOnce(
      new ApiError({ code: 'VALIDATION_ERROR', message: 'raw backend text', status: 422 }),
    );
    renderWithProviders(<CreatePublicationScreen />);
    fillLostForm();
    fireEvent.press(screen.getByRole('button', { name: 'إرسال الطلب' }));
    await waitFor(() => expect(screen.getByText('تحقق من البيانات المُدخلة.')).toBeOnTheScreen());
    expect(screen.queryByText('raw backend text')).toBeNull();
    expect(createPublication).not.toHaveBeenCalled();
  });

  it('guards against a duplicate submit while the request is pending', async () => {
    setSearchParams({ kind: 'lost' });
    let resolve!: (p: Pet) => void;
    createAnimal.mockReturnValueOnce(new Promise<Pet>((r) => (resolve = r)));
    renderWithProviders(<CreatePublicationScreen />);
    fillLostForm();
    const btn = screen.getByRole('button', { name: 'إرسال الطلب' });
    fireEvent.press(btn);
    fireEvent.press(btn);
    fireEvent.press(btn);
    await waitFor(() => expect(createAnimal).toHaveBeenCalledTimes(1));
    resolve(createdAnimal);
  });
});
