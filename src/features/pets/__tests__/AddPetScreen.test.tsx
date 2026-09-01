import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import { petsApi } from '../api';
import AddPetScreen from '../screens/AddPetScreen';
import type { Pet } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const created: Pet = {
  id: 'p1',
  name: 'لولو',
  species: 'DOG',
  breed: null,
  sex: 'UNKNOWN',
  dateOfBirth: null,
  notes: null,
  status: 'ACTIVE',
  createdBy: 'u1',
  currentOwnerUserId: 'u1',
  createdAt: '',
  updatedAt: '',
};

const fillName = (value: string) =>
  fireEvent.changeText(screen.getByPlaceholderText('مثال: لولو'), value);
const submit = () => fireEvent.press(screen.getByRole('button', { name: 'إضافة الحيوان' }));

describe('AddPetScreen', () => {
  const create = jest.spyOn(petsApi, 'create');
  beforeEach(() => {
    resetRouterMock();
    create.mockReset();
  });
  afterAll(() => jest.restoreAllMocks());

  it('shows a validation error and does NOT call the API for an empty name', async () => {
    renderWithProviders(<AddPetScreen />);
    submit();
    await waitFor(() => expect(screen.getByText('اسم الحيوان مطلوب.')).toBeOnTheScreen());
    expect(create).not.toHaveBeenCalled();
  });

  it('creates the pet (species defaults to DOG) then navigates to its detail', async () => {
    create.mockResolvedValueOnce(created);
    renderWithProviders(<AddPetScreen />);
    fillName('لولو');
    submit();
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'لولو', species: 'DOG' }),
      ),
    );
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith('/(app)/pets/p1'));
  });

  it('shows a mapped Arabic error on a backend rejection (never the raw message)', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    create.mockRejectedValueOnce(
      new ApiError({ code: 'VALIDATION_ERROR', message: 'raw backend text', status: 422 }),
    );
    renderWithProviders(<AddPetScreen />);
    fillName('لولو');
    submit();
    await waitFor(() => expect(screen.getByText('تحقق من البيانات المُدخلة.')).toBeOnTheScreen());
    expect(screen.queryByText('raw backend text')).toBeNull();
  });

  it('guards against a duplicate submit while the request is pending', async () => {
    let resolve!: (p: Pet) => void;
    create.mockReturnValueOnce(new Promise<Pet>((r) => (resolve = r)));
    renderWithProviders(<AddPetScreen />);
    fillName('لولو');
    submit();
    submit();
    submit();
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    resolve(created);
  });
});
