import { chatApi } from '@/features/chat/api/chatApi';
import { clinicAppointmentService } from '@/features/clinicAppointments/api';
import ClinicAppointmentsScreen from '@/features/clinicAppointments/screens/ClinicAppointmentsScreen';
import type { ClinicAppointment } from '@/features/clinicAppointments/types';
import { clinicDashboardApi } from '@/features/clinicDashboard/api';
import type { ClinicDashboardSummary } from '@/features/clinicDashboard';
import { organizationsApi } from '@/features/organizations';
import PetClinicsScreen from '@/features/pets/screens/PetClinicsScreen';
import { apiClient } from '@/services/api';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { organizationAnimalsApi } from '../api';
import OrganizationAnimalDetailScreen from '../screens/OrganizationAnimalDetailScreen';
import type { ClinicAnimalProfile } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const permissions: ClinicDashboardSummary['permissions'] = {
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
const summary = {
  permissions,
  animals: null,
  medical: null,
  appointments: null,
  followersCount: 0,
  rating: null,
  reviewsCount: 0,
} as ClinicDashboardSummary;

const profile: ClinicAnimalProfile = {
  id: 'a1',
  publicCode: 'K7M4QXR',
  name: 'لولو',
  species: 'DOG',
  breed: null,
  sex: 'FEMALE',
  dateOfBirth: null,
  ageEstimate: null,
  color: null,
  distinguishingFeatures: null,
  status: 'ACTIVE',
  galleryUrls: [],
  weightKg: 12.5,
  isNeutered: true,
  medicalHistory: null,
  owner: { id: 'own1', firstName: 'سارة', lastName: 'علي', phone: '0770000000' },
  relationship: null,
  stats: {
    medicalRecordsCount: 0,
    vaccinationsCount: 0,
    lastVisitDate: null,
    nextVaccinationDue: null,
  },
};

beforeEach(() => {
  resetRouterMock();
  jest
    .spyOn(organizationsApi, 'get')
    .mockResolvedValue({ id: 'o1', type: 'CLINIC', myRole: 'OWNER', details: {} } as never);
  jest.spyOn(clinicDashboardApi, 'getSummary').mockResolvedValue(summary);
});
afterEach(() => jest.restoreAllMocks());

describe('clinic pet details — legacy clinic mode', () => {
  it('shows owner contact + parity fields, and opens the owner chat (created on demand)', async () => {
    setSearchParams({ organizationId: 'o1', animalId: 'a1' });
    jest.spyOn(organizationAnimalsApi, 'getProfile').mockResolvedValue(profile);
    jest.spyOn(chatApi, 'listConversations').mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    } as never);
    const start = jest.spyOn(chatApi, 'start').mockResolvedValue({ id: 'c1' } as never);

    renderWithProviders(<OrganizationAnimalDetailScreen />);
    await waitFor(() => expect(screen.getByText('سارة علي')).toBeOnTheScreen());
    expect(screen.getByText('0770000000')).toBeOnTheScreen();
    expect(screen.getByText('12.5 كجم')).toBeOnTheScreen();
    expect(screen.getByText('عقيم')).toBeOnTheScreen();
    expect(start).not.toHaveBeenCalled(); // viewing never creates a conversation

    fireEvent.press(screen.getByText('محادثة المالك'));
    await waitFor(() =>
      expect(start).toHaveBeenCalledWith({ organizationId: 'o1', targetUserId: 'own1' }),
    );
    await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith('/(app)/chat/c1'));
  });

  it('quick actions route to the legacy flows (full exam / lab)', async () => {
    setSearchParams({ organizationId: 'o1', animalId: 'a1' });
    jest.spyOn(organizationAnimalsApi, 'getProfile').mockResolvedValue(profile);
    renderWithProviders(<OrganizationAnimalDetailScreen />);
    await waitFor(() => expect(screen.getByLabelText('فحص كامل')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('فحص كامل'));
    expect(routerMock.push).toHaveBeenCalledWith({
      pathname: '/(app)/organizations/o1/animals/a1/medical-records/create',
      params: { type: 'FULL_EXAM' },
    });
    fireEvent.press(screen.getByLabelText('إضافة تحليل'));
    expect(routerMock.push).toHaveBeenCalledWith({
      pathname: '/(app)/organizations/o1/animals/a1/medical-records/create',
      params: { type: 'LAB' },
    });
  });
});

describe('owner "clinics" tab', () => {
  it('lists the clinics with counts and opens the clinic profile', async () => {
    setSearchParams({ petId: 'a1' });
    jest.spyOn(apiClient, 'get').mockResolvedValue([
      {
        organizationId: 'o1',
        name: 'عيادة الرحمة',
        logoUrl: null,
        phone: null,
        address: null,
        vaccinationsCount: 1,
        remindersCount: 0,
      },
    ] as never);
    renderWithProviders(<PetClinicsScreen />);
    await waitFor(() => expect(screen.getByText('عيادة الرحمة')).toBeOnTheScreen());
    expect(screen.getByText('1 تطعيمات • 0 تذكيرات')).toBeOnTheScreen();
    expect(screen.queryByText(/سجلات طبية/)).toBeNull();
    fireEvent.press(screen.getByLabelText('عيادة الرحمة'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations/discover/o1');
  });
});

describe('clinic appointments — legacy clinic actions', () => {
  const completed: ClinicAppointment = {
    id: 'ap1',
    organizationId: 'o1',
    organization: { id: 'o1', name: 'عيادة', phone: null, address: null },
    animalId: 'a1',
    animal: { id: 'a1', name: 'لولو', species: 'DOG', breed: null },
    petOwnerUserId: 'own1',
    visitType: 'CHECKUP',
    scheduledFor: '2026-10-08T09:00:00.000Z',
    proposedScheduledFor: null,
    note: null,
    status: 'COMPLETED',
    decisionReason: null,
    decidedByUserId: null,
    decidedAt: null,
    viewerSide: 'CLINIC',
    createdAt: '',
    updatedAt: '',
  };

  it('deletes a completed appointment after confirmation and offers "remind today"', async () => {
    setSearchParams({ organizationId: 'o1' });
    jest.spyOn(clinicAppointmentService, 'list').mockResolvedValue({
      items: [completed],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    const remove = jest
      .spyOn(clinicAppointmentService, 'remove')
      .mockResolvedValue({ deleted: true });
    renderWithProviders(<ClinicAppointmentsScreen />);
    await waitFor(() => expect(screen.getByText('حذف')).toBeOnTheScreen());
    expect(screen.getByText('تذكير مواعيد اليوم')).toBeOnTheScreen();
    fireEvent.press(screen.getByText('حذف'));
    await waitFor(() => expect(screen.getByText('حذف الموعد')).toBeOnTheScreen());
    const buttons = screen.getAllByText('حذف');
    fireEvent.press(buttons[buttons.length - 1]!);
    await waitFor(() => expect(remove).toHaveBeenCalledWith('o1', 'ap1'));
  });
});
