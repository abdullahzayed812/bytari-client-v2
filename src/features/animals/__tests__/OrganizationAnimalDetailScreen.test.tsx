import { useAuthStore } from '@/features/auth/store';
import { clinicDashboardApi } from '@/features/clinicDashboard';
import type { ClinicDashboardSummary } from '@/features/clinicDashboard';
import { organizationsApi } from '@/features/organizations';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { organizationAnimalsApi } from '../api';
import OrganizationAnimalDetailScreen from '../screens/OrganizationAnimalDetailScreen';
import type { ClinicAnimalProfile } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function seedOwner() {
  useAuthStore.setState({
    session: {
      user: {
        id: 'u1',
        email: 'v@x.c',
        firstName: 'ريم',
        lastName: 'أحمد',
        phone: null,
        status: 'ACTIVE',
        veterinarianStatus: 'APPROVED',
        traderStatus: 'NOT_REGISTERED' as const,
        createdAt: '',
        updatedAt: '',
      },
      roles: ['PET_OWNER', 'VETERINARIAN'],
      permissions: [],
      isAdmin: false,
      supervisorDomains: [],
      veterinarian: { status: 'APPROVED', approved: true },
      trader: { status: 'NOT_REGISTERED', approved: false },
    },
  });
}

const orgDetail = {
  id: 'o1',
  type: 'CLINIC',
  name: 'عيادة',
  description: null,
  ownerUserId: 'u1',
  status: 'ACTIVE',
  decidedBy: null,
  decidedAt: null,
  decisionReason: null,
  createdAt: '',
  updatedAt: '',
  details: {},
  myRole: 'OWNER',
} as const;

const profile: ClinicAnimalProfile = {
  id: 'a1',
  publicCode: 'K7M4QXR',
  name: 'لولو',
  species: 'DOG',
  breed: 'هاسكي',
  sex: 'FEMALE',
  dateOfBirth: null,
  ageEstimate: 'ONE_TO_3_YEARS',
  color: 'أبيض',
  distinguishingFeatures: null,
  status: 'ACTIVE',
  galleryUrls: [],
  weightKg: null,
  isNeutered: null,
  medicalHistory: null,
  owner: null,
  relationship: {
    firstActivityAt: '2026-02-03T00:00:00.000Z',
    lastActivityAt: '2026-02-04T00:00:00.000Z',
  },
  stats: {
    medicalRecordsCount: 3,
    vaccinationsCount: 2,
    lastVisitDate: '2026-02-01',
    nextVaccinationDue: null,
  },
};

const allowAll: ClinicDashboardSummary['permissions'] = {
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

function summaryWith(permissions: Partial<ClinicDashboardSummary['permissions']>) {
  return {
    permissions: { ...allowAll, ...permissions },
    animals: null,
    medical: null,
    appointments: null,
    followersCount: 0,
    rating: null,
    reviewsCount: 0,
  } satisfies ClinicDashboardSummary;
}

describe('OrganizationAnimalDetailScreen (clinic pet details)', () => {
  const get = jest.spyOn(organizationsApi, 'get');
  const getProfile = jest.spyOn(organizationAnimalsApi, 'getProfile');
  const getSummary = jest.spyOn(clinicDashboardApi, 'getSummary');

  beforeEach(() => {
    resetRouterMock();
    get.mockReset().mockResolvedValue(orgDetail as never);
    getProfile.mockReset();
    getSummary.mockReset().mockResolvedValue(summaryWith({}));
    setSearchParams({ organizationId: 'o1', animalId: 'a1' });
    seedOwner();
  });
  afterAll(() => {
    jest.restoreAllMocks();
    useAuthStore.setState({ session: null });
  });

  it('shows the clinic profile, stats, the owner-not-shared block and the medical modules', async () => {
    getProfile.mockResolvedValue(profile);
    renderWithProviders(<OrganizationAnimalDetailScreen />);

    await waitFor(() => expect(screen.getByText('لولو')).toBeOnTheScreen());
    expect(getProfile).toHaveBeenCalledWith('o1', 'a1');
    expect(screen.getByText('هاسكي')).toBeOnTheScreen();
    expect(screen.getByText('أنثى')).toBeOnTheScreen();
    expect(screen.getByText('من سنة إلى 3 سنوات')).toBeOnTheScreen();
    expect(screen.getByText('إجمالي الزيارات')).toBeOnTheScreen();
    expect(screen.getByText('3')).toBeOnTheScreen();
    expect(screen.getByText('معلومات المالك')).toBeOnTheScreen();
    expect(screen.getByText('لا يوجد مالك حالي مسجل لهذا الحيوان.')).toBeOnTheScreen();
    await waitFor(() => expect(screen.getByText('السجل الطبي الكامل')).toBeOnTheScreen());
    // stat label + medical nav row
    expect(screen.getAllByText('التطعيمات')).toHaveLength(2);
  });

  it('opens the existing medical-record create screen from "إضافة سجل طبي"', async () => {
    getProfile.mockResolvedValue(profile);
    renderWithProviders(<OrganizationAnimalDetailScreen />);
    await waitFor(() => expect(screen.getByText('إضافة سجل طبي')).toBeOnTheScreen());
    fireEvent.press(screen.getByText('إضافة سجل طبي'));
    expect(routerMock.push).toHaveBeenCalledWith(
      '/(app)/organizations/o1/animals/a1/medical-records/create',
    );
  });

  it('hides write actions when the backend permissions deny them', async () => {
    getSummary.mockResolvedValue(
      summaryWith({
        canCreateMedicalRecords: false,
        canCreateVaccinations: false,
        canManageAnimalAccess: false,
      }),
    );
    getProfile.mockResolvedValue(profile);
    renderWithProviders(<OrganizationAnimalDetailScreen />);
    await waitFor(() => expect(screen.getByText('لولو')).toBeOnTheScreen());
    await waitFor(() => expect(getSummary).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('إضافة سجل طبي')).toBeNull());
    expect(screen.queryByText('إضافة تطعيم')).toBeNull();
    expect(screen.queryByText('إلغاء وصول المؤسسة')).toBeNull();
  });

  it('renders a plain "not found" state on a 404 (unknown pet)', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    getProfile.mockRejectedValue(new ApiError({ code: 'NOT_FOUND', message: 'nope', status: 404 }));
    renderWithProviders(<OrganizationAnimalDetailScreen />);
    await waitFor(() => expect(screen.getByText('الحيوان غير موجود')).toBeOnTheScreen());
  });

  it('renders a safe forbidden state on a 403 (no authorization detail leaked)', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    getProfile.mockRejectedValue(
      new ApiError({ code: 'FORBIDDEN', message: 'secret', status: 403 }),
    );
    renderWithProviders(<OrganizationAnimalDetailScreen />);
    await waitFor(() => expect(screen.getByText('الحيوان غير متاح')).toBeOnTheScreen());
    expect(screen.queryByText('secret')).toBeNull();
  });

  it('shows the short pet ID (and QR of it) — never the internal id — and no revoke / link action', async () => {
    getProfile.mockResolvedValue(profile);
    renderWithProviders(<OrganizationAnimalDetailScreen />);
    await waitFor(() => expect(screen.getByText('لولو')).toBeOnTheScreen());
    expect(screen.getAllByText('K7M-4QXR').length).toBeGreaterThan(0);
    expect(screen.queryByText('a1')).toBeNull();
    expect(screen.queryByText('إلغاء وصول المؤسسة')).toBeNull();
    expect(screen.queryByText('وصول نشط')).toBeNull();
  });
});
