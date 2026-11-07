import { adminApi } from '@/features/admin/api';
import { useAuthStore } from '@/features/auth/store';
import type { SessionSnapshot } from '@/features/auth/types';
import ManagementScreen from '@/features/management/screens/ManagementScreen';
import { act, fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { expoRouter, resetRouterMock } from '@/test-utils/routerMock';

import AdminPoultrySupervisorsScreen from '../screens/AdminPoultrySupervisorsScreen';
import type {
  PoultrySupervisionFarm,
  PoultrySupervisionLinkedFarm,
  PoultrySupervisionVeterinarian,
  PoultrySupervisionVeterinarianRow,
} from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function session(overrides: Partial<SessionSnapshot>): SessionSnapshot {
  return {
    user: {
      id: 'me',
      email: 'me@example.test',
      firstName: 'سالم',
      lastName: 'العتيبي',
      phone: null,
      status: 'ACTIVE',
      veterinarianStatus: 'NOT_APPLIED',
      traderStatus: 'NOT_REGISTERED' as const,
      createdAt: '',
      updatedAt: '',
    },
    roles: ['PET_OWNER'],
    permissions: [],
    isAdmin: false,
    supervisorDomains: [],
    veterinarian: { status: 'NOT_APPLIED', approved: false },
    trader: { status: 'NOT_REGISTERED', approved: false },
    ...overrides,
  };
}
const admin = () =>
  useAuthStore.setState({ session: session({ isAdmin: true, roles: ['ADMIN', 'PET_OWNER'] }) });

const VET: PoultrySupervisionVeterinarian = {
  userId: '11111111-1111-4111-8111-111111111111',
  firstName: 'أحمد',
  lastName: 'السعدي',
  email: 'ahmed@example.test',
  phone: '07701112233',
  whatsapp: null,
  governorate: 'نينوى',
  specialization: 'صحة الدواجن',
  status: 'ACTIVE',
  avatarUrl: null,
  createdAt: '2026-01-10T10:00:00.000Z',
};
const FARM: PoultrySupervisionFarm = {
  organizationId: 'abcdef12-2222-4222-8222-222222222222',
  name: 'حقل الرافدين للدواجن',
  status: 'ACTIVE',
  governorate: 'نينوى',
  location: 'الموصل',
  address: null,
  ownerUserId: 'owner-1',
  ownerName: 'خالد الجبوري',
  ownerPhone: '07709998877',
  contactPhone: null,
  capacity: 35000,
  productionType: 'BROILER',
  currentBirdCount: 12000,
  subscriptionStartDate: '2026-01-01',
  subscriptionEndDate: '2026-12-31',
  subscriptionStatus: 'ACTIVE',
  imageUrl: null,
  createdAt: '2026-01-05T10:00:00.000Z',
};
const LINKED: PoultrySupervisionLinkedFarm = {
  farm: FARM,
  links: [
    {
      membershipId: 'm1',
      role: 'VETERINARIAN',
      assignedAt: '2026-02-10T09:00:00.000Z',
      supervisionType: 'WEEKLY',
      notes: null,
      veterinarian: VET,
    },
  ],
};
const FREE_FARM: PoultrySupervisionFarm = {
  ...FARM,
  organizationId: 'f0f0f0f0-3333-4333-8333-333333333333',
  name: 'حقل دجلة الذهبي',
};
const FREE_VET: PoultrySupervisionVeterinarianRow = {
  veterinarian: {
    ...VET,
    userId: '99999999-9999-4999-8999-999999999999',
    firstName: 'سامر',
    lastName: 'العاني',
  },
  links: [],
};

const paged = <T,>(items: T[], total = items.length, page = 1, pageSize = 10) => ({
  items,
  meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
});

const list = jest.spyOn(adminApi, 'listPoultrySupervision');
const summary = jest.spyOn(adminApi, 'poultrySupervisionSummary');
const linkApi = jest.spyOn(adminApi, 'linkPoultrySupervisor');
const unlinkApi = jest.spyOn(adminApi, 'unlinkPoultrySupervisor');

beforeEach(() => {
  resetRouterMock();
  summary.mockReset().mockResolvedValue({
    linkedFarms: 42,
    unlinkedFarms: 18,
    linkedVeterinarians: 36,
    unlinkedVeterinarians: 12,
  });
  list.mockReset().mockImplementation(async (section, params) => {
    if (section === 'linked-farms')
      return paged([LINKED], 25, params.page, params.pageSize) as never;
    if (section === 'unlinked-farms') return paged([FREE_FARM]) as never;
    return paged([FREE_VET]) as never;
  });
  linkApi.mockReset().mockResolvedValue({ membershipId: 'new' });
  unlinkApi.mockReset().mockResolvedValue({ success: true });
});
afterAll(() => {
  useAuthStore.setState({ session: null });
  jest.restoreAllMocks();
});

describe('Admin — vet ↔ poultry farm links (إدارة ارتباط الأطباء بالحقول)', () => {
  it('the dashboard card is shown to ADMIN and to holders of poultry_supervision.manage only', () => {
    jest
      .spyOn(adminApi, 'getDashboardSummary')
      .mockResolvedValue({ cards: [], recentActivity: [], pendingTasks: [] });
    useAuthStore.setState({
      session: session({ isAdmin: false, permissions: ['organization.admin.read', 'user.read'] }),
    });
    const { unmount } = renderWithProviders(<ManagementScreen />);
    expect(screen.queryByText('إدارة مشرفي الدواجن')).toBeNull();
    unmount();

    useAuthStore.setState({
      session: session({
        isAdmin: false,
        permissions: ['poultry_supervision.manage', 'dashboard.admin.read'],
        supervisorDomains: ['POULTRY_SUPERVISION'],
      }),
    });
    const sup = renderWithProviders(<ManagementScreen />);
    expect(screen.getByText('إدارة مشرفي الدواجن')).toBeOnTheScreen();
    sup.unmount();

    admin();
    renderWithProviders(<ManagementScreen />);
    fireEvent.press(screen.getByText('إدارة مشرفي الدواجن'));
    expect(expoRouter.router.push).toHaveBeenCalledWith('/(app)/admin/poultry-supervisors');
  });

  it('an authorized supervisor manages links but gets no full vet / farm profile actions', async () => {
    useAuthStore.setState({
      session: session({
        isAdmin: false,
        permissions: ['poultry_supervision.manage'],
        supervisorDomains: ['POULTRY_SUPERVISION'],
      }),
    });
    renderWithProviders(<AdminPoultrySupervisorsScreen />);
    fireEvent.press(await screen.findByLabelText('حقل الرافدين للدواجن'));
    expect(await screen.findByText('الطاقة الاستيعابية')).toBeOnTheScreen();
    expect(screen.queryByText('فتح ملف الحقل الكامل')).toBeNull();
    // Manage-link stays available.
    expect(screen.getAllByText('إدارة الارتباط').length).toBeGreaterThan(0);
    fireEvent.press(screen.getAllByText('إغلاق').at(-1)!);

    fireEvent.press(screen.getByLabelText('أطباء غير مرتبطين'));
    expect(await screen.findByText('سامر العاني')).toBeOnTheScreen();
    fireEvent.press(screen.getAllByLabelText('سامر العاني')[0]!);
    expect(await screen.findByText('تواصل مع الطبيب')).toBeOnTheScreen();
    expect(screen.queryByText('فتح ملف الطبيب الكامل')).toBeNull();
    expect(expoRouter.router.push).not.toHaveBeenCalled();
  });

  it('a user without the permission sees the restricted notice and nothing is requested', () => {
    useAuthStore.setState({ session: session({ isAdmin: false }) });
    renderWithProviders(<AdminPoultrySupervisorsScreen />);
    expect(screen.getByText('هذا القسم متاح لمدير النظام أو المشرف المخوّل فقط')).toBeOnTheScreen();
    expect(list).not.toHaveBeenCalled();
    expect(summary).not.toHaveBeenCalled();
  });

  it('renders the reference layout: counters, banner, tabs, linked farm card, pager', async () => {
    admin();
    renderWithProviders(<AdminPoultrySupervisorsScreen />);

    expect(await screen.findByText('حقل الرافدين للدواجن')).toBeOnTheScreen();
    for (const [n, label] of [
      ['42', 'حقول مرتبطة'],
      ['18', 'حقول غير مرتبطة'],
      ['36', 'أطباء مرتبطين'],
      ['12', 'أطباء غير مرتبطين'],
    ] as const) {
      expect(screen.getByText(n)).toBeOnTheScreen();
      expect(screen.getByText(label)).toBeOnTheScreen();
    }
    expect(
      screen.getByText('كل حقل يشرف عليه طبيب بيطري واحد معتمد | مسجل بتاريخ الارتباط'),
    ).toBeOnTheScreen();
    expect(screen.getByText('الحقول المرتبطة بالأطباء (42)')).toBeOnTheScreen();
    expect(screen.getByText('أحمد السعدي')).toBeOnTheScreen();
    expect(screen.getByText('تاريخ الارتباط: 2026-2-10')).toBeOnTheScreen();
    expect(screen.getByText('رقم الحقل: ABCDEF12')).toBeOnTheScreen();
    expect(screen.getByText('مرتبط')).toBeOnTheScreen();

    // numbered pagination (25 rows / 10 per page → 3 pages)
    fireEvent.press(screen.getByLabelText('الصفحة 3'));
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith('linked-farms', expect.objectContaining({ page: 3 })),
    );
    fireEvent.press(screen.getByLabelText('50 لكل صفحة'));
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        'linked-farms',
        expect.objectContaining({ page: 1, pageSize: 50 }),
      ),
    );
  });

  it('governorate filter drives the list AND the counters; reset clears it', async () => {
    admin();
    renderWithProviders(<AdminPoultrySupervisorsScreen />);
    await screen.findByText('حقل الرافدين للدواجن');
    fireEvent.press(screen.getByLabelText('كل المحافظات'));
    fireEvent.press(await screen.findByText('البصرة'));
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        'linked-farms',
        expect.objectContaining({ governorate: 'البصرة', page: 1 }),
      ),
    );
    expect(summary).toHaveBeenLastCalledWith('البصرة');

    fireEvent.press(screen.getByLabelText('إعادة ضبط الفلاتر'));
    await waitFor(() => expect(summary).toHaveBeenLastCalledWith(undefined));
  });

  it('farm name → farm profile; manage → unlink with confirmation', async () => {
    admin();
    renderWithProviders(<AdminPoultrySupervisorsScreen />);
    fireEvent.press(await screen.findByLabelText('حقل الرافدين للدواجن'));
    expect(await screen.findByText('الطاقة الاستيعابية')).toBeOnTheScreen();
    expect(screen.getByText('35000 طير')).toBeOnTheScreen();
    expect(screen.getByText('فروج لحم')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('فتح ملف الحقل الكامل'));
    expect(expoRouter.router.push).toHaveBeenCalledWith(
      `/(app)/admin/farms/${FARM.organizationId}`,
    );

    fireEvent.press(screen.getByLabelText('إدارة الارتباط'));
    expect(await screen.findByText('الطبيب البيطري المعتمد المشرف حالياً:')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('فك الارتباط'));
    await act(async () => {
      fireEvent.press(screen.getAllByText('فك الارتباط').at(-1)!);
    });
    await waitFor(() => expect(unlinkApi).toHaveBeenCalledWith('m1'));
  });

  it('unlinked farms tab (from its counter) → "+ ربط طبيب بالحقل" links a vet with type + date', async () => {
    admin();
    renderWithProviders(<AdminPoultrySupervisorsScreen />);
    await screen.findByText('حقل الرافدين للدواجن');
    fireEvent.press(screen.getByLabelText('حقول غير مرتبطة'));
    expect(await screen.findByText('حقل دجلة الذهبي')).toBeOnTheScreen();
    expect(screen.getByText('غير مرتبط')).toBeOnTheScreen();

    fireEvent.press(screen.getByLabelText('+ ربط طبيب بالحقل'));
    expect(await screen.findByText('ربط طبيب بيطري بحقل دواجن')).toBeOnTheScreen();
    fireEvent.press(screen.getByLabelText('اختر الطبيب البيطري'));
    fireEvent.press(await screen.findByText(/سامر العاني/));
    fireEvent.press(screen.getByLabelText('نوع التعاقد / الإشراف'));
    fireEvent.press(await screen.findByText('استشارات طارئة'));
    await act(async () => {
      fireEvent.press(screen.getByText('حفظ الارتباط وتأكيد'));
    });
    await waitFor(() => expect(linkApi).toHaveBeenCalledTimes(1));
    expect(linkApi.mock.calls[0]![0]).toMatchObject({
      organizationId: FREE_FARM.organizationId,
      veterinarianUserId: FREE_VET.veterinarian.userId,
      supervisionType: 'EMERGENCY',
    });
    expect(linkApi.mock.calls[0]![0].startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('vets tab lists the directory with the supervised farm and opens the vet file', async () => {
    admin();
    renderWithProviders(<AdminPoultrySupervisorsScreen />);
    await screen.findByText('حقل الرافدين للدواجن');
    fireEvent.press(screen.getByLabelText('أطباء غير مرتبطين'));
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        'veterinarians',
        expect.objectContaining({ link: 'unlinked' }),
      ),
    );
    expect(await screen.findByText('سامر العاني')).toBeOnTheScreen();
    expect(screen.getByText('لا يوجد')).toBeOnTheScreen();
    fireEvent.press(screen.getAllByLabelText('سامر العاني')[0]!);
    expect(await screen.findByText('تواصل مع الطبيب')).toBeOnTheScreen();
    expect(screen.getByText(FREE_VET.veterinarian.userId)).toBeOnTheScreen();
  });
});
