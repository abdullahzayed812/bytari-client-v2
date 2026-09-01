import { Routes } from '@/constants/routes';
import { useAuthStore } from '@/features/auth/store';
import { petsApi } from '@/features/pets';
import MyPetsScreen from '@/features/pets/screens/MyPetsScreen';
import PetDetailsScreen from '@/features/pets/screens/PetDetailsScreen';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { publicationsApi } from '../api';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const petFor = (ownerId: string) => ({
  id: 'p1',
  name: 'ميمي',
  species: 'CAT' as const,
  breed: null,
  sex: 'UNKNOWN' as const,
  dateOfBirth: null,
  notes: null,
  status: 'ACTIVE' as const,
  createdBy: ownerId,
  currentOwnerUserId: ownerId,
  createdAt: '',
  updatedAt: '',
});

function seedUser(id: string) {
  const user = {
    id,
    email: 'o@x.c',
    firstName: 'س',
    lastName: 'ع',
    phone: null,
    status: 'ACTIVE' as const,
    veterinarianStatus: 'NOT_APPLIED' as const,
    createdAt: '',
    updatedAt: '',
  };
  useAuthStore.setState({
    user,
    session: {
      user,
      roles: ['PET_OWNER'],
      permissions: [],
      isAdmin: false,
      supervisorDomains: [],
      veterinarian: { status: 'NOT_APPLIED', approved: false },
    },
  });
}

describe('Phase 8 navigation (§30) + Pet Owner coexistence', () => {
  const getPet = jest.spyOn(petsApi, 'get');
  const listForAnimal = jest.spyOn(publicationsApi, 'listForAnimal');

  beforeEach(() => {
    resetRouterMock();
    getPet.mockReset();
    listForAnimal.mockReset().mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
  });
  afterAll(() => {
    jest.restoreAllMocks();
    useAuthStore.setState({ session: null, user: null });
  });

  it('route builders are deep-link-safe absolute paths', () => {
    expect(Routes.publications('adoption')).toBe('/(app)/publications/adoption');
    expect(Routes.publicationDetail('lost', 'p1')).toBe('/(app)/publications/lost/p1');
    expect(Routes.petPublish('a1', 'mating')).toBe('/(app)/pets/a1/publish/mating');
    expect(Routes.petPublication('a1', 'p1')).toBe('/(app)/pets/a1/publications/p1');
  });

  it('Pet Details (owner) shows the community publish actions and navigates to the publish flow', async () => {
    seedUser('owner1');
    setSearchParams({ petId: 'p1' });
    getPet.mockResolvedValue(petFor('owner1'));
    renderWithProviders(<PetDetailsScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());

    fireEvent.press(screen.getByLabelText('نشر للتبني'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/pets/p1/publish/adoption');

    fireEvent.press(screen.getByLabelText('الإبلاغ عن فقدانه'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/pets/p1/publish/lost');
  });

  it('Pet Details for a NON-owner shows no community actions', async () => {
    seedUser('someone-else');
    setSearchParams({ petId: 'p1' });
    getPet.mockResolvedValue(petFor('owner1'));
    renderWithProviders(<PetDetailsScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    expect(screen.queryByLabelText('نشر للتبني')).toBeNull();
    expect(listForAnimal).not.toHaveBeenCalled();
  });

  it('Pet Details (owner) lists this pet’s existing listings and opens the owner detail', async () => {
    seedUser('owner1');
    setSearchParams({ petId: 'p1' });
    getPet.mockResolvedValue(petFor('owner1'));
    listForAnimal.mockResolvedValue({
      items: [
        {
          id: 'pub1',
          animalId: 'p1',
          kind: 'ADOPTION',
          status: 'PENDING',
          note: null,
          createdByUserId: 'owner1',
          reviewedByUserId: null,
          reviewedAt: null,
          rejectionReason: null,
          createdAt: '2026-02-01T00:00:00.000Z',
          updatedAt: '2026-02-01T00:00:00.000Z',
        },
      ],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<PetDetailsScreen />);
    await waitFor(() => expect(screen.getByText('إعلانات هذا الحيوان')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('إعلان نشر للتبني'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/pets/p1/publications/pub1');
  });

  it('Pet Owner "My Pets" (Phase 3) still renders', async () => {
    jest.spyOn(petsApi, 'list').mockResolvedValue({
      items: [petFor('owner1')],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<MyPetsScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
  });
});
