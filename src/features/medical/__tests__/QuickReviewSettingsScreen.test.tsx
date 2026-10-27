import { TextInput } from 'react-native';

import { useAuthStore } from '@/features/auth/store';
import { clinicDashboardApi } from '@/features/clinicDashboard/api';
import { organizationsApi } from '@/features/organizations/api';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, setSearchParams } from '@/test-utils/routerMock';

import { clinicCareApi } from '../api';
import QuickReviewSettingsScreen from '../screens/QuickReviewSettingsScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

function clinic(over: Record<string, unknown> = {}) {
  return {
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
    ...over,
  } as never;
}

describe('QuickReviewSettingsScreen — the Add Quick Examination Card button', () => {
  const getOrg = jest.spyOn(organizationsApi, 'get');
  const getSummary = jest.spyOn(clinicDashboardApi, 'getSummary');
  const list = jest.spyOn(clinicCareApi, 'listTemplates');
  const create = jest.spyOn(clinicCareApi, 'createTemplate');

  beforeEach(() => {
    resetRouterMock();
    setSearchParams({ organizationId: 'o1' });
    useAuthStore.setState({ session: null });
    getOrg.mockReset().mockResolvedValue(clinic());
    // The dashboard summary is unavailable (deep link / failed load) — the
    // button must not depend on it alone.
    getSummary.mockReset().mockRejectedValue(new Error('offline'));
    list.mockReset().mockResolvedValue([]);
    create.mockReset().mockResolvedValue({
      id: 't1',
      organizationId: 'o1',
      name: 'فحص عام سريع',
      templateType: 'GENERAL',
      defaultDiagnosis: null,
      defaultTreatment: null,
      defaultNotes: null,
      intervalDays: null,
      createdAt: '',
      updatedAt: '',
    });
  });
  afterAll(() => jest.restoreAllMocks());

  it('the owner sees the button and can create a card from it', async () => {
    renderWithProviders(<QuickReviewSettingsScreen />);
    const add = await screen.findAllByRole('button', { name: 'إضافة بطاقة فحص سريع' });
    // Body button (and the header icon / empty-state action).
    fireEvent.press(add[0]!);
    await waitFor(() => expect(screen.getByText('قالب جديد')).toBeOnTheScreen());
    // The first input of the sheet is the card name.
    fireEvent.changeText(screen.UNSAFE_getAllByType(TextInput)[0]!, 'فحص عام سريع');
    fireEvent.press(screen.getByRole('button', { name: 'حفظ القالب' }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        'o1',
        expect.objectContaining({ name: 'فحص عام سريع', templateType: 'GENERAL' }),
      ),
    );
  });

  it('a member without organization.update sees the cards read-only, no add button', async () => {
    getOrg.mockResolvedValue(
      clinic({
        myRole: 'VETERINARIAN',
        myPermissions: ['organization.read', 'medical_record.read'],
      }),
    );
    renderWithProviders(<QuickReviewSettingsScreen />);
    await waitFor(() =>
      expect(
        screen.getByText('يمكنك استخدام القوالب فقط؛ إدارتها لمالك العيادة.'),
      ).toBeOnTheScreen(),
    );
    expect(screen.queryByRole('button', { name: 'إضافة بطاقة فحص سريع' })).toBeNull();
  });
});
