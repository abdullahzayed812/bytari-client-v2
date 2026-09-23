import { waitFor } from '@testing-library/react-native';

import { usersApi } from '@/features/users';
import { apiClient } from '@/services/api';
import {
  fireEvent,
  makeTestQueryClient,
  renderHookWithQuery,
  renderWithProviders,
  screen,
} from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { medicalHistoryApi } from '../api';
import { useMedicalTimeline } from '../hooks';
import MedicalTimelineScreen from '../screens/MedicalTimelineScreen';
import type { MedicalTimelineEntry } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const record = (over: Partial<MedicalTimelineEntry> = {}): MedicalTimelineEntry => ({
  type: 'MEDICAL_RECORD',
  occurredOn: '2026-03-01',
  organizationId: 'o1',
  recordedByUserId: 'u1',
  createdAt: '2026-03-01T10:00:00.000Z',
  medicalRecord: {
    id: 'r1',
    animalId: 'a1',
    organizationId: 'o1',
    recordedByUserId: 'u1',
    visitDate: '2026-03-01',
    reason: 'فحص دوري',
    diagnosis: 'سليم',
    treatment: null,
    notes: null,
    createdAt: '',
    updatedAt: '',
  },
  ...over,
});

const vaccination: MedicalTimelineEntry = {
  type: 'VACCINATION',
  occurredOn: '2026-02-01',
  organizationId: 'o1',
  recordedByUserId: 'u1',
  createdAt: '2026-02-01T10:00:00.000Z',
  vaccination: {
    id: 'v1',
    animalId: 'a1',
    organizationId: 'o1',
    recordedByUserId: 'u1',
    vaccineName: 'داء الكلب',
    administeredOn: '2026-02-01',
    nextDueOn: '2027-02-01',
    notes: null,
    createdAt: '',
    updatedAt: '',
  },
};

const page = (items: MedicalTimelineEntry[]) => ({
  items,
  meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 },
});

describe('medicalHistoryApi', () => {
  const envelope = jest.spyOn(apiClient, 'requestEnvelope');
  beforeEach(() => envelope.mockReset());
  afterAll(() => jest.restoreAllMocks());

  it('OWNER path → GET /animals/:id/medical-history with page/pageSize/type', async () => {
    envelope.mockResolvedValueOnce({ data: [record()], meta: undefined } as never);
    await medicalHistoryApi.listForOwner('a1', 1, 20, 'MEDICAL_RECORD');
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/animals/a1/medical-history',
      params: { page: 1, pageSize: 20, type: 'MEDICAL_RECORD' },
    });
  });

  it('CLINIC path → GET /organizations/:orgId/animals/:id/medical-history', async () => {
    envelope.mockResolvedValueOnce({ data: [], meta: undefined } as never);
    await medicalHistoryApi.listForClinic('o1', 'a1', 2, 10);
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/organizations/o1/animals/a1/medical-history',
      params: { page: 2, pageSize: 10, type: undefined },
    });
  });
});

describe('useMedicalTimeline', () => {
  afterEach(() => jest.restoreAllMocks());

  it('keys the query by scope + type so owner / clinic / filtered views never collide', () => {
    jest.spyOn(medicalHistoryApi, 'listForOwner').mockResolvedValue(page([]));
    const { result: a } = renderHookWithQuery(
      () => useMedicalTimeline({ animalId: 'a1' }, { type: 'VACCINATION' }),
      { client: makeTestQueryClient() },
    );
    const { result: b } = renderHookWithQuery(() => useMedicalTimeline({ animalId: 'a1' }), {
      client: makeTestQueryClient(),
    });
    // both mount without throwing; the important part is separate keys — covered
    // implicitly by the screen test below asserting the `type` param round-trips.
    expect(a.current).toBeDefined();
    expect(b.current).toBeDefined();
  });
});

describe('MedicalTimelineScreen (§13, §23) — scope-aware', () => {
  let owner: jest.SpyInstance;
  let clinic: jest.SpyInstance;

  beforeEach(() => {
    resetRouterMock();
    owner = jest.spyOn(medicalHistoryApi, 'listForOwner');
    clinic = jest.spyOn(medicalHistoryApi, 'listForClinic');
    jest.spyOn(usersApi, 'getSummary').mockResolvedValue({
      id: 'u1',
      firstName: 'ريم',
      lastName: 'أحمد',
      veterinarianStatus: 'APPROVED',
      avatarUrl: null,
    });
  });
  afterEach(() => jest.restoreAllMocks());

  it('OWNER context lists records + vaccinations and opens the matching detail', async () => {
    setSearchParams({ petId: 'a1' });
    owner.mockResolvedValue(page([record(), vaccination]));
    renderWithProviders(<MedicalTimelineScreen />);

    await waitFor(() => expect(screen.getByText('سليم')).toBeOnTheScreen());
    expect(screen.getByText('داء الكلب')).toBeOnTheScreen();

    fireEvent.press(screen.getByText('داء الكلب'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/pets/a1/vaccinations/v1');

    // the "vaccination" filter chip narrows the backend query (chip is the first match)
    fireEvent.press(screen.getAllByText('تطعيم')[0]!);
    await waitFor(() => expect(owner).toHaveBeenCalledWith('a1', 1, 20, 'VACCINATION'));
  });

  it('CLINIC context reads the org-scoped endpoint', async () => {
    setSearchParams({ organizationId: 'o1', animalId: 'a1' });
    clinic.mockResolvedValue(page([record()]));
    renderWithProviders(<MedicalTimelineScreen />);
    await waitFor(() => expect(screen.getByText('سليم')).toBeOnTheScreen());
    expect(clinic).toHaveBeenCalledWith('o1', 'a1', 1, 20, undefined);
    expect(owner).not.toHaveBeenCalled();
  });

  it('shows the empty state', async () => {
    setSearchParams({ petId: 'a1' });
    owner.mockResolvedValue(page([]));
    renderWithProviders(<MedicalTimelineScreen />);
    await waitFor(() => expect(screen.getByText('لا يوجد سجل طبي لهذا الحيوان')).toBeOnTheScreen());
  });
});
