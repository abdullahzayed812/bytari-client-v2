import { Text } from 'react-native';

import { useAuthStore } from '@/features/auth/store';
import type { SupervisorDomain } from '@/features/auth/types';
import ManagementScreen from '@/features/management/screens/ManagementScreen';
import { MarketOfferCard } from '@/features/poultryMarket/components';
import * as uploads from '@/services/files/fileUploadService';
import { act, fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, setSearchParams } from '@/test-utils/routerMock';

import { adminApi } from '../api';
import AdminUserDetailScreen from '../screens/AdminUserDetailScreen';
import type { AdminUserDetail } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);
const mockPickImage = jest.fn();
jest.mock('@/services/media', () => {
  const actual = jest.requireActual('@/services/media');
  return { ...actual, pickImage: (...a: unknown[]) => mockPickImage(...a) };
});

function seed(opts: {
  isAdmin: boolean;
  permissions: string[];
  supervisorDomains?: SupervisorDomain[];
}) {
  useAuthStore.setState({
    session: {
      user: {
        id: 'staff1',
        email: 'staff@x.c',
        firstName: 'م',
        lastName: 'ع',
        phone: null,
        status: 'ACTIVE',
        veterinarianStatus: 'NOT_APPLIED',
        traderStatus: 'NOT_REGISTERED' as const,
        createdAt: '',
        updatedAt: '',
      },
      roles: opts.isAdmin ? ['ADMIN'] : ['PET_OWNER'],
      permissions: opts.permissions,
      isAdmin: opts.isAdmin,
      supervisorDomains: opts.supervisorDomains ?? [],
      veterinarian: { status: 'NOT_APPLIED', approved: false },
      trader: { status: 'NOT_REGISTERED', approved: false },
    },
  } as never);
}

const VET_USER: AdminUserDetail = {
  id: 'v1',
  email: 'vet@example.test',
  firstName: 'علي',
  lastName: 'حسن',
  phone: null,
  status: 'ACTIVE',
  veterinarianStatus: 'APPROVED',
  avatarUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  roles: ['PET_OWNER', 'VETERINARIAN'],
  veterinarianApplication: {
    id: 'app1',
    status: 'APPROVED',
    subType: 'VETERINARIAN',
    note: null,
    decidedAt: null,
    decisionReason: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    documents: [
      {
        kind: 'LICENSE_OR_ID',
        filename: 'old-id.png',
        mimeType: 'image/png',
        sizeBytes: 100,
        downloadUrl: 'https://signed.example/old',
      },
    ],
    documentsVisible: true,
  },
  organizations: [],
} as unknown as AdminUserDetail;

afterAll(() => {
  useAuthStore.setState({ session: null });
  jest.restoreAllMocks();
});

describe('dashboard — delegated Featured Clinics / Poultry Supervisors cards', () => {
  beforeEach(() => {
    resetRouterMock();
    jest
      .spyOn(adminApi, 'getDashboardSummary')
      .mockResolvedValue({ cards: [], recentActivity: [], pendingTasks: [] });
  });

  it('a FEATURED_CLINICS supervisor sees only the featured card (not home-section images)', () => {
    seed({
      isAdmin: false,
      permissions: ['featured_organization.manage', 'dashboard.admin.read'],
      supervisorDomains: ['FEATURED_CLINICS'],
    });
    renderWithProviders(<ManagementScreen />);
    expect(screen.getByText('العيادات والمكاتب المميزة')).toBeOnTheScreen();
    expect(screen.queryByText('إدارة مشرفي الدواجن')).toBeNull();
  });
});

describe('Admin — change a veterinarian identity document', () => {
  const getUser = jest.spyOn(adminApi, 'getUser');

  beforeEach(() => {
    resetRouterMock();
    setSearchParams({ userId: 'v1' });
    getUser.mockReset().mockResolvedValue(VET_USER);
  });

  it('is offered to the ADMIN only (a VETERINARIANS supervisor with read access gets none)', async () => {
    seed({
      isAdmin: false,
      permissions: ['user.read', 'veterinarian.read'],
      supervisorDomains: ['VETERINARIANS'],
    });
    const { unmount } = renderWithProviders(<AdminUserDetailScreen />);
    expect(await screen.findByText('طلب اعتماد الطبيب البيطري')).toBeOnTheScreen();
    expect(screen.queryByText('تغيير مستند الهوية')).toBeNull();
    unmount();

    seed({ isAdmin: true, permissions: [] });
    renderWithProviders(<AdminUserDetailScreen />);
    expect(await screen.findByText('تغيير مستند الهوية')).toBeOnTheScreen();
    expect(screen.getByText('old-id.png')).toBeOnTheScreen();
  });

  it('uploads the picked image privately and swaps it in for that kind', async () => {
    seed({ isAdmin: true, permissions: [] });
    const picked = { uri: 'file:///new.jpg', name: 'new.jpg', mimeType: 'image/jpeg', size: 2048 };
    mockPickImage.mockResolvedValue(picked);
    const uploadSpy = jest
      .spyOn(uploads.FileUploadService.prototype, 'upload')
      .mockResolvedValue({ storageKey: 'veterinarians/documents/k1', size: 2048 });
    const replace = jest.spyOn(adminApi, 'replaceVetDocument').mockResolvedValue([]);

    renderWithProviders(<AdminUserDetailScreen />);
    await screen.findByText('تغيير مستند الهوية');
    fireEvent.press(screen.getAllByLabelText('تغيير')[0]!);
    await act(async () => {
      fireEvent.press(await screen.findByText('اختيار صورة'));
    });

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith('v1', 'LICENSE_OR_ID', {
        storageKey: 'veterinarians/documents/k1',
        filename: 'new.jpg',
        mimeType: 'image/jpeg',
      }),
    );
    expect(uploadSpy).toHaveBeenCalledWith(picked);
  });
});

describe('market offer card — action buttons', () => {
  it('renders Delete / Call / WhatsApp labels in full (wrapping, never an ellipsis)', () => {
    renderWithProviders(
      <MarketOfferCard
        title="عرض"
        lines={[]}
        locationLabel="بغداد"
        createdAt="2026-11-01T00:00:00.000Z"
        fallbackIcon="egg-outline"
        canDelete
        onPressDetails={jest.fn()}
        onPressCall={jest.fn()}
        onPressWhatsapp={jest.fn()}
        onPressDelete={jest.fn()}
      />,
    );
    for (const label of ['حذف', 'اتصال', 'واتساب', 'التفاصيل']) {
      const text = screen.UNSAFE_getAllByType(Text).find((n) => n.props.children === label);
      expect(text).toBeDefined();
      expect(text!.props.numberOfLines).toBeUndefined();
    }
  });
});
