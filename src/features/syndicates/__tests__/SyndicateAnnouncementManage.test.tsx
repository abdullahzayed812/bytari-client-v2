import { act, fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { resetRouterMock, routerMock, setSearchParams } from '@/test-utils/routerMock';

import { syndicatesApi } from '../api/syndicatesApi';
import CreateSyndicateAnnouncementScreen from '../screens/CreateSyndicateAnnouncementScreen';
import SyndicateAnnouncementDetailsScreen from '../screens/SyndicateAnnouncementDetailsScreen';
import type { MySyndicateAccess, SyndicateAnnouncement } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const ANN: SyndicateAnnouncement = {
  id: 'an1',
  organizationId: 's1',
  syndicateName: 'نقابة أ',
  type: 'ANNOUNCEMENT',
  title: 'اجتماع الهيئة',
  body: 'تفاصيل الاجتماع',
  imageUrl: null,
  linkUrl: null,
  publishedAt: '2026-11-01T10:00:00.000Z',
};

const NO_ACCESS: MySyndicateAccess = {
  isAdmin: false,
  isOwner: false,
  canManageProfile: false,
  canManageAnnouncements: false,
  canReadSubmissions: false,
  canRespondSubmissions: false,
  canReadMembers: false,
  canManageMembers: false,
  canMessageMembers: false,
  canDelete: false,
  isRegistered: false,
};

const getAnnouncement = jest.spyOn(syndicatesApi, 'getAnnouncement');
const getMyAccess = jest.spyOn(syndicatesApi, 'getMyAccess');

beforeEach(() => {
  resetRouterMock();
  getAnnouncement.mockReset().mockResolvedValue(ANN);
  getMyAccess.mockReset().mockResolvedValue(NO_ACCESS);
});

afterAll(() => jest.restoreAllMocks());

describe('announcement details — edit / delete actions', () => {
  beforeEach(() => setSearchParams({ id: 'an1' }));

  it('are hidden for a viewer without announcement management on that syndicate', async () => {
    renderWithProviders(<SyndicateAnnouncementDetailsScreen />);
    expect(await screen.findByText('اجتماع الهيئة')).toBeOnTheScreen();
    await waitFor(() => expect(getMyAccess).toHaveBeenCalledWith('s1'));
    expect(screen.queryByText('تعديل الإعلان')).toBeNull();
    expect(screen.queryByText('حذف الإعلان')).toBeNull();
  });

  it('a syndicate supervisor (or admin) can open the editor and delete after confirming', async () => {
    getMyAccess.mockResolvedValue({ ...NO_ACCESS, canManageAnnouncements: true });
    const del = jest.spyOn(syndicatesApi, 'deleteAnnouncement').mockResolvedValue(undefined);

    renderWithProviders(<SyndicateAnnouncementDetailsScreen />);
    fireEvent.press(await screen.findByText('تعديل الإعلان'));
    expect(routerMock.push).toHaveBeenCalledWith('/(app)/syndicates/s1/announcements/an1/edit');

    fireEvent.press(screen.getByText('حذف الإعلان'));
    expect(del).not.toHaveBeenCalled();
    expect(await screen.findByText('سيتم حذف هذا الإعلان نهائياً.')).toBeOnTheScreen();
    const confirm = screen.getAllByText('حذف الإعلان');
    await act(async () => {
      fireEvent.press(confirm[confirm.length - 1]!);
    });

    await waitFor(() => expect(del).toHaveBeenCalledWith('s1', 'an1'));
    await waitFor(() => expect(routerMock.back).toHaveBeenCalled());
  });
});

describe('announcement editor', () => {
  it('prefills the announcement and saves only through its own syndicate', async () => {
    setSearchParams({ organizationId: 's1', announcementId: 'an1' });
    getMyAccess.mockResolvedValue({ ...NO_ACCESS, isAdmin: true, canManageAnnouncements: true });
    const update = jest
      .spyOn(syndicatesApi, 'updateAnnouncement')
      .mockResolvedValue({ ...ANN, title: 'اجتماع الهيئة المعدّل' });

    renderWithProviders(<CreateSyndicateAnnouncementScreen />);
    const title = await screen.findByDisplayValue('اجتماع الهيئة');
    fireEvent.changeText(title, 'اجتماع الهيئة المعدّل');
    await act(async () => {
      fireEvent.press(screen.getByText('حفظ التغييرات'));
    });

    await waitFor(() =>
      expect(update).toHaveBeenCalledWith('s1', 'an1', {
        type: 'ANNOUNCEMENT',
        title: 'اجتماع الهيئة المعدّل',
        body: 'تفاصيل الاجتماع',
        linkUrl: null,
      }),
    );
    await waitFor(() => expect(routerMock.back).toHaveBeenCalled());
  });

  it('refuses an announcement of another syndicate or a caller without access', async () => {
    const update = jest.spyOn(syndicatesApi, 'updateAnnouncement').mockClear();
    // Announcement belongs to s1, route claims s2 (where the caller is a supervisor).
    setSearchParams({ organizationId: 's2', announcementId: 'an1' });
    getMyAccess.mockResolvedValue({ ...NO_ACCESS, canManageAnnouncements: true });
    const { unmount } = renderWithProviders(<CreateSyndicateAnnouncementScreen />);
    expect(await screen.findByText('الإعلان غير متاح')).toBeOnTheScreen();
    expect(screen.queryByText('حفظ التغييرات')).toBeNull();
    unmount();

    setSearchParams({ organizationId: 's1', announcementId: 'an1' });
    getMyAccess.mockResolvedValue(NO_ACCESS);
    renderWithProviders(<CreateSyndicateAnnouncementScreen />);
    expect(await screen.findByText('الإعلان غير متاح')).toBeOnTheScreen();
    expect(update).not.toHaveBeenCalled();
  });
});
