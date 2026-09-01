import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import HomeScreen from '@/features/home/screens/HomeScreen';

import { petsApi } from '../api';
import MyPetsScreen from '../screens/MyPetsScreen';
import PetDetailsScreen from '../screens/PetDetailsScreen';
import type { Pet } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const pet: Pet = {
  id: 'p1',
  name: 'لولو',
  species: 'DOG',
  breed: 'لابرادور',
  sex: 'MALE',
  dateOfBirth: '2021-06-01',
  notes: null,
  status: 'ACTIVE',
  createdBy: 'u1',
  currentOwnerUserId: 'u1',
  createdAt: '',
  updatedAt: '',
};

describe('pet navigation (§27)', () => {
  const list = jest.spyOn(petsApi, 'list');
  const get = jest.spyOn(petsApi, 'get');

  beforeEach(() => {
    resetRouterMock();
    list.mockReset();
    get.mockReset();
  });
  afterAll(() => jest.restoreAllMocks());

  it('Home → My Pets (view all)', async () => {
    list.mockResolvedValue({
      items: [pet],
      meta: { page: 1, pageSize: 3, total: 1, totalPages: 1 },
    });
    renderWithProviders(<HomeScreen />);
    await waitFor(() => expect(screen.getByText('عرض الكل')).toBeOnTheScreen());
    fireEvent.press(screen.getByRole('button', { name: 'عرض الكل' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/pets');
  });

  it('My Pets → Pet Details (card)', async () => {
    list.mockResolvedValue({
      items: [pet],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<MyPetsScreen />);
    await waitFor(() => expect(screen.getByText('لولو')).toBeOnTheScreen());
    fireEvent.press(screen.getByRole('button', { name: /لولو/ }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/pets/p1');
  });

  it('My Pets → Add Pet (header action)', async () => {
    list.mockResolvedValue({
      items: [pet],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<MyPetsScreen />);
    await waitFor(() => expect(screen.getByText('لولو')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('إضافة حيوان'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/pets/create');
  });

  it('Pet Details → Edit Pet', async () => {
    setSearchParams({ petId: 'p1' });
    get.mockResolvedValue(pet);
    renderWithProviders(<PetDetailsScreen />);
    await waitFor(() => expect(screen.getByText('لولو')).toBeOnTheScreen());
    fireEvent.press(screen.getByRole('button', { name: 'تعديل' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/pets/p1/edit');
  });
});
