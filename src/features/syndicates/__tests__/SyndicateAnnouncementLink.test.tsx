import { Linking } from 'react-native';

import { fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';
import { setSearchParams } from '@/test-utils/routerMock';

import { syndicatesApi } from '../api/syndicatesApi';
import SyndicateAnnouncementDetailsScreen from '../screens/SyndicateAnnouncementDetailsScreen';
import type { SyndicateAnnouncement } from '../types';

jest.mock('expo-router', () => require('@/test-utils/routerMock').expoRouter);

const base: SyndicateAnnouncement = {
  id: 'an1',
  organizationId: 's1',
  syndicateName: 'نقابة',
  type: 'ANNOUNCEMENT',
  title: 'دورة جديدة',
  body: 'التفاصيل على الموقع',
  imageUrl: null,
  linkUrl: 'https://example.org/course?id=1',
  publishedAt: '2026-10-11T10:00:00.000Z',
};

describe('Syndicate announcement — external link', () => {
  const open = jest.spyOn(Linking, 'openURL');
  beforeEach(() => {
    open.mockReset().mockResolvedValue(true);
    setSearchParams({ id: 'an1' });
  });

  it('shows the link and opens it in the browser', async () => {
    jest.spyOn(syndicatesApi, 'getAnnouncement').mockResolvedValue(base);
    renderWithProviders(<SyndicateAnnouncementDetailsScreen />);
    expect(await screen.findByText('https://example.org/course?id=1')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: /https:\/\/example\.org\/course\?id=1/ }));
    await waitFor(() => expect(open).toHaveBeenCalledWith('https://example.org/course?id=1'));
  });

  it('never renders an unsafe stored value as a link', async () => {
    jest
      .spyOn(syndicatesApi, 'getAnnouncement')
      .mockResolvedValue({ ...base, linkUrl: 'javascript:alert(1)' });
    renderWithProviders(<SyndicateAnnouncementDetailsScreen />);
    expect(await screen.findByText('دورة جديدة')).toBeTruthy();
    expect(screen.queryByText(/javascript:/)).toBeNull();
    expect(screen.queryByText('فتح الرابط')).toBeNull();
  });

  it('shows nothing extra without a link', async () => {
    jest.spyOn(syndicatesApi, 'getAnnouncement').mockResolvedValue({ ...base, linkUrl: null });
    renderWithProviders(<SyndicateAnnouncementDetailsScreen />);
    expect(await screen.findByText('دورة جديدة')).toBeTruthy();
    expect(screen.queryByText('فتح الرابط')).toBeNull();
  });
});
