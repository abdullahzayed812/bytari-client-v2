import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock } from '@/test-utils/routerMock';

import { petsApi, transferRequestsApi } from '../api';
import TransferRequestsScreen from '../screens/TransferRequestsScreen';
import type { AnimalTransferRequest, Pet } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const listSent = jest.spyOn(transferRequestsApi, 'listSent');
const listReceived = jest.spyOn(transferRequestsApi, 'listReceived');
const accept = jest.spyOn(transferRequestsApi, 'accept');
const reject = jest.spyOn(transferRequestsApi, 'reject');
const cancel = jest.spyOn(transferRequestsApi, 'cancel');
const create = jest.spyOn(transferRequestsApi, 'create');
const listPets = jest.spyOn(petsApi, 'list');

const request = (over: Partial<AnimalTransferRequest> = {}): AnimalTransferRequest => ({
  id: 'r1',
  animal: { id: 'a1', name: 'ميمي', species: 'CAT', breed: null },
  fromUser: { id: 'u1', firstName: 'سارة', lastName: 'علي' },
  toUser: { id: 'u2', firstName: 'منى', lastName: 'عادل' },
  status: 'PENDING',
  reason: 'هدية',
  responseReason: null,
  respondedAt: null,
  createdAt: '2026-02-01T10:00:00.000Z',
  updatedAt: '2026-02-01T10:00:00.000Z',
  ...over,
});

const myPet: Pet = {
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
};

beforeEach(() => {
  resetRouterMock();
  listSent.mockReset();
  listReceived.mockReset();
  accept.mockReset();
  reject.mockReset();
  cancel.mockReset();
  create.mockReset();
  listPets.mockReset().mockResolvedValue({
    items: [myPet],
    meta: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
  });
});
afterAll(() => jest.restoreAllMocks());

describe('TransferRequestsScreen — "received" (default tab)', () => {
  it('shows a PENDING received request with Accept/Reject, and accepting confirms then calls the API', async () => {
    listReceived.mockResolvedValue({
      items: [request()],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    accept.mockResolvedValueOnce(request({ status: 'ACCEPTED' }));
    renderWithProviders(<TransferRequestsScreen />);

    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    expect(screen.getByText('من سارة علي')).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: 'قبول' }));
    await waitFor(() => expect(screen.getByText(/بقبولك ستصبح المالك الحالي/)).toBeOnTheScreen());
    const acceptButtons = screen.getAllByRole('button', { name: 'قبول' });
    fireEvent.press(acceptButtons[acceptButtons.length - 1]!);

    await waitFor(() => expect(accept).toHaveBeenCalledWith('r1'));
    await waitFor(() => expect(screen.getByText(/تم قبول الطلب/)).toBeOnTheScreen());
  });

  it('rejecting asks for confirmation then calls the API', async () => {
    listReceived.mockResolvedValue({
      items: [request()],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    reject.mockResolvedValueOnce(request({ status: 'REJECTED' }));
    renderWithProviders(<TransferRequestsScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());

    fireEvent.press(screen.getByRole('button', { name: 'رفض' }));
    await waitFor(() =>
      expect(screen.getByText('هل أنت متأكد من رفض طلب نقل الملكية هذا؟')).toBeOnTheScreen(),
    );
    const rejectButtons = screen.getAllByRole('button', { name: 'رفض' });
    fireEvent.press(rejectButtons[rejectButtons.length - 1]!);

    await waitFor(() => expect(reject).toHaveBeenCalledWith('r1', undefined));
  });

  it('a non-PENDING request shows its status and no action buttons', async () => {
    listReceived.mockResolvedValue({
      items: [request({ status: 'ACCEPTED' })],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<TransferRequestsScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    expect(screen.getByText('مقبول')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'قبول' })).toBeNull();
  });

  it('shows the empty state when there are no received requests', async () => {
    listReceived.mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    renderWithProviders(<TransferRequestsScreen />);
    await waitFor(() =>
      expect(screen.getByText('لا توجد طلبات نقل ملكية مستلمة')).toBeOnTheScreen(),
    );
  });

  it('a backend failure shows a safe error state (no raw message)', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    listReceived.mockRejectedValue(
      new ApiError({ code: 'INTERNAL_ERROR', message: 'db boom', status: 500 }),
    );
    renderWithProviders(<TransferRequestsScreen />);
    await waitFor(() => expect(screen.queryByText('db boom')).toBeNull());
  });
});

describe('TransferRequestsScreen — "sent" tab', () => {
  it('switching tabs loads the sent list; a PENDING one shows Cancel', async () => {
    listReceived.mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    listSent.mockResolvedValue({
      items: [request({ id: 'r2' })],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    cancel.mockResolvedValueOnce(request({ id: 'r2', status: 'CANCELLED' }));
    renderWithProviders(<TransferRequestsScreen />);
    await waitFor(() =>
      expect(screen.getByText('لا توجد طلبات نقل ملكية مستلمة')).toBeOnTheScreen(),
    );

    fireEvent.press(screen.getByRole('tab', { name: 'المرسلة' }));
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());
    expect(screen.getByText('إلى منى عادل')).toBeOnTheScreen();

    fireEvent.press(screen.getByRole('button', { name: 'إلغاء الطلب' }));
    await waitFor(() =>
      expect(screen.getByText('هل أنت متأكد من إلغاء طلب نقل الملكية هذا؟')).toBeOnTheScreen(),
    );
    const confirmButtons = screen.getAllByRole('button', { name: 'إلغاء الطلب' });
    fireEvent.press(confirmButtons[confirmButtons.length - 1]!);

    await waitFor(() => expect(cancel).toHaveBeenCalledWith('r2'));
  });
});

describe('TransferRequestsScreen — creating a new request', () => {
  it('opens the create sheet, picks a pet, fills the recipient, and submits', async () => {
    listReceived.mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    listSent.mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    create.mockResolvedValueOnce(request({ id: 'r3' }));
    renderWithProviders(<TransferRequestsScreen />);
    await waitFor(() =>
      expect(screen.getByText('لا توجد طلبات نقل ملكية مستلمة')).toBeOnTheScreen(),
    );

    fireEvent.press(screen.getByRole('button', { name: 'طلب جديد' }));
    await waitFor(() => expect(screen.getByText('اختر الحيوان')).toBeOnTheScreen());

    fireEvent.press(screen.getByRole('button', { name: 'اختر الحيوان' }));
    await waitFor(() => expect(screen.getByRole('menuitem', { name: 'ميمي' })).toBeOnTheScreen());
    fireEvent.press(screen.getByRole('menuitem', { name: 'ميمي' }));

    fireEvent.changeText(
      screen.getByPlaceholderText('الصق مُعرّف المستخدم (UUID)'),
      '22222222-2222-2222-2222-222222222222',
    );
    fireEvent.press(screen.getByRole('button', { name: 'إرسال الطلب' }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith('a1', {
        toUserId: '22222222-2222-2222-2222-222222222222',
        reason: '',
      }),
    );
  });
});
