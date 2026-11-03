import { Linking } from 'react-native';

import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { NotificationCard } from '../components/NotificationCard';
import { notificationVideoUrl } from '../constants';
import type { AppNotification } from '../types';

const base: AppNotification = {
  id: 'n1',
  type: 'ORGANIZATION_APPROVED',
  title: 'تمت الموافقة على مؤسستك',
  body: 'يمكنك الآن إدارة المؤسسة.',
  data: { videoLinkKey: 'CLINIC_APPROVED', videoUrl: 'https://youtu.be/clinic' },
  actorUserId: null,
  entityType: 'ORGANIZATION',
  entityId: 'o1',
  read: false,
  readAt: null,
  createdAt: '2026-11-03T09:00:00.000Z',
  source: { kind: 'SYSTEM' },
};

describe('acceptance notification video link', () => {
  it('only http(s) video URLs are exposed', () => {
    expect(notificationVideoUrl(base)).toBe('https://youtu.be/clinic');
    expect(notificationVideoUrl({ data: { videoUrl: 'javascript:alert(1)' } })).toBeNull();
    expect(notificationVideoUrl({ data: { videoLinkKey: 'CLINIC_APPROVED' } })).toBeNull();
  });

  it('the card shows "مشاهدة الفيديو", opens the link and reports it — without opening the row', () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const onPress = jest.fn();
    const onOpenVideo = jest.fn();
    renderWithProviders(
      <NotificationCard notification={base} onPress={onPress} onOpenVideo={onOpenVideo} />,
    );

    fireEvent.press(screen.getByRole('link', { name: 'مشاهدة الفيديو' }));
    expect(openURL).toHaveBeenCalledWith('https://youtu.be/clinic');
    expect(onOpenVideo).toHaveBeenCalled();
    expect(onPress).not.toHaveBeenCalled();
    openURL.mockRestore();
  });

  it('no video button when the admin has not set a link', () => {
    renderWithProviders(<NotificationCard notification={{ ...base, data: {} }} />);
    expect(screen.queryByText('مشاهدة الفيديو')).toBeNull();
  });
});
