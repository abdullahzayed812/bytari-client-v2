import { useAuthStore } from '@/features/auth/store';
import { vaccinationsApi } from '@/features/medical/api';
import VaccinationsScreen from '@/features/medical/screens/VaccinationsScreen';
import { notificationsApi } from '@/features/notifications';
import { notificationHref } from '@/features/notifications/constants';
import type { AppNotification } from '@/features/notifications/types';
import { organizationsApi } from '@/features/organizations';
import { petsApi } from '@/features/pets';
import PetDetailsScreen from '@/features/pets/screens/PetDetailsScreen';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const owner = {
  id: 'owner1',
  email: 'o@x.c',
  firstName: 'س',
  lastName: 'ع',
  phone: null,
  status: 'ACTIVE' as const,
  veterinarianStatus: 'NOT_APPLIED' as const,
  traderStatus: 'NOT_REGISTERED' as const,
  createdAt: '',
  updatedAt: '',
};
function seedOwner() {
  useAuthStore.setState({
    user: owner,
    session: {
      user: owner,
      roles: ['PET_OWNER'],
      permissions: [],
      isAdmin: false,
      supervisorDomains: [],
      veterinarian: { status: 'NOT_APPLIED', approved: false },
      trader: { status: 'NOT_REGISTERED', approved: false },
    },
  });
}
const pet = (currentOwnerUserId: string) => ({
  id: 'p1',
  name: 'ميمي',
  species: 'CAT',
  breed: null,
  sex: 'UNKNOWN',
  dateOfBirth: null,
  notes: null,
  status: 'ACTIVE',
  createdBy: currentOwnerUserId,
  currentOwnerUserId,
  createdAt: '',
  updatedAt: '',
});

const unseen = jest.spyOn(notificationsApi, 'petUnseen');
const seen = jest.spyOn(notificationsApi, 'markPetSectionSeen');
const getPet = jest.spyOn(petsApi, 'get');

beforeEach(() => {
  resetRouterMock();
  seedOwner();
  unseen.mockReset();
  seen.mockReset().mockResolvedValue({ updated: 1 });
  getPet.mockReset();
});
afterAll(() => {
  jest.restoreAllMocks();
  useAuthStore.setState({ session: null, user: null });
});

describe('pet-care notification → Pet Details', () => {
  const push = (type: string, data: Record<string, string>) =>
    ({
      type: type as AppNotification['type'],
      entityType: null,
      entityId: null,
      data: { type, ...data },
    }) as Parameters<typeof notificationHref>[0];

  it.each([
    'MEDICAL_RECORD_ADDED',
    'VACCINATION_ADDED',
    'VACCINATION_DUE',
    'REMINDER_ADDED',
    'REMINDER_DUE',
  ])('%s opens the pet’s details (ownership is re-checked by the screen)', (type) => {
    expect(notificationHref(push(type, { animalId: 'a1', organizationId: 'c1' }))).toBe(
      '/(app)/pets/a1',
    );
    expect(notificationHref(push(type, {}))).toBe('/(app)/pets');
  });
});

describe('Pet Details "new" badges', () => {
  it('shows per-section unseen counts on the owner’s medical rows (none at 0)', async () => {
    getPet.mockResolvedValue(pet('owner1') as never);
    unseen.mockResolvedValue({ medicalRecords: 2, vaccinations: 1, reminders: 0 });
    setSearchParams({ petId: 'p1' });
    renderWithProviders(<PetDetailsScreen />);

    await waitFor(() => expect(screen.getByText('2 جديد')).toBeOnTheScreen());
    expect(unseen).toHaveBeenCalledWith('p1');
    expect(screen.getByText('1 جديد')).toBeOnTheScreen();
    expect(screen.getByLabelText('السجل الطبي، 2 جديد')).toBeOnTheScreen();
    expect(screen.getByLabelText('التذكيرات')).toBeOnTheScreen(); // no badge
    fireEvent.press(screen.getByLabelText('السجل الطبي، 2 جديد'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/pets/p1/medical-records');
  });

  it('a non-owner viewing a pet never asks for counters', async () => {
    getPet.mockResolvedValue(pet('someone-else') as never);
    setSearchParams({ petId: 'p1' });
    renderWithProviders(<PetDetailsScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    expect(unseen).not.toHaveBeenCalled();
  });
});

describe('opening a section clears only that section', () => {
  const listOwner = jest.spyOn(vaccinationsApi, 'listForOwner');
  const listClinic = jest.spyOn(vaccinationsApi, 'listForClinic');
  beforeEach(() => {
    const empty = { items: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } };
    listOwner.mockReset().mockResolvedValue(empty as never);
    listClinic.mockReset().mockResolvedValue(empty as never);
  });

  it('owner vaccinations → marks "vaccinations" seen once', async () => {
    setSearchParams({ petId: 'p1' });
    renderWithProviders(<VaccinationsScreen />);
    await waitFor(() => expect(seen).toHaveBeenCalledWith('p1', 'vaccinations'));
    expect(seen).toHaveBeenCalledTimes(1);
  });

  it('the clinic’s view of the same list never touches the owner’s read state', async () => {
    jest
      .spyOn(organizationsApi, 'get')
      .mockResolvedValue({ id: 'o1', type: 'CLINIC', myRole: 'OWNER' } as never);
    setSearchParams({ organizationId: 'o1', animalId: 'p1' });
    renderWithProviders(<VaccinationsScreen />);
    await waitFor(() => expect(listClinic).toHaveBeenCalled());
    expect(seen).not.toHaveBeenCalled();
  });
});
