import { renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, setSearchParams } from '@/test-utils/routerMock';

import { syndicatesApi } from '../api/syndicatesApi';
import SyndicateSubmissionsScreen from '../screens/SyndicateSubmissionsScreen';
import type { SyndicateSubmission } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const submission = (over: Partial<SyndicateSubmission>): SyndicateSubmission => ({
  id: 'sub1',
  organizationId: 's1',
  syndicateName: 'نقابة أ',
  kind: 'INQUIRY',
  requestType: null,
  message: 'ما هي متطلبات تجديد الهوية؟',
  attachmentUrls: [],
  submittedBy: { id: 'u1', firstName: 'أحمد', lastName: 'علي' },
  status: 'PENDING',
  responseText: null,
  respondedAt: null,
  createdAt: '2026-10-27T10:00:00.000Z',
  ...over,
});

describe('Syndicate inquiries page (officer) — opening it reads the new rows shown', () => {
  beforeEach(() => {
    resetRouterMock();
    setSearchParams({ organizationId: 's1', kind: 'INQUIRY' });
  });
  afterEach(() => jest.restoreAllMocks());

  it('marks exactly the unread inquiries on screen, once, and badges them as new', async () => {
    const list = jest.spyOn(syndicatesApi, 'listSubmissions').mockResolvedValue({
      items: [
        submission({ id: 'sub1', isUnread: true }),
        submission({ id: 'sub2', isUnread: true, message: 'سؤال ثانٍ' }),
        submission({ id: 'sub3', isUnread: false, message: 'مقروء' }),
      ],
      meta: { page: 1, pageSize: 20, total: 3, totalPages: 1 },
    } as never);
    const seen = jest
      .spyOn(syndicatesApi, 'markSubmissionsSeen')
      .mockResolvedValue({ submissionIds: ['sub1', 'sub2'] });

    renderWithProviders(<SyndicateSubmissionsScreen />);

    await waitFor(() => expect(seen).toHaveBeenCalledWith('s1', ['sub1', 'sub2']));
    expect(list).toHaveBeenCalledWith('s1', expect.objectContaining({ kind: 'INQUIRY' }));
    expect(screen.getAllByText('جديد')).toHaveLength(2);
    expect(seen).toHaveBeenCalledTimes(1);
  });
});
