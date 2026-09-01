import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import { petsApi } from '../api';
import MyPetsScreen from '../screens/MyPetsScreen';
import type { Pet } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const pet = (id: string, name: string): Pet => ({
  id,
  name,
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
});

describe('MyPetsScreen', () => {
  const list = jest.spyOn(petsApi, 'list');
  beforeEach(() => {
    resetRouterMock();
    list.mockReset();
  });
  afterAll(() => jest.restoreAllMocks());

  it('renders the empty state and its CTA opens Add Pet', async () => {
    list.mockResolvedValue({ items: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } });
    renderWithProviders(<MyPetsScreen />);
    await waitFor(() => expect(screen.getByText('لا توجد حيوانات مضافة بعد')).toBeOnTheScreen());
    fireEvent.press(screen.getAllByRole('button', { name: 'إضافة حيوان' })[0]);
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/pets/create');
  });

  it('renders an error state with a retry action', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    list.mockRejectedValue(new ApiError({ code: 'INTERNAL_ERROR', message: 'x', status: 500 }));
    renderWithProviders(<MyPetsScreen />);
    await waitFor(() =>
      expect(screen.getByText('حدثت مشكلة في الخادم. يرجى المحاولة بعد قليل.')).toBeOnTheScreen(),
    );
    expect(screen.getByRole('button', { name: 'إعادة المحاولة' })).toBeOnTheScreen();
  });

  it('renders the pet list, the count, and navigates to a pet on press', async () => {
    list.mockResolvedValue({
      items: [pet('p1', 'لولو'), pet('p2', 'ميمي')],
      meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    });
    renderWithProviders(<MyPetsScreen />);
    await waitFor(() => expect(screen.getByText('لولو')).toBeOnTheScreen());
    expect(screen.getByText('ميمي')).toBeOnTheScreen();
    expect(screen.getByText('2 حيوان')).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: /لولو/ }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/pets/p1');
  });
});
