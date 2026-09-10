import { useAuthStore } from '@/features/auth/store';
import type { VeterinarianStatus } from '@/features/auth/types';
import { organizationsApi } from '@/features/organizations';
import type { PublicOrganization } from '@/features/organizations';
import { inquiryApi } from '@/features/support';
import type { Paginated, Thread } from '@/features/support';
import { renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock } from '@/test-utils/routerMock';

import { veterinarianApi } from '../api';
import VeterinarianHomeScreen from '../screens/VeterinarianHomeScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function seed(status: VeterinarianStatus) {
  useAuthStore.setState({
    session: {
      user: {
        id: 'u1',
        email: 'e@x.c',
        firstName: 'ريم',
        lastName: 'أحمد',
        phone: null,
        status: 'ACTIVE',
        veterinarianStatus: status,
        traderStatus: 'NOT_REGISTERED' as const,
        createdAt: '',
        updatedAt: '',
      },
      roles: status === 'APPROVED' ? ['PET_OWNER', 'VETERINARIAN'] : ['PET_OWNER'],
      permissions: [],
      isAdmin: false,
      supervisorDomains: [],
      veterinarian: { status, approved: status === 'APPROVED' },
      trader: { status: 'NOT_REGISTERED', approved: false },
    },
  });
}

const office = (over: Partial<PublicOrganization> = {}): PublicOrganization => ({
  id: 'org1',
  type: 'VETERINARY_OFFICE',
  name: 'عيادة البرموك البيطرية',
  description: null,
  address: null,
  latitude: null,
  longitude: null,
  phone: null,
  logoUrl: null,
  workingHours: null,
  services: [],
  email: null,
  whatsapp: null,
  instagramUrl: null,
  facebookUrl: null,
  tiktokUrl: null,
  galleryUrls: [],
  distanceKm: null,
  rating: null,
  reviewsCount: 0,
  createdAt: '2026-01-01',
  ...over,
});

const inquiryThread = (over: Partial<Thread> = {}): Thread => ({
  id: 'inq1',
  kind: 'INQUIRY',
  status: 'OPEN',
  createdByUserId: 'u1',
  animalId: null,
  senderBlocked: false,
  aiResponded: false,
  lastMessageAt: null,
  closedAt: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  ...over,
});

const page = <T,>(items: T[]): Paginated<T> => ({
  items,
  meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 },
});

describe('VeterinarianHomeScreen — capability-aware, backend authoritative', () => {
  const discover = jest.spyOn(organizationsApi, 'discover');
  const myStatus = jest.spyOn(veterinarianApi, 'myStatus');
  const listMyInquiries = jest.spyOn(inquiryApi, 'listMine');

  beforeEach(() => {
    resetRouterMock();
    discover.mockReset().mockResolvedValue(page([]));
    listMyInquiries.mockReset().mockResolvedValue(page([]));
    myStatus.mockReset().mockResolvedValue({ veterinarianStatus: 'PENDING', application: null });
  });
  afterAll(() => {
    jest.restoreAllMocks();
    useAuthStore.setState({ session: null });
  });

  it('APPROVED → shows the inquiry CTA, previous inquiries and veterinary offices, no status card', async () => {
    seed('APPROVED');
    discover.mockResolvedValue(page([office()]));
    listMyInquiries.mockResolvedValue(page([inquiryThread()]));

    renderWithProviders(<VeterinarianHomeScreen />);

    await waitFor(() => expect(screen.getByText('عيادة البرموك البيطرية')).toBeOnTheScreen());
    expect(screen.getByText('أرسل استفسارك')).toBeOnTheScreen();
    expect(screen.getByText('المكاتب البيطرية')).toBeOnTheScreen();
    expect(screen.queryByText('حالة الاعتماد كطبيب بيطري')).toBeNull();
  });

  it('APPROVED with nothing yet → shows empty states instead of fake data', async () => {
    seed('APPROVED');
    renderWithProviders(<VeterinarianHomeScreen />);

    await waitFor(() => expect(screen.getByText('لا توجد استفسارات')).toBeOnTheScreen());
    expect(screen.getByText('لا توجد مكاتب بيطرية متاحة حالياً')).toBeOnTheScreen();
  });

  it('PENDING → shows the pending hint and hides the inquiry sections, but still shows public offices', async () => {
    seed('PENDING');
    discover.mockResolvedValue(page([office()]));
    renderWithProviders(<VeterinarianHomeScreen />);
    await waitFor(() =>
      expect(screen.getByText('طلب اعتمادك قيد المراجعة من فريق الإدارة.')).toBeOnTheScreen(),
    );
    await waitFor(() => expect(screen.getByText('عيادة البرموك البيطرية')).toBeOnTheScreen());
    expect(screen.getByText('المكاتب البيطرية')).toBeOnTheScreen();
    expect(screen.queryByText('أرسل استفسارك')).toBeNull();
  });

  it('REJECTED → surfaces the rejection reason and a re-apply CTA', async () => {
    seed('REJECTED');
    myStatus.mockResolvedValue({
      veterinarianStatus: 'REJECTED',
      application: {
        id: 'a1',
        userId: 'u1',
        status: 'REJECTED',
        note: null,
        decidedBy: 'admin',
        decidedAt: '',
        decisionReason: 'الوثائق غير مكتملة',
        createdAt: '',
        updatedAt: '',
      },
    });
    renderWithProviders(<VeterinarianHomeScreen />);
    await waitFor(() => expect(screen.getByText('السبب: الوثائق غير مكتملة')).toBeOnTheScreen());
    expect(screen.getByText('تقديم طلب جديد')).toBeOnTheScreen();
  });

  it('never-applied → shows the apply CTA', async () => {
    seed('NOT_APPLIED');
    renderWithProviders(<VeterinarianHomeScreen />);
    await waitFor(() => expect(screen.getByText('تقديم طلب الاعتماد')).toBeOnTheScreen());
  });
});
