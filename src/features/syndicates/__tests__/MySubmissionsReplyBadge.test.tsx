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

  it('shows each tab’s new-reply count and clears only the open tab', async () => {
    jest
      .spyOn(syndicatesApi, 'listMySubmissions')
      .mockImplementation(
        async ({ kind }) => page(kind === 'REQUEST' ? [] : [submission({})]) as never,
      );
    const unseen = jest
      .spyOn(notificationsApi, 'syndicateRepliesUnseen')
      .mockResolvedValueOnce({ inquiries: 2, requests: 1, total: 3 })
      .mockResolvedValue({ inquiries: 0, requests: 1, total: 1 });
    const seen = jest
      .spyOn(notificationsApi, 'markSyndicateRepliesSeen')
      .mockResolvedValue({ updated: 2 });

    renderWithProviders(<MySyndicateSubmissionsScreen />);

    await waitFor(() => expect(seen).toHaveBeenCalledWith('INQUIRY'));
    expect(seen).not.toHaveBeenCalledWith('REQUEST');
    // After clearing, the inquiries tab loses its count; requests keeps (1).
    expect(await screen.findByText('طلباتي (1)')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('استفساراتي')).toBeTruthy());
    expect(unseen).toHaveBeenCalledTimes(2);

    fireEvent.press(screen.getByText('طلباتي (1)'));
    await waitFor(() => expect(seen).toHaveBeenCalledWith('REQUEST'));
  });
});
