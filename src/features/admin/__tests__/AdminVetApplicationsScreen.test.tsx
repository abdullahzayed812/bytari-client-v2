import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';

import { adminApi } from '../api';
import AdminVetApplicationsScreen from '../screens/AdminVetApplicationsScreen';
import type { PendingVetApplication } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const listPendingVetApplications = jest.spyOn(adminApi, 'listPendingVetApplications');

const APPLICATION: PendingVetApplication = {
  id: 'app-1',
  userId: 'u-1',
  status: 'PENDING',
  subType: 'VETERINARIAN',
  note: 'خريج كلية الطب البيطري - جامعة بغداد',
  decidedBy: null,
  decidedAt: null,
  decisionReason: null,
  createdAt: '2026-09-20T10:00:00.000Z',
  updatedAt: '2026-09-20T10:00:00.000Z',
  user: {
    id: 'u-1',
    email: 'vet@example.test',
    firstName: 'سارة',
    lastName: 'علي',
    phone: '+9647700000000',
    specialization: 'جراحة',
    gender: 'FEMALE',
    country: 'EG',
    governorate: 'الجيزة',
    avatarUrl: null,
    status: 'ACTIVE',
    veterinarianStatus: 'PENDING',
    registrationType: 'VETERINARIAN',
    createdAt: '2026-09-19T10:00:00.000Z',
  },
  documents: [
    {
      kind: 'LICENSE_OR_ID',
      filename: 'licence.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1000,
      createdAt: '2026-09-20T10:00:00.000Z',
      downloadUrl: 'https://signed.example/licence.pdf',
    },
  ],
};

beforeEach(() => {
  listPendingVetApplications.mockReset().mockResolvedValue({
    items: [APPLICATION],
    meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
  });
});
afterAll(() => jest.restoreAllMocks());

describe('AdminVetApplicationsScreen', () => {
  it('opens the full applicant record (profile + application + documents + actions) on tap', async () => {
    renderWithProviders(<AdminVetApplicationsScreen />);
    await waitFor(() => expect(screen.getByText('سارة علي')).toBeOnTheScreen());

    fireEvent.press(screen.getByLabelText('عرض التفاصيل: سارة علي'));

    expect(await screen.findByText('بيانات مقدّم الطلب')).toBeOnTheScreen();
    for (const value of [
      'أنثى',
      'مصر',
      'الجيزة',
      'خريج كلية الطب البيطري - جامعة بغداد',
      'قيد المراجعة',
      'نشط',
      'طبيب بيطري',
    ]) {
      expect(screen.getAllByText(value).length).toBeGreaterThan(0);
    }
    // Restricted documents are listed (signed URL from the authorised projection).
    expect(screen.getAllByText(/licence\.pdf/).length).toBeGreaterThan(0);
  });
});
