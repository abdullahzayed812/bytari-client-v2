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
  kind: 'ADOPTION',
  status: 'PENDING',
  note: null,
  createdByUserId: 'u1',
  reviewedByUserId: null,
  reviewedAt: null,
  rejectionReason: null,
  createdAt: '',
  updatedAt: '',
};

describe('PublishAnimalScreen (§6, §7, §32, §35)', () => {
  it('always shows the "subject to review" notice and the "no photos" note', async () => {
    setSearchParams({ petId: 'a1', kind: 'adoption' });
    renderWithProviders(<PublishAnimalScreen />);
    await waitFor(() =>
      expect(screen.getByText('سيتم مراجعة الإعلان قبل ظهوره للمستخدمين.')).toBeOnTheScreen(),
    );
    expect(screen.getByText('لا يدعم النظام إضافة صور للإعلان في هذه المرحلة.')).toBeOnTheScreen();
  });

  it('submits with an empty note (note is optional) — POSTs { kind } for the route animal', async () => {
    setSearchParams({ petId: 'a1', kind: 'adoption' });
    create.mockResolvedValueOnce(created);
    renderWithProviders(<PublishAnimalScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    fireEvent.press(screen.getByRole('button', { name: 'نشر الإعلان' }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith('a1', { kind: 'ADOPTION', note: undefined }),
    );
    await waitFor(() => expect(routerMock.back).toHaveBeenCalled());
  });

  it('submits a lost report with a note', async () => {
    setSearchParams({ petId: 'a1', kind: 'lost' });
    create.mockResolvedValueOnce({ ...created, kind: 'LOST' });
    renderWithProviders(<PublishAnimalScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    fireEvent.changeText(
      screen.getByPlaceholderText('آخر مكان شوهد فيه، وأي علامات مميزة…'),
      'قرب الحديقة',
    );
    fireEvent.press(screen.getByRole('button', { name: 'إرسال البلاغ' }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith('a1', { kind: 'LOST', note: 'قرب الحديقة' }),
    );
  });

  it('maps a 404 (another user’s animal) to "not your animal" — raw text never shown', async () => {
    setSearchParams({ petId: 'a1', kind: 'adoption' });
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    create.mockRejectedValueOnce(
      new ApiError({ code: 'NOT_FOUND', message: 'animal not found', status: 404 }),
    );
    renderWithProviders(<PublishAnimalScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    fireEvent.press(screen.getByRole('button', { name: 'نشر الإعلان' }));
    await waitFor(() => expect(screen.getByText('لا يمكنك نشر حيوان لا تملكه.')).toBeOnTheScreen());
    expect(screen.queryByText('animal not found')).toBeNull();
  });

  it('maps a 409 PUBLICATION_ALREADY_OPEN to the "already listed" message', async () => {
    setSearchParams({ petId: 'a1', kind: 'mating' });
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    create.mockRejectedValueOnce(
      new ApiError({ code: 'PUBLICATION_ALREADY_OPEN' as never, message: 'x', status: 409 }),
    );
    renderWithProviders(<PublishAnimalScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    fireEvent.press(screen.getByRole('button', { name: 'نشر الإعلان' }));
    await waitFor(() =>
      expect(
        screen.getByText('يوجد إعلان مفتوح من هذا النوع لهذا الحيوان بالفعل.'),
      ).toBeOnTheScreen(),
    );
  });

  it('guards against a duplicate submit while the request is pending', async () => {
    setSearchParams({ petId: 'a1', kind: 'adoption' });
    let resolve!: (p: AnimalPublication) => void;
    create.mockReturnValueOnce(new Promise<AnimalPublication>((r) => (resolve = r)));
    renderWithProviders(<PublishAnimalScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    const btn = screen.getByRole('button', { name: 'نشر الإعلان' });
    fireEvent.press(btn);
    fireEvent.press(btn);
    fireEvent.press(btn);
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    resolve(created);
  });
});
