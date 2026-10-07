import { clinicDashboardApi } from '@/features/clinicDashboard/api';
import type { ClinicDashboardSummary } from '@/features/clinicDashboard';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { clinicAppointmentService } from '../api';
import ClinicAppointmentsScreen from '../screens/ClinicAppointmentsScreen';
import type { ClinicAppointment } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const appointment: ClinicAppointment = {
  id: 'ap1',
  organizationId: 'c1',
  organization: { id: 'c1', name: 'عيادة الرحمة', phone: null, address: null },
  animalId: 'a1',
  animal: { id: 'a1', name: 'لولو', species: 'DOG', breed: null },
  petOwnerUserId: 'owner1',
  visitType: 'CHECKUP',
  scheduledFor: '2026-10-08T09:00:00.000Z',
  proposedScheduledFor: null,
  note: 'فحص دوري',
  status: 'PENDING',
  decisionReason: null,
  decidedByUserId: null,
  decidedAt: null,
  viewerSide: 'CLINIC',
  createdAt: '',
  updatedAt: '',
};

function summary(canManage: boolean): ClinicDashboardSummary {
  return {
    permissions: {
      canViewAnimals: true,
      canManageAnimalAccess: false,
      canViewMedicalRecords: true,
      canCreateMedicalRecords: true,
      canViewVaccinations: true,
      canCreateVaccinations: true,
      canViewAppointments: true,
      canManageAppointments: canManage,
      canSendBroadcast: false,
      canViewMembers: true,
      canViewSupervisors: false,
      canEditOrganization: false,
    },
    animals: null,
    medical: null,
    appointments: null,
    followersCount: 0,
    rating: null,
    reviewsCount: 0,
  };
}

describe('ClinicAppointmentsScreen (clinic side)', () => {
  const list = jest.spyOn(clinicAppointmentService, 'list');
  const confirm = jest.spyOn(clinicAppointmentService, 'confirm');
  const getSummary = jest.spyOn(clinicDashboardApi, 'getSummary');

  beforeEach(() => {
    resetRouterMock();
    setSearchParams({ organizationId: 'c1' });
    list.mockReset().mockResolvedValue({
      items: [appointment],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    confirm.mockReset().mockResolvedValue({ ...appointment, status: 'CONFIRMED' });
    getSummary.mockReset().mockResolvedValue(summary(true));
  });
  afterAll(() => jest.restoreAllMocks());

  it('lists the routed clinic’s PENDING requests by default and confirms one', async () => {
    renderWithProviders(<ClinicAppointmentsScreen />);
    await waitFor(() => expect(screen.getByText('لولو')).toBeOnTheScreen());
    expect(list).toHaveBeenCalledWith('c1', expect.objectContaining({ status: 'PENDING' }));

    await waitFor(() => expect(screen.getByText('تأكيد')).toBeOnTheScreen());
    fireEvent.press(screen.getByText('تأكيد'));
    await waitFor(() => expect(confirm).toHaveBeenCalledWith('c1', 'ap1'));
  });

  it('is read-only without clinic.appointment.manage', async () => {
    getSummary.mockResolvedValue(summary(false));
    renderWithProviders(<ClinicAppointmentsScreen />);
    await waitFor(() => expect(screen.getByText('لولو')).toBeOnTheScreen());
    await waitFor(() =>
      expect(screen.getByText('يمكنك عرض المواعيد دون إدارتها.')).toBeOnTheScreen(),
    );
    expect(screen.queryByText('تأكيد')).toBeNull();
    expect(screen.queryByText('رفض')).toBeNull();
  });

  it('opens the animal file in the clinic context', async () => {
    renderWithProviders(<ClinicAppointmentsScreen />);
    await waitFor(() => expect(screen.getByText('ملف الحيوان')).toBeOnTheScreen());
    fireEvent.press(screen.getByText('ملف الحيوان'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations/c1/animals/a1');
  });
});
