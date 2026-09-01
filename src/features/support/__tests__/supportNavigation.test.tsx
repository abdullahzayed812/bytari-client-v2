import { Routes } from '@/constants/routes';
import { useAuthStore } from '@/features/auth/store';
import { petsApi } from '@/features/pets';
import { renderWithProviders, screen, within } from '@/test-utils/render';
import { resetRouterMock, setSearchParams } from '@/test-utils/routerMock';

import HomeScreen from '@/features/home/screens/HomeScreen';
import VeterinarianHomeScreen from '@/features/veterinarian/screens/VeterinarianHomeScreen';

import { SUPPORT_KIND_META, kindFromSlug, kindSlug, threadRoom } from '../constants';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function seedPlain() {
  const user = {
    id: 'u1',
    email: 'u@x.c',
    firstName: 'ر',
    lastName: 'ز',
    phone: null,
    status: 'ACTIVE' as const,
    veterinarianStatus: 'NOT_APPLIED' as const,
    createdAt: '',
    updatedAt: '',
  };
  useAuthStore.setState({
    user,
    status: 'authenticated',
    session: {
      user,
      roles: ['PET_OWNER'],
      permissions: [],
      isAdmin: false,
      supervisorDomains: [],
      veterinarian: { status: 'NOT_APPLIED', approved: false },
    },
  });
}

beforeEach(() => {
  resetRouterMock();
  setSearchParams({});
  seedPlain();
  jest.spyOn(petsApi, 'list').mockResolvedValue({
    items: [],
    meta: { page: 1, pageSize: 3, total: 0, totalPages: 1 },
  });
});
afterEach(() => jest.restoreAllMocks());
afterAll(() => useAuthStore.setState({ session: null, user: null, status: 'unauthenticated' }));

describe('support route builders', () => {
  it('are absolute, deep-link-safe paths', () => {
    expect(Routes.support('consultations')).toBe('/(app)/support/consultations');
    expect(Routes.support('inquiries')).toBe('/(app)/support/inquiries');
    expect(Routes.supportCreate('consultations')).toBe('/(app)/support/consultations/create');
    expect(Routes.supportManage('inquiries')).toBe('/(app)/support/inquiries/manage');
    expect(Routes.supportThread('consultations', 'c1')).toBe('/(app)/support/consultations/c1');
  });
});

describe('kind helpers', () => {
  it('map slug ⇄ kind and build the realtime room string', () => {
    expect(kindFromSlug('consultations')).toBe('CONSULTATION');
    expect(kindFromSlug('inquiries')).toBe('INQUIRY');
    expect(kindFromSlug('bogus')).toBeUndefined();
    expect(kindSlug('CONSULTATION')).toBe('consultations');
    expect(threadRoom('CONSULTATION', 'c1')).toBe('consultation:c1');
    expect(threadRoom('INQUIRY', 'i1')).toBe('inquiry:i1');
  });

  it('only APPROVED vets may create an inquiry; anyone may create a consultation', () => {
    expect(SUPPORT_KIND_META.CONSULTATION.createRequiresApprovedVet).toBe(false);
    expect(SUPPORT_KIND_META.INQUIRY.createRequiresApprovedVet).toBe(true);
  });
});

describe('Pet Owner Home — consultation CTA + previous consultations', () => {
  it('renders the "send a consultation" CTA and the previous-consultations section', async () => {
    renderWithProviders(<HomeScreen />);
    expect(await screen.findByText('أرسل استشارتك وسنجيبك فوراً')).toBeOnTheScreen();
    expect(await screen.findByText('استشاراتك السابقة')).toBeOnTheScreen();
  });
});

describe('Veterinarian Home — Phase 13 entry', () => {
  it('renders the Consultations & Inquiries section for a vet-mode user', async () => {
    const view = renderWithProviders(<VeterinarianHomeScreen />);
    expect(await within(view.UNSAFE_root).findByText('الاستشارات والاستفسارات')).toBeOnTheScreen();
    // no management card without a permission / supervisor domain / admin
    expect(view.queryByText('إدارة الاستشارات')).toBeNull();
  });
});
