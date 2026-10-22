import { useAuthStore } from '@/features/auth/store';
import { clinicDashboardApi } from '@/features/clinicDashboard';
import type { ClinicDashboardSummary } from '@/features/clinicDashboard';
import { clinicCareApi, medicalRecordsApi, vaccinationsApi } from '@/features/medical/api';
import { recordExtras } from '@/features/medical/__tests__/fixtures';
import type { MedicalRecord, Vaccination } from '@/features/medical/types';
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
  canDeleteMedicalRecords: true,
  canDeleteVaccinations: true,
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

const page = <T,>(items: T[]) => ({
  items,
  meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 },
});

const record = (over: Partial<MedicalRecord>): MedicalRecord => ({
  id: 'r1',
  animalId: 'a1',
  organizationId: 'o1',
  recordedByUserId: null,
  visitDate: '2026-07-26',
  reason: null,
  diagnosis: null,
  treatment: null,
  notes: null,
  createdAt: '2026-07-26T10:00:00.000Z',
  updatedAt: '2026-07-26T10:00:00.000Z',
  ...recordExtras,
  ...over,
});

const vaccination = (over: Partial<Vaccination>): Vaccination => ({
  id: 'v1',
  animalId: 'a1',
  organizationId: 'o1',
  recordedByUserId: null,
  vaccineName: 'Rabies',
  administeredOn: '2026-07-26',
  nextDueOn: '2027-07-26',
  status: 'SCHEDULED',
  notes: null,
  createdAt: '2026-07-26T10:00:00.000Z',
  updatedAt: '2026-07-26T10:00:00.000Z',
  ...over,
});

