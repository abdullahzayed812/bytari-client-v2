import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { NotificationCard } from '../components/NotificationCard';
import type { AppNotification } from '../types';

const base: AppNotification = {
  id: 'n1',
  type: 'ORGANIZATION_APPROVED',
  title: 'تمت الموافقة على مؤسستك',
  body: 'يمكنك الآن إدارة المؤسسة.',
  data: {},
  actorUserId: null,
  entityType: 'ORGANIZATION',
  entityId: 'o1',
  read: false,
  readAt: null,
  createdAt: '2026-08-28T09:00:00.000Z',
};

describe('NotificationCard', () => {
  it('renders backend title + body as plain text and fires onPress', () => {
    const onPress = jest.fn();
    renderWithProviders(<NotificationCard notification={base} onPress={onPress} />);
    expect(screen.getByText('تمت الموافقة على مؤسستك')).toBeOnTheScreen();
    expect(screen.getByText('يمكنك الآن إدارة المؤسسة.')).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalled();
  });

  it('announces unread vs read state to screen readers (not colour alone)', () => {
    const { rerender } = renderWithProviders(<NotificationCard notification={base} />);
    expect(screen.getByLabelText('إشعار غير مقروء: تمت الموافقة على مؤسستك')).toBeOnTheScreen();

    rerender(<NotificationCard notification={{ ...base, read: true }} />);
    expect(screen.getByLabelText('إشعار: تمت الموافقة على مؤسستك')).toBeOnTheScreen();
  });
});
