import { petsApi } from '@/features/pets';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { publicationsApi } from '../api';
import PublishAnimalScreen from '../screens/PublishAnimalScreen';
import type { AnimalPublication } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const getPet = jest.spyOn(petsApi, 'get');
const create = jest.spyOn(publicationsApi, 'create');

beforeEach(() => {
  resetRouterMock();
  getPet.mockReset().mockResolvedValue({
    id: 'a1',
    name: 'ميمي',
    species: 'CAT',
    breed: null,
    sex: 'UNKNOWN',
    dateOfBirth: null,
    notes: null,
    status: 'ACTIVE',
    createdBy: 'u1',
    currentOwnerUserId: 'u1',
    createdAt: '',
    updatedAt: '',
  });
  create.mockReset();
});
afterAll(() => jest.restoreAllMocks());

const created: AnimalPublication = {
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

const fillLostRequiredFields = () => {
  fireEvent.changeText(screen.getByPlaceholderText('اختر التاريخ'), '2026-01-01');
  fireEvent.changeText(screen.getByPlaceholderText('اختر المحافظة'), 'بغداد');
  fireEvent.changeText(screen.getByPlaceholderText('اكتب المنطقة أو الحي بالتفصيل'), 'الكرادة');
  fireEvent.changeText(screen.getByPlaceholderText('اكتب اسمك الكامل'), 'Test Contact');
  fireEvent.changeText(screen.getByPlaceholderText('07XXXXXXXX'), '07701234567');
};

describe('PublishAnimalScreen — an existing pet, listing fields only (animal profile already known)', () => {
  it('always shows the "subject to review" notice', async () => {
    setSearchParams({ petId: 'a1', kind: 'lost' });
    renderWithProviders(<PublishAnimalScreen />);
    await waitFor(() =>
      expect(screen.getByText('سيتم مراجعة الإعلان قبل ظهوره للمستخدمين.')).toBeOnTheScreen(),
    );
  });

  it('rejects submission with the required LOST fields missing', async () => {
    setSearchParams({ petId: 'a1', kind: 'lost' });
    renderWithProviders(<PublishAnimalScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    fireEvent.press(screen.getByRole('button', { name: 'إرسال الطلب' }));
    await waitFor(() => expect(screen.getByText('المحافظة مطلوبة.')).toBeOnTheScreen());
    expect(create).not.toHaveBeenCalled();
  });

  it('submits a complete lost report — POSTs the full LOST body for the route animal', async () => {
    setSearchParams({ petId: 'a1', kind: 'lost' });
    create.mockResolvedValueOnce(created);
    renderWithProviders(<PublishAnimalScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    fillLostRequiredFields();
    fireEvent.press(screen.getByRole('button', { name: 'إرسال الطلب' }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
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

  it('maps a 404 (another user’s animal) to "not your animal" — raw text never shown', async () => {
    setSearchParams({ petId: 'a1', kind: 'lost' });
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    create.mockRejectedValueOnce(
      new ApiError({ code: 'NOT_FOUND', message: 'animal not found', status: 404 }),
    );
    renderWithProviders(<PublishAnimalScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    fillLostRequiredFields();
    fireEvent.press(screen.getByRole('button', { name: 'إرسال الطلب' }));
    await waitFor(() => expect(screen.getByText('لا يمكنك نشر حيوان لا تملكه.')).toBeOnTheScreen());
    expect(screen.queryByText('animal not found')).toBeNull();
  });

  it('maps a 409 PUBLICATION_ALREADY_OPEN to the "already listed" message', async () => {
    setSearchParams({ petId: 'a1', kind: 'lost' });
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    create.mockRejectedValueOnce(
      new ApiError({ code: 'PUBLICATION_ALREADY_OPEN' as never, message: 'x', status: 409 }),
    );
    renderWithProviders(<PublishAnimalScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    fillLostRequiredFields();
    fireEvent.press(screen.getByRole('button', { name: 'إرسال الطلب' }));
    await waitFor(() =>
      expect(
        screen.getByText('يوجد إعلان مفتوح من هذا النوع لهذا الحيوان بالفعل.'),
      ).toBeOnTheScreen(),
    );
  });

  it('guards against a duplicate submit while the request is pending', async () => {
    setSearchParams({ petId: 'a1', kind: 'lost' });
    let resolve!: (p: AnimalPublication) => void;
    create.mockReturnValueOnce(new Promise<AnimalPublication>((r) => (resolve = r)));
    renderWithProviders(<PublishAnimalScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    fillLostRequiredFields();
    const btn = screen.getByRole('button', { name: 'إرسال الطلب' });
    fireEvent.press(btn);
    fireEvent.press(btn);
    fireEvent.press(btn);
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    resolve(created);
  });
});
