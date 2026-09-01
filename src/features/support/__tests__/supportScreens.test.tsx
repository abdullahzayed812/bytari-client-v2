import { useAuthStore } from '@/features/auth/store';
import type { SupervisorDomain } from '@/features/auth/types';
import { petsApi } from '@/features/pets';
import { usersApi } from '@/features/users';
import { fireEvent, renderWithProviders, screen, waitFor, within } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { consultationApi, inquiryApi } from '../api';
import AdminThreadListScreen from '../screens/AdminThreadListScreen';
import CreateThreadScreen from '../screens/CreateThreadScreen';
import ThreadDetailScreen from '../screens/ThreadDetailScreen';
import ThreadListScreen from '../screens/ThreadListScreen';
import type { Paginated, Thread, ThreadMessage } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

// The realtime transport needs a `WebSocket` global (absent under jsdom). The
// screen only wires query invalidation through it, so a no-op subscription is
// the correct test double — pull-to-refresh / post-send invalidation still work.
jest.mock('@/services/realtime', () => ({
  realtimeClient: { on: jest.fn(() => ({ unsubscribe: jest.fn() })) },
}));

const ME = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';

function seed({
  id = ME,
  isAdmin = false,
  permissions = [] as string[],
  supervisorDomains = [] as SupervisorDomain[],
  vetApproved = false,
}: {
  id?: string;
  isAdmin?: boolean;
  permissions?: string[];
  supervisorDomains?: SupervisorDomain[];
  vetApproved?: boolean;
} = {}) {
  const user = {
    id,
    email: 'u@x.c',
    firstName: 'ر',
    lastName: 'ز',
    phone: null,
    status: 'ACTIVE' as const,
    veterinarianStatus: vetApproved ? ('APPROVED' as const) : ('NOT_APPLIED' as const),
    createdAt: '',
    updatedAt: '',
  };
  useAuthStore.setState({
    user,
    status: 'authenticated',
    session: {
      user,
      roles: ['PET_OWNER'],
      permissions,
      isAdmin,
      supervisorDomains,
      veterinarian: {
        status: vetApproved ? 'APPROVED' : 'NOT_APPLIED',
        approved: vetApproved,
      },
    },
  });
}

const thread = (over: Partial<Thread> = {}): Thread => ({
  id: 'c1',
  kind: 'CONSULTATION',
  status: 'OPEN',
  createdByUserId: ME,
  animalId: null,
  senderBlocked: false,
  aiResponded: false,
  lastMessageAt: null,
  closedAt: null,
  createdAt: '2026-01-01T09:00:00.000Z',
  updatedAt: '2026-01-01T09:00:00.000Z',
  ...over,
});

const emptyPage: Paginated<never> = {
  items: [],
  meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
};
const listOf = (items: Thread[]): Paginated<Thread> => ({
  items,
  meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 },
});
const msgPage = (items: ThreadMessage[]): Paginated<ThreadMessage> => ({
  items,
  meta: { page: 1, pageSize: 30, total: items.length, totalPages: 1 },
});

beforeEach(() => {
  resetRouterMock();
  jest.spyOn(usersApi, 'getSummary').mockResolvedValue({
    id: OTHER,
    firstName: 'سارة',
    lastName: 'ن',
    veterinarianStatus: 'APPROVED',
  });
});
afterEach(() => jest.restoreAllMocks());
afterAll(() => useAuthStore.setState({ session: null, user: null, status: 'unauthenticated' }));

