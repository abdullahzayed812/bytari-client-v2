import { useAuthStore } from '@/features/auth/store';
import { usersApi } from '@/features/users';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { petsApi } from '../api';
import TransferOwnershipScreen from '../screens/TransferOwnershipScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const getPet = jest.spyOn(petsApi, 'get');
const transfer = jest.spyOn(petsApi, 'transferOwnership');
const getSummary = jest.spyOn(usersApi, 'getSummary');

const OWNER = '11111111-1111-1111-1111-111111111111';
const RECIPIENT = '22222222-2222-2222-2222-222222222222';

function seedOwner() {
  const user = {
    id: OWNER,
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

beforeEach(() => {
  resetRouterMock();
  setSearchParams({ petId: 'p1' });
  seedOwner();
  getPet.mockReset().mockResolvedValue({
    id: 'p1',
    name: 'ميمي',
    species: 'CAT',
    breed: null,
    sex: 'UNKNOWN',
    dateOfBirth: null,
    notes: null,
    status: 'ACTIVE',
    createdBy: OWNER,
    currentOwnerUserId: OWNER,
    createdAt: '',
    updatedAt: '',
  });
  transfer.mockReset();
  getSummary.mockReset().mockResolvedValue({
    id: RECIPIENT,
    firstName: 'منى',
    lastName: 'عادل',
    veterinarianStatus: 'NOT_APPLIED',
  });
});
afterAll(() => {
  jest.restoreAllMocks();
  useAuthStore.setState({ session: null, user: null });
});

describe('TransferOwnershipScreen (§8, §9)', () => {
  it('resolves the recipient id to a name and transfers after confirmation', async () => {
    transfer.mockResolvedValueOnce({ id: 'o2' } as never);
    renderWithProviders(<TransferOwnershipScreen />);
    await waitFor(() => expect(screen.getByText(/نقل ملكية/)).toBeOnTheScreen());

    fireEvent.changeText(screen.getByPlaceholderText('الصق مُعرّف المستخدم (UUID)'), RECIPIENT);
    await waitFor(() => expect(screen.getByText('منى عادل')).toBeOnTheScreen());

    fireEvent.press(screen.getByRole('button', { name: 'نقل الملكية' }));
    await waitFor(() => expect(screen.getByText(/سيتم نقل «ميمي»/)).toBeOnTheScreen());
    const confirms = screen.getAllByText('نقل الملكية');
    fireEvent.press(confirms[confirms.length - 1]!);

    await waitFor(() =>
      expect(transfer).toHaveBeenCalledWith('p1', { toUserId: RECIPIENT, reason: undefined }),
    );
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith('/(app)/pets'));
  });

  it('blocks transferring to yourself', async () => {
    renderWithProviders(<TransferOwnershipScreen />);
    await waitFor(() => expect(screen.getByText(/نقل ملكية/)).toBeOnTheScreen());
    fireEvent.changeText(screen.getByPlaceholderText('الصق مُعرّف المستخدم (UUID)'), OWNER);
    await waitFor(() =>
      expect(screen.getByText('لا يمكنك نقل الملكية إلى نفسك.')).toBeOnTheScreen(),
    );
    expect(getSummary).not.toHaveBeenCalled();
    expect(transfer).not.toHaveBeenCalled();
  });

  it('maps a 404 (unknown recipient) to a safe message; raw text hidden', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    getSummary.mockResolvedValue({
      id: RECIPIENT,
      firstName: 'منى',
      lastName: 'عادل',
      veterinarianStatus: 'NOT_APPLIED',
    });
    transfer.mockRejectedValueOnce(
      new ApiError({ code: 'NOT_FOUND', message: 'target user not found', status: 404 }),
    );
    renderWithProviders(<TransferOwnershipScreen />);
    await waitFor(() => expect(screen.getByText(/نقل ملكية/)).toBeOnTheScreen());
    fireEvent.changeText(screen.getByPlaceholderText('الصق مُعرّف المستخدم (UUID)'), RECIPIENT);
    await waitFor(() => expect(screen.getByText('منى عادل')).toBeOnTheScreen());
    fireEvent.press(screen.getByRole('button', { name: 'نقل الملكية' }));
    await waitFor(() => expect(screen.getByText(/سيتم نقل «ميمي»/)).toBeOnTheScreen());
    const confirms = screen.getAllByText('نقل الملكية');
    fireEvent.press(confirms[confirms.length - 1]!);
    await waitFor(() => expect(transfer).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.getByText('لم يتم العثور على مستخدم بهذا المُعرّف.')).toBeOnTheScreen(),
    );
    expect(screen.queryByText('target user not found')).toBeNull();
  });

  it('a non-owner cannot open the transfer flow', async () => {
    getPet.mockResolvedValue({
      id: 'p1',
      name: 'ميمي',
      species: 'CAT',
      breed: null,
      sex: 'UNKNOWN',
      dateOfBirth: null,
      notes: null,
      status: 'ACTIVE',
      createdBy: 'someone',
      currentOwnerUserId: 'someone-else',
      createdAt: '',
      updatedAt: '',
    });
    renderWithProviders(<TransferOwnershipScreen />);
    await waitFor(() =>
      expect(screen.getByText('لا يمكنك نقل ملكية هذا الحيوان.')).toBeOnTheScreen(),
    );
  });
});
