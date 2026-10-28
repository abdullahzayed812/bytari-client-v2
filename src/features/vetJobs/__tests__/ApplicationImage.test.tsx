import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';
import { resetRouterMock, setSearchParams } from '@/test-utils/routerMock';

import { vetJobsApi } from '../api';
import VetJobApplicantsScreen from '../screens/VetJobApplicantsScreen';
import type { VetJobApplication } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const application = (over: Partial<VetJobApplication>): VetJobApplication => ({
  id: 'a1',
  jobOfferId: 'o1',
  applicant: { id: 'u1', firstName: 'سارة', lastName: 'علي' },
  fullName: 'د. سارة علي',
  phone: '07700000000',
  email: null,
  specialty: null,
  experienceYears: null,
  qualifications: null,
  coverNote: null,
  cvUrl: null,
  photoUrl: null,
  status: 'PENDING',
  conversationId: null,
  createdAt: '2026-10-20T10:00:00.000Z',
  updatedAt: '2026-10-20T10:00:00.000Z',
  ...over,
});

describe('Job applicants — the image attached to an application', () => {
  beforeEach(() => {
    resetRouterMock();
    setSearchParams({ offerId: 'o1' });
  });
  afterEach(() => jest.restoreAllMocks());

  it('shows the applicant’s attached image (tap to enlarge); an application without one gets the placeholder', async () => {
    jest.spyOn(vetJobsApi, 'listOfferApplications').mockResolvedValue({
      items: [
        application({ id: 'a1', photoUrl: 'https://cdn.example/vet-job-attachments/a1.png' }),
        application({ id: 'a2', fullName: 'د. أحمد حسن', photoUrl: null }),
      ],
      meta: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    });
    renderWithProviders(<VetJobApplicantsScreen />);

    expect(await screen.findByText('د. أحمد حسن')).toBeOnTheScreen();
    const viewButtons = screen.getAllByRole('imagebutton', { name: 'عرض الصورة المرفقة بالطلب' });
    // Only the application WITH an image is viewable.
    expect(viewButtons).toHaveLength(1);
    fireEvent.press(viewButtons[0]!);
  });
});