describe('ThreadListScreen', () => {
  it('shows an "unknown kind" empty state for a bad slug', async () => {
    seed();
    setSearchParams({ kind: 'nonsense' });
    renderWithProviders(<ThreadListScreen />);
    expect(await screen.findByText('نوع غير معروف')).toBeOnTheScreen();
  });

  it('lists the caller’s own consultations and opens one', async () => {
    seed();
    setSearchParams({ kind: 'consultations' });
    jest.spyOn(consultationApi, 'listMine').mockResolvedValue(listOf([thread({ id: 'c9' })]));

    renderWithProviders(<ThreadListScreen />);
    const card = await screen.findByRole('button', { name: /فتح استشارة/ });
    fireEvent.press(card);
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/support/consultations/c9');
  });

  it('the header + button routes to the create screen', async () => {
    seed();
    setSearchParams({ kind: 'inquiries' });
    jest.spyOn(inquiryApi, 'listMine').mockResolvedValue(emptyPage);

    renderWithProviders(<ThreadListScreen />);
    fireEvent.press(await screen.findByLabelText('محادثة جديدة'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/support/inquiries/create');
  });

  it('hides the "review queue" chip from a plain user and shows it to a supervisor', async () => {
    setSearchParams({ kind: 'consultations' });
    jest.spyOn(consultationApi, 'listMine').mockResolvedValue(emptyPage);

    seed();
    const plain = renderWithProviders(<ThreadListScreen />);
    await screen.findByText('محادثة جديدة');
    expect(plain.queryByText('قائمة المراجعة')).toBeNull();
    plain.unmount();

    seed({ supervisorDomains: ['CONSULTATION'] });
    renderWithProviders(<ThreadListScreen />);
    expect(await screen.findByText('قائمة المراجعة')).toBeOnTheScreen();
  });
});

describe('ThreadDetailScreen', () => {
  it('hides existence behind a not-available notice on 404', async () => {
    seed();
    setSearchParams({ kind: 'consultations', threadId: 'c1' });
    jest
      .spyOn(consultationApi, 'get')
      .mockRejectedValue(
        new (require('@/services/api').ApiError)({ code: 'NOT_FOUND', message: 'x', status: 404 }),
      );
    jest.spyOn(consultationApi, 'listMessages').mockResolvedValue(msgPage([]));

    renderWithProviders(<ThreadDetailScreen />);
    expect(await screen.findByText('المحادثة غير متاحة')).toBeOnTheScreen();
  });

  it('the creator gets a composer; a closed thread disables it with a reason', async () => {
    seed();
    setSearchParams({ kind: 'consultations', threadId: 'c1' });
    jest
      .spyOn(consultationApi, 'get')
      .mockResolvedValue(thread({ status: 'CLOSED', createdByUserId: ME }));
    jest.spyOn(consultationApi, 'listMessages').mockResolvedValue(msgPage([]));

    renderWithProviders(<ThreadDetailScreen />);
    expect(
      await screen.findByText('هذه المحادثة مغلقة؛ لا يمكن إرسال رسائل جديدة.'),
    ).toBeOnTheScreen();
  });

  it('a non-participant without responder permission sees no composer at all', async () => {
    seed({ id: OTHER });
    setSearchParams({ kind: 'consultations', threadId: 'c1' });
    jest.spyOn(consultationApi, 'get').mockResolvedValue(thread({ createdByUserId: ME }));
    jest.spyOn(consultationApi, 'listMessages').mockResolvedValue(msgPage([]));

    renderWithProviders(<ThreadDetailScreen />);
    await screen.findByText('لا توجد رسائل بعد.');
    expect(screen.queryByLabelText('اكتب رسالة…')).toBeNull();
    expect(screen.queryByText('إيقاف المُرسِل')).toBeNull();
  });

  it('a responder (backend permission) sees the Block-sender control', async () => {
    seed({ id: OTHER, permissions: ['consultation.respond'] });
    setSearchParams({ kind: 'consultations', threadId: 'c1' });
    jest.spyOn(consultationApi, 'get').mockResolvedValue(thread({ createdByUserId: ME }));
    jest.spyOn(consultationApi, 'listMessages').mockResolvedValue(msgPage([]));

    renderWithProviders(<ThreadDetailScreen />);
    expect(await screen.findByText('إيقاف المُرسِل')).toBeOnTheScreen();
    expect(screen.getByLabelText('اكتب رسالة…')).toBeOnTheScreen();
  });
});

describe('CreateThreadScreen', () => {
  it('blocks inquiry creation for a non-approved-vet with a gate notice + disabled submit', async () => {
    seed({ vetApproved: false });
    setSearchParams({ kind: 'inquiries' });

    renderWithProviders(<CreateThreadScreen />);
    expect(
      await screen.findByText('إنشاء الاستفسارات متاح للأطباء البيطريين المعتمَدين فقط.'),
    ).toBeOnTheScreen();

    const create = jest.spyOn(inquiryApi, 'create');
    fireEvent.changeText(screen.getByPlaceholderText('اكتب استفسارك…'), 'سؤال مهني');
    fireEvent.press(screen.getByLabelText('إرسال'));
    await waitFor(() => expect(create).not.toHaveBeenCalled());
  });

  it('a consultation offers the optional owned-animal picker and submits body-only when none chosen', async () => {
    seed();
    setSearchParams({ kind: 'consultations' });
    jest.spyOn(petsApi, 'list').mockResolvedValue({
      items: [
        {
          id: 'a1',
          name: 'ميمي',
          species: 'CAT',
          breed: null,
          sex: 'UNKNOWN',
          dateOfBirth: null,
          notes: null,
          status: 'ACTIVE',
          createdBy: ME,
          currentOwnerUserId: ME,
          createdAt: '',
          updatedAt: '',
        } as never,
      ],
      meta: { page: 1, pageSize: 50, total: 1, totalPages: 1 },
    });
    const create = jest.spyOn(consultationApi, 'create').mockResolvedValue(thread({ id: 'cNew' }));

    renderWithProviders(<CreateThreadScreen />);
    await screen.findByText('الحيوان (اختياري)');
    fireEvent.changeText(
      screen.getByPlaceholderText('صِف حالة الحيوان أو سؤالك بالتفصيل…'),
      'حالة طارئة',
    );
    fireEvent.press(screen.getByLabelText('إرسال'));

    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create).toHaveBeenCalledWith({ body: 'حالة طارئة', animalId: undefined });
    expect(routerMock.replace).toHaveBeenCalledWith('/(app)/support/consultations/cNew');
  });
});

describe('AdminThreadListScreen — supervisor scoping', () => {
  it('a CONSULTATION supervisor may open the consultation queue', async () => {
    seed({ supervisorDomains: ['CONSULTATION'] });
    setSearchParams({ kind: 'consultations' });
    jest.spyOn(consultationApi, 'listAdmin').mockResolvedValue(listOf([thread({ id: 'q1' })]));

    renderWithProviders(<AdminThreadListScreen />);
    expect(await screen.findByText('إدارة الاستشارات')).toBeOnTheScreen();
    expect(screen.queryByText('غير متاح')).toBeNull();
  });

  it('a CONSULTATION supervisor is denied the INQUIRY queue', async () => {
    seed({ supervisorDomains: ['CONSULTATION'] });
    setSearchParams({ kind: 'inquiries' });
    const listAdmin = jest.spyOn(inquiryApi, 'listAdmin').mockResolvedValue(emptyPage);

    renderWithProviders(<AdminThreadListScreen />);
    expect(await screen.findByText('غير متاح')).toBeOnTheScreen();
    expect(listAdmin).not.toHaveBeenCalled();
  });

  it('an admin may open either queue', async () => {
    seed({ isAdmin: true });
    setSearchParams({ kind: 'inquiries' });
    jest
      .spyOn(inquiryApi, 'listAdmin')
      .mockResolvedValue(listOf([thread({ id: 'q2', kind: 'INQUIRY' })]));

    renderWithProviders(<AdminThreadListScreen />);
    const card = await screen.findByRole('button', { name: /فتح استفسار/ });
    expect(within(card).getByText('استفسار')).toBeOnTheScreen();
  });
});
