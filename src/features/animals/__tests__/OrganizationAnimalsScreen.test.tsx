import { useAuthStore } from '@/features/auth/store';
import type { SessionSnapshot } from '@/features/auth/types';
import { organizationsApi } from '@/features/organizations';
import { FlatList } from 'react-native';

import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { organizationAnimalsApi } from '../api';
import OrganizationAnimalsScreen from '../screens/OrganizationAnimalsScreen';
import type { OrganizationAnimalGrant } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function seedSession(over: Partial<SessionSnapshot> = {}) {
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
        createdAt: '',
        updatedAt: '',
      },
      roles: ['PET_OWNER', 'VETERINARIAN'],
      permissions: [],
      isAdmin: false,
      supervisorDomains: [],
      veterinarian: { status: 'APPROVED', approved: true },
      ...over,
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

const grant = (over: Partial<OrganizationAnimalGrant> = {}): OrganizationAnimalGrant => ({
  id: 'g1',
  animalId: 'a1',
  organizationId: 'o1',
  status: 'ACTIVE',
  grantedByUserId: 'u1',
  createdAt: '2026-01-01T00:00:00.000Z',
  animal: { name: 'لولو', species: 'DOG', status: 'ACTIVE' },
  ...over,
});

describe('OrganizationAnimalsScreen (§5, §22, §26, §27)', () => {
  const get = jest.spyOn(organizationsApi, 'get');
  const list = jest.spyOn(organizationAnimalsApi, 'list');

  beforeEach(() => {
    resetRouterMock();
    get.mockReset().mockResolvedValue(orgDetail as never);
    list.mockReset();
    setSearchParams({ organizationId: 'o1' });
    seedSession();
  });
  afterAll(() => {
    jest.restoreAllMocks();
    useAuthStore.setState({ session: null });
  });

  it('renders the organization animals list scoped to the route organizationId', async () => {
    list.mockResolvedValue({
      items: [grant()],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<OrganizationAnimalsScreen />);
    await waitFor(() => expect(screen.getByText('لولو')).toBeOnTheScreen());
    expect(list).toHaveBeenCalledWith('o1', 1, 20);
  });

  it('shows the empty state when the organization has no linked animals', async () => {
    list.mockResolvedValue({ items: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } });
    renderWithProviders(<OrganizationAnimalsScreen />);
    await waitFor(() =>
      expect(screen.getByText('لا توجد حيوانات مرتبطة بهذه المؤسسة')).toBeOnTheScreen(),
    );
  });

  it('shows a safe error state on a backend failure and never the raw message', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    list.mockRejectedValue(
      new ApiError({ code: 'INTERNAL_ERROR', message: 'raw db boom', status: 500 }),
    );
    renderWithProviders(<OrganizationAnimalsScreen />);
    await waitFor(() => expect(screen.queryByText('raw db boom')).toBeNull());
  });

  it('an unauthorized (403) list surfaces the safe forbidden message', async () => {
    const { ApiError } = jest.requireActual('@/services/api') as typeof import('@/services/api');
    list.mockRejectedValue(new ApiError({ code: 'FORBIDDEN', message: 'nope', status: 403 }));
    renderWithProviders(<OrganizationAnimalsScreen />);
    await waitFor(() =>
      expect(screen.getByText('لا تملك صلاحية تنفيذ هذا الإجراء.')).toBeOnTheScreen(),
    );
  });

  it('the local name filter narrows the loaded rows and shows a no-match state', async () => {
    list.mockResolvedValue({
      items: [
        grant(),
        grant({
          id: 'g2',
          animalId: 'a2',
          animal: { name: 'ميمي', species: 'CAT', status: 'ACTIVE' },
        }),
      ],
      meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    });
    renderWithProviders(<OrganizationAnimalsScreen />);
    await waitFor(() => expect(screen.getByText('ميمي')).toBeOnTheScreen());

    // The filter is debounced (`useDebouncedValue`) — poll until it settles.
    fireEvent.changeText(screen.getByPlaceholderText('تصفية بالاسم…'), 'لولو');
    await waitFor(
      () => {
        expect(screen.getByText('لولو')).toBeOnTheScreen();
        expect(screen.queryByText('ميمي')).toBeNull();
      },
      { timeout: 5000, interval: 60 },
    );

    fireEvent.changeText(screen.getByPlaceholderText('تصفية بالاسم…'), 'zzz');
    await waitFor(() => expect(screen.getByText('لم يتم العثور على الحيوان')).toBeOnTheScreen(), {
      timeout: 5000,
      interval: 60,
    });
  }, 15000);

  it('tapping a card navigates to the organization animal detail', async () => {
    list.mockResolvedValue({
      items: [grant()],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<OrganizationAnimalsScreen />);
    await waitFor(() => expect(screen.getByText('لولو')).toBeOnTheScreen());
    fireEvent.press(screen.getByRole('button', { name: /لولو/ }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/organizations/o1/animals/a1');
  });

  it('pull-to-refresh re-fetches the list', async () => {
    list.mockResolvedValue({
      items: [grant()],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders(<OrganizationAnimalsScreen />);
    await waitFor(() => expect(screen.getByText('لولو')).toBeOnTheScreen());
    list.mockClear();

    const flatList = screen.UNSAFE_getByType(FlatList);
    flatList.props.refreshControl.props.onRefresh();
    await waitFor(() => expect(list).toHaveBeenCalledWith('o1', 1, 20));
  });
});
