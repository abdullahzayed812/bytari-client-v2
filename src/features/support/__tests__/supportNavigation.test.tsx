import { Routes } from '@/constants/routes';
import { useAuthStore } from '@/features/auth/store';
import { organizationsApi } from '@/features/organizations';
import { petsApi } from '@/features/pets';
import { renderWithProviders, screen } from '@/test-utils/render';
import { resetRouterMock, setSearchParams } from '@/test-utils/routerMock';

import HomeScreen from '@/features/home/screens/HomeScreen';
import VeterinarianHomeScreen from '@/features/veterinarian/screens/VeterinarianHomeScreen';

import { inquiryApi } from '../api';
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
    traderStatus: 'NOT_REGISTERED' as const,
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
      trader: { status: 'NOT_REGISTERED', approved: false },
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
  jest.spyOn(organizationsApi, 'discover').mockResolvedValue({
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
  it('a non-approved vet-mode user sees the approval status card, not the inquiry sections', async () => {
    renderWithProviders(<VeterinarianHomeScreen />);
    expect(await screen.findByText('حالة الاعتماد كطبيب بيطري')).toBeOnTheScreen();
    expect(screen.queryByText('أرسل استفسارك')).toBeNull();
  });

  it('an APPROVED vet-mode user sees the inquiry CTA and previous-inquiries section', async () => {
    useAuthStore.setState((s) => ({
      session: s.session && {
        ...s.session,
        user: { ...s.session.user, veterinarianStatus: 'APPROVED' },
        roles: ['PET_OWNER', 'VETERINARIAN'],
        veterinarian: { status: 'APPROVED', approved: true },
      },
    }));
    jest.spyOn(inquiryApi, 'listMine').mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 3, total: 0, totalPages: 1 },
    });

    renderWithProviders(<VeterinarianHomeScreen />);
    expect(await screen.findByText('أرسل استفسارك')).toBeOnTheScreen();
    expect(await screen.findByText('استفسارات سابقة')).toBeOnTheScreen();
  });
});
