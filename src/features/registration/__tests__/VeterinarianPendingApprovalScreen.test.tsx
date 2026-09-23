import { initI18n } from '@/i18n';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock } from '@/test-utils/routerMock';

import VeterinarianPendingApprovalScreen from '../screens/VeterinarianPendingApprovalScreen';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const mockRefreshSession = jest.fn(async () => undefined);
const mockLogout = jest.fn(async () => undefined);
let mockVetStatus: 'NOT_APPLIED' | 'PENDING' | 'REJECTED' = 'PENDING';
let mockReason: string | null = null;

jest.mock('@/hooks', () => ({
  ...jest.requireActual('@/hooks'),
  useAuth: () => ({
    session: { veterinarian: { status: mockVetStatus, approved: false } },
    refreshSession: mockRefreshSession,
    logout: mockLogout,
    requiresVeterinarianApproval: true,
  }),
}));

jest.mock('@/features/veterinarian', () => ({
  useVeterinarianApplicationStatus: () => ({
    data: { veterinarianStatus: mockVetStatus, application: { decisionReason: mockReason } },
    refetch: jest.fn(async () => undefined),
  }),
}));

beforeAll(() => initI18n('ar'));
beforeEach(() => {
  resetRouterMock();
  jest.clearAllMocks();
  mockVetStatus = 'PENDING';
  mockReason = null;
});

describe('VeterinarianPendingApprovalScreen', () => {
  it('PENDING → explains the review and offers only "check status" + sign out', async () => {
    renderWithProviders(<VeterinarianPendingApprovalScreen />);
    expect(screen.getByText('طلبك قيد المراجعة')).toBeTruthy();
    expect(screen.getByText('يرجى انتظار موافقة الإدارة.')).toBeTruthy();
    expect(screen.getByText('ستتاح لك جميع ميزات التطبيق فور الموافقة.')).toBeTruthy();
    expect(screen.queryByText('إعادة تقديم الطلب')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'تحديث حالة الطلب' }));
    await waitFor(() => expect(mockRefreshSession).toHaveBeenCalled());

    fireEvent.press(screen.getByRole('button', { name: 'تسجيل الخروج' }));
    await waitFor(() => expect(mockLogout).toHaveBeenCalled());
  });

  it('REJECTED → shows the reason and a re-apply link to /veterinarian/apply', () => {
    mockVetStatus = 'REJECTED';
    mockReason = 'الترخيص غير واضح';
    renderWithProviders(<VeterinarianPendingApprovalScreen />);
    expect(screen.getByText('لم تتم الموافقة على طلبك')).toBeTruthy();
    expect(screen.getByText('الترخيص غير واضح')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'إعادة تقديم الطلب' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/veterinarian/apply');
  });

  it('NOT_APPLIED → prompts to finish the application', () => {
    mockVetStatus = 'NOT_APPLIED';
    renderWithProviders(<VeterinarianPendingApprovalScreen />);
    expect(screen.getByText('أكمل طلب التسجيل')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'إكمال الطلب' }));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/veterinarian/apply');
  });
});
