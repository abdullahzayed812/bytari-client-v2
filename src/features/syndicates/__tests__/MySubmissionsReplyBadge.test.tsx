import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock } from '@/test-utils/routerMock';
import { notificationsApi } from '@/features/notifications';

import { syndicatesApi } from '../api/syndicatesApi';
import MySyndicateSubmissionsScreen from '../screens/MySyndicateSubmissionsScreen';
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
  status: 'RESPONDED',
  responseText: 'راجع قسم الهوية.',
  respondedAt: '2026-10-28T10:00:00.000Z',
  createdAt: '2026-10-27T10:00:00.000Z',
  ...over,
});

const page = (items: SyndicateSubmission[]) => ({
  items,
  meta: { page: 1, pageSize: 20, total: items.length, totalPages: 1 },
});

describe('My requests & inquiries — new reply counters', () => {
  beforeEach(() => resetRouterMock());
  afterEach(() => jest.restoreAllMocks());

  it('marks only the unread replies shown (by id) and keeps their "new" chip for this visit', async () => {
    jest
      .spyOn(syndicatesApi, 'listMySubmissions')
      .mockImplementation(
        async ({ kind }) =>
          page(
            kind === 'REQUEST'
              ? []
              : [
                  submission({ id: 'sub1', isUnread: true }),
                  submission({ id: 'sub2', isUnread: false, message: 'سؤال قديم' }),
                ],
          ) as never,
      );
    const unseen = jest
      .spyOn(notificationsApi, 'syndicateRepliesUnseen')
      .mockResolvedValueOnce({ inquiries: 1, requests: 1, total: 2 })
      .mockResolvedValue({ inquiries: 0, requests: 1, total: 1 });
    const seen = jest
      .spyOn(syndicatesApi, 'markMySubmissionsSeen')
      .mockResolvedValue({ submissionIds: ['sub1'] });

    renderWithProviders(<MySyndicateSubmissionsScreen />);

    await waitFor(() => expect(seen).toHaveBeenCalledWith(['sub1']));
    expect(seen).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText('رد جديد')).toHaveLength(1);
    // The badge is refetched from the server: inquiries cleared, requests keeps (1).
    expect(await screen.findByText('طلباتي (1)')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('استفساراتي')).toBeTruthy());
    expect(unseen).toHaveBeenCalledTimes(2);

    // The requests tab has nothing unread loaded → nothing else is marked.
    fireEvent.press(screen.getByText('طلباتي (1)'));
    await waitFor(() => expect(screen.getByText('لا توجد طلبات')).toBeTruthy());
    expect(seen).toHaveBeenCalledTimes(1);
  });
});
