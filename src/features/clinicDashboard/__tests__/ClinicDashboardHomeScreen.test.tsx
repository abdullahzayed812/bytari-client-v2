import { organizationAnimalsApi } from '@/features/animals/api';
import { chatApi } from '@/features/chat/api/chatApi';
import { organizationsApi } from '@/features/organizations';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { clinicDashboardApi } from '../api';
import ClinicDashboardHomeScreen from '../screens/ClinicDashboardHomeScreen';
import type { ClinicDashboardPermissions, ClinicDashboardSummary } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const clinic = {
  id: 'c1',
  type: 'CLINIC',
  name: 'عيادة الرحمة',
  description: null,
  ownerUserId: 'u1',
  status: 'ACTIVE',
  decidedBy: null,
  decidedAt: null,
  decisionReason: null,
  createdAt: '',
  updatedAt: '',
  details: { address: 'بغداد - المنصور', phone: '0770000000', subscriptionStatus: 'ACTIVE' },
  myRole: 'OWNER',
} as const;

const all: ClinicDashboardPermissions = {
  canViewAnimals: true,
  canManageAnimalAccess: true,
  canViewMedicalRecords: true,
  canCreateMedicalRecords: true,
  canViewVaccinations: true,
  canCreateVaccinations: true,
  canViewAppointments: true,
  canManageAppointments: true,
  canSendBroadcast: true,
  canViewMembers: true,
  canViewSupervisors: true,
  canEditOrganization: true,
};

function summary(over: Partial<ClinicDashboardSummary> = {}): ClinicDashboardSummary {
  return {
    permissions: all,
    animals: { activeCount: 7 },
    medical: {
      medicalRecordsCount: 20,
      medicalRecordsToday: 2,
      vaccinationsCount: 9,
      vaccinationsDueToday: 1,
      visitorsToday: 3,
      remindersCount: 0,
      remindersToday: 0,
      medicalAnimals: 1,
      vaccinationAnimals: 1,
      reminderAnimals: 0,
      totalDistinctAnimals: 1,
    },
    appointments: { todayCount: 4, pendingCount: 5, upcomingCount: 6, appointmentAnimals: 1 },
    followersCount: 11,
    rating: 4.5,
    reviewsCount: 2,
    ...over,
  };
}

describe('ClinicDashboardHomeScreen', () => {
  const getOrg = jest.spyOn(organizationsApi, 'get');
  const getSummary = jest.spyOn(clinicDashboardApi, 'getSummary');
  const listAnimals = jest.spyOn(organizationAnimalsApi, 'list');
  const unread = jest.spyOn(chatApi, 'getUnreadSummary');

  beforeEach(() => {
    resetRouterMock();
    setSearchParams({ organizationId: 'c1' });
    getOrg.mockReset().mockResolvedValue(clinic as never);
    getSummary.mockReset().mockResolvedValue(summary());
    listAnimals.mockReset().mockResolvedValue({
      items: [
        {
          animalId: 'a1',
          publicCode: 'K7M4QXR',
          firstActivityAt: '',
          lastActivityAt: '',
          animal: { name: 'لولو', species: 'DOG', status: 'ACTIVE' },
        },
      ],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    unread.mockReset().mockResolvedValue({ unreadConversations: 1, unreadMessages: 3 });
  });
  afterAll(() => jest.restoreAllMocks());

  it('loads the clinic header + stats for the routed clinic id', async () => {
    renderWithProviders(<ClinicDashboardHomeScreen />);
    await waitFor(() => expect(screen.getByText('عيادة الرحمة')).toBeOnTheScreen());
    expect(getOrg).toHaveBeenCalledWith('c1');
    expect(getSummary).toHaveBeenCalledWith('c1');
    expect(screen.getByText('بغداد - المنصور')).toBeOnTheScreen();
    expect(screen.getByText('11')).toBeOnTheScreen(); // followers
    expect(screen.getByLabelText('سجلات اليوم: 2')).toBeOnTheScreen();
    expect(screen.getByLabelText('طلبات بانتظار الرد: 5')).toBeOnTheScreen();
    await waitFor(() => expect(screen.getByText('لولو')).toBeOnTheScreen());
  });

  it('routes the quick-access tiles to the existing v2 screens', async () => {
    renderWithProviders(<ClinicDashboardHomeScreen />);
    await waitFor(() => expect(screen.getByText('عيادة الرحمة')).toBeOnTheScreen());

    fireEvent.press(screen.getByRole('button', { name: /^المواعيد/ }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/clinic-dashboard/c1/appointments');
    fireEvent.press(screen.getByRole('button', { name: 'فتح حيوان برقم المعرف' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations/c1/animals/open');
    fireEvent.press(screen.getByRole('button', { name: 'إرسال رسالة للمتابعين' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/clinic-dashboard/c1/broadcast');
    fireEvent.press(screen.getByText('ملف العيادة'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations/c1');

    await waitFor(() => expect(screen.getByText('لولو')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('فتح ملف لولو'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations/c1/animals/a1');
  });

  it('hides sections the backend withholds (e.g. STAFF: no animals / medical / broadcast)', async () => {
    getSummary.mockResolvedValue(
      summary({
        permissions: {
          ...all,
          canViewAnimals: false,
          canManageAnimalAccess: false,
          canViewMedicalRecords: false,
          canSendBroadcast: false,
          canEditOrganization: false,
          canViewSupervisors: false,
        },
        animals: null,
        medical: null,
      }),
    );
    renderWithProviders(<ClinicDashboardHomeScreen />);
    await waitFor(() => expect(screen.getByText('عيادة الرحمة')).toBeOnTheScreen());
    expect(screen.queryByText('الحيوانات الأخيرة')).toBeNull();
    expect(screen.queryByText('جميع الحيوانات')).toBeNull();
    expect(screen.queryByText('فتح حيوان برقم المعرف')).toBeNull();
    expect(screen.queryByText('إرسال رسالة للمتابعين')).toBeNull();
    expect(screen.queryByText('إعدادات العيادة')).toBeNull();
    expect(screen.queryByText('سجلات اليوم')).toBeNull();
    expect(screen.getByText('مواعيد اليوم')).toBeOnTheScreen();
    expect(listAnimals).not.toHaveBeenCalled();
  });

  it('shows a safe "not available" state for a non-member (403), without server detail', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    getOrg.mockRejectedValue(new ApiError({ code: 'FORBIDDEN', message: 'secret', status: 403 }));
    getSummary.mockRejectedValue(
      new ApiError({ code: 'FORBIDDEN', message: 'secret', status: 403 }),
    );
    renderWithProviders(<ClinicDashboardHomeScreen />);
    await waitFor(() => expect(screen.getByText('لوحة العيادة غير متاحة')).toBeOnTheScreen());
    expect(screen.queryByText('secret')).toBeNull();
    fireEvent.press(screen.getByText('العودة إلى مؤسساتي'));
    expect(routerMock.back).toHaveBeenCalled();
  });
});