describe('OrganizationAnimalDetailScreen (clinic pet details)', () => {
  const get = jest.spyOn(organizationsApi, 'get');
  const getProfile = jest.spyOn(organizationAnimalsApi, 'getProfile');
  const getSummary = jest.spyOn(clinicDashboardApi, 'getSummary');
  const listRecords = jest.spyOn(medicalRecordsApi, 'listForClinic');
  const listVaccinations = jest.spyOn(vaccinationsApi, 'listForClinic');
  const listReminders = jest.spyOn(clinicCareApi, 'listReminders');

  beforeEach(() => {
    resetRouterMock();
    get.mockReset().mockResolvedValue(orgDetail as never);
    getProfile.mockReset();
    getSummary.mockReset().mockResolvedValue(summaryWith({}));
    listRecords.mockReset().mockResolvedValue(page<MedicalRecord>([]));
    listVaccinations.mockReset().mockResolvedValue(page<Vaccination>([]));
    listReminders.mockReset().mockResolvedValue(page([]) as never);
    setSearchParams({ organizationId: 'o1', animalId: 'a1' });
    seedOwner();
  });
  afterAll(() => {
    jest.restoreAllMocks();
    useAuthStore.setState({ session: null });
  });

  it('shows the design header, info strip, ID card, stats and the medical tabs', async () => {
    getProfile.mockResolvedValue(profile);
    listRecords.mockResolvedValue(
      page([
        record({ recordType: 'QUICK_REVIEW', diagnosis: 'حيوان سليم', treatment: 'لا يحتاج علاج' }),
      ]),
    );
    renderWithProviders(<OrganizationAnimalDetailScreen />);

    await waitFor(() => expect(screen.getByText('لولو')).toBeOnTheScreen());
    expect(getProfile).toHaveBeenCalledWith('o1', 'a1');
    expect(screen.getByText('كلب - هاسكي')).toBeOnTheScreen();
    expect(screen.getByText('أنثى')).toBeOnTheScreen();
    expect(screen.getByText('من سنة إلى 3 سنوات')).toBeOnTheScreen();
    expect(screen.getByText('أبيض')).toBeOnTheScreen();
    expect(screen.getByText('الميلاد')).toBeOnTheScreen();
    expect(screen.getByText('K7M-4QXR')).toBeOnTheScreen();
    expect(screen.getByLabelText('نسخ المعرف')).toBeOnTheScreen();
    expect(screen.getByText('إجمالي الزيارات')).toBeOnTheScreen();
    expect(screen.getByText('3')).toBeOnTheScreen();
    expect(screen.getByText('2026-2-1')).toBeOnTheScreen();
    expect(screen.getByText('لا يوجد مالك حالي مسجل لهذا الحيوان.')).toBeOnTheScreen();
    // no owner → no chat tiles
    expect(screen.queryByLabelText('محادثة المالك')).toBeNull();
    expect(screen.getByLabelText('مراجعة سريعة')).toBeOnTheScreen();

    for (const tab of [
      'السجلات الطبية',
      'التطعيمات',
      'التذكيرات',
      'التحاليل',
      'الملفات',
      'الملاحظات',
    ]) {
      expect(screen.getByRole('tab', { name: tab })).toBeOnTheScreen();
    }
    // records tab (default): the clinic's record card, inline
    await waitFor(() => expect(screen.getByText('حيوان سليم')).toBeOnTheScreen());
    expect(screen.getByText('لا يحتاج علاج')).toBeOnTheScreen();
    expect(screen.getByText('عيادة')).toBeOnTheScreen(); // clinic name row
  });

  it('opens the existing create / edit screens from the records tab', async () => {
    getProfile.mockResolvedValue(profile);
    listRecords.mockResolvedValue(page([record({ diagnosis: 'Otitis' })]));
    renderWithProviders(<OrganizationAnimalDetailScreen />);
    await waitFor(() => expect(screen.getByText('+ إضافة سجل طبي جديد')).toBeOnTheScreen());
    fireEvent.press(screen.getByText('+ إضافة سجل طبي جديد'));
    expect(routerMock.push).toHaveBeenCalledWith(
      '/(app)/organizations/o1/animals/a1/medical-records/create',
    );
    await waitFor(() => expect(screen.getByText('Otitis')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('تعديل السجل'));
    expect(routerMock.push).toHaveBeenCalledWith(
      '/(app)/organizations/o1/animals/a1/medical-records/r1/edit',
    );
  });

  it('deletes a record only after confirmation', async () => {
    getProfile.mockResolvedValue(profile);
    listRecords.mockResolvedValue(page([record({ diagnosis: 'Otitis' })]));
    const remove = jest.spyOn(medicalRecordsApi, 'remove').mockResolvedValue({ deleted: true });
    renderWithProviders(<OrganizationAnimalDetailScreen />);
    await waitFor(() => expect(screen.getByText('Otitis')).toBeOnTheScreen());
    fireEvent.press(screen.getByLabelText('حذف السجل'));
    expect(remove).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText('حذف السجل الطبي')).toBeOnTheScreen());
    const buttons = screen.getAllByText('حذف السجل');
    fireEvent.press(buttons[buttons.length - 1]!);
    await waitFor(() => expect(remove).toHaveBeenCalledWith('o1', 'a1', 'r1'));
  });

  it('vaccinations tab: shared doses from another clinic are anonymised and read-only', async () => {
    getProfile.mockResolvedValue(profile);
    listVaccinations.mockResolvedValue(
      page([
        vaccination({ id: 'v1', vaccineName: 'Rabies' }),
        vaccination({ id: 'v2', vaccineName: 'Lepto', organizationId: null }),
      ]),
    );
    renderWithProviders(<OrganizationAnimalDetailScreen />);
    await waitFor(() => expect(screen.getByRole('tab', { name: 'التطعيمات' })).toBeOnTheScreen());
    fireEvent.press(screen.getByRole('tab', { name: 'التطعيمات' }));

    await waitFor(() => expect(screen.getAllByText('Lepto').length).toBeGreaterThan(0));
    expect(screen.getByText('+ إضافة تطعيم جديد')).toBeOnTheScreen();
    expect(screen.getAllByText('2027-7-26')).toHaveLength(2);
    expect(screen.getByText('سجّلته عيادة أخرى')).toBeOnTheScreen();
    // edit / delete only on this clinic's own dose
    expect(screen.getAllByLabelText('تعديل التطعيم')).toHaveLength(1);
    expect(screen.getAllByLabelText('حذف التطعيم')).toHaveLength(1);
  });

  it('lab tab shows only records with lab results and adds a LAB record', async () => {
    getProfile.mockResolvedValue(profile);
    listRecords.mockResolvedValue(
      page([
        record({ id: 'r1', diagnosis: 'CBC', labNotes: 'All normal' }),
        record({ id: 'r2', diagnosis: 'Otitis' }),
      ]),
    );
    renderWithProviders(<OrganizationAnimalDetailScreen />);
    await waitFor(() => expect(screen.getByRole('tab', { name: 'التحاليل' })).toBeOnTheScreen());
    fireEvent.press(screen.getByRole('tab', { name: 'التحاليل' }));
    await waitFor(() => expect(screen.getByText('All normal')).toBeOnTheScreen());
    expect(screen.queryByText('Otitis')).toBeNull();
    fireEvent.press(screen.getByText('+ إضافة فحص مخبري جديد'));
    expect(routerMock.push).toHaveBeenCalledWith({
      pathname: '/(app)/organizations/o1/animals/a1/medical-records/create',
      params: { type: 'LAB' },
    });
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
    listRecords.mockResolvedValue(page([record({ diagnosis: 'Otitis' })]));
    renderWithProviders(<OrganizationAnimalDetailScreen />);
    await waitFor(() => expect(screen.getByText('لولو')).toBeOnTheScreen());
    await waitFor(() => expect(getSummary).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('+ إضافة سجل طبي جديد')).toBeNull());
    await waitFor(() => expect(screen.getByText('Otitis')).toBeOnTheScreen());
    expect(screen.queryByLabelText('تعديل السجل')).toBeNull();
    expect(screen.queryByLabelText('مراجعة سريعة')).toBeNull();
    expect(screen.queryByText('إزالة الحيوان من العيادة')).toBeNull();
  });

  it('clinic STAFF (create / update, no delete): edit stays, delete is hidden', async () => {
    getSummary.mockResolvedValue(
      summaryWith({ canDeleteMedicalRecords: false, canDeleteVaccinations: false }),
    );
    getProfile.mockResolvedValue(profile);
    listRecords.mockResolvedValue(page([record({ diagnosis: 'Otitis' })]));
    renderWithProviders(<OrganizationAnimalDetailScreen />);
    await waitFor(() => expect(screen.getByText('Otitis')).toBeOnTheScreen());
    await waitFor(() => expect(screen.getByText('+ إضافة سجل طبي جديد')).toBeOnTheScreen());
    expect(screen.getByLabelText('تعديل السجل')).toBeOnTheScreen();
    expect(screen.queryByLabelText('حذف السجل')).toBeNull();
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

  it('shows the short pet ID — never the internal id — and no revoke / link action', async () => {
    getProfile.mockResolvedValue(profile);
    renderWithProviders(<OrganizationAnimalDetailScreen />);
    await waitFor(() => expect(screen.getByText('لولو')).toBeOnTheScreen());
    expect(screen.getAllByText('K7M-4QXR').length).toBeGreaterThan(0);
    expect(screen.queryByText('a1')).toBeNull();
    expect(screen.queryByText('إلغاء وصول المؤسسة')).toBeNull();
    expect(screen.queryByText('وصول نشط')).toBeNull();
  });
});
