import type { TFunction } from 'i18next';

import { ar } from '@/i18n/locales/ar';
import { en } from '@/i18n/locales/en';

import { localizedNotificationText, notificationHref } from '../constants';
import { NOTIFICATION_TYPES, type AppNotification } from '../types';

/** A push `data` payload: `{ type, …ids, notificationId }` — no entityType column. */
function push(type: string, data: Record<string, string> = {}) {
  return {
    type: type as AppNotification['type'],
    entityType: null,
    entityId: null,
    data: { type, notificationId: 'n1', ...data },
  };
}

describe('notificationHref — post-Phase-15 types (push payloads)', () => {
  it.each([
    ['VETERINARIAN_APPLICATION_SUBMITTED', {}, '/(app)/admin/veterinarians'],
    ['VETERINARIAN_APPROVED', {}, '/(app)/veterinarian'],
    [
      'ORGANIZATION_SUBMITTED',
      { organizationId: 'o1', organizationType: 'CLINIC' },
      '/(app)/admin/organizations/o1',
    ],
    [
      'SUBSCRIPTION_RENEWAL_REQUESTED',
      { organizationId: 'f1', organizationType: 'FARM' },
      '/(app)/admin/farms/f1',
    ],
    [
      'SUBSCRIPTION_EXPIRING',
      { organizationId: 'f1', organizationType: 'FARM' },
      '/(app)/poultry/f1/subscription-renewal',
    ],
    ['FARM_APPOINTMENT_CREATED', { organizationId: 'f2' }, '/(app)/organizations/f2'],
    ['TRADER_APPROVED', {}, '/(app)/poultry/market-hub'],
    [
      'PUBLICATION_SUBMITTED',
      { publicationId: 'p1', kind: 'LOST' },
      '/(app)/admin/animal-publications',
    ],
    [
      'PUBLICATION_APPROVED',
      { publicationId: 'p1', kind: 'ADOPTION' },
      '/(app)/publications/adoption/p1',
    ],
    ['PUBLICATION_SIGHTING_REPORTED', { publicationId: 'p2' }, '/(app)/publications/lost/p2'],
    ['VET_COURSE_CAPACITY_REACHED', { entityId: 'c1' }, '/(app)/vet-courses/c1'],
    ['VET_JOB_APPLICATION_RECEIVED', { jobOfferId: 'j1' }, '/(app)/vet-jobs/offers/j1/applicants'],
    ['VET_JOB_APPLICATION_ACCEPTED', { conversationId: 'cv1' }, '/(app)/chat/cv1'],
    [
      'STORE_ORDER_STATUS_CHANGED',
      { orderId: 'o9', store: 'PET_OWNER_STORE', status: 'SHIPPED' },
      '/(app)/pet-owner-store/orders/o9',
    ],
    [
      'STORE_ORDER_PLACED',
      { orderId: 'o9', store: 'VETERINARIAN_STORE' },
      '/(app)/admin/veterinarian-store/orders/o9',
    ],
    ['SUPPORT_MESSAGE_RECEIVED', { supportId: 's1' }, '/(app)/support/support-messages/s1'],
    [
      'CLINIC_APPOINTMENT_CANCELLED',
      { appointmentId: 'a1', organizationId: 'cl1', audience: 'OWNER' },
      '/(app)/clinic-appointments/a1',
    ],
    [
      'CLINIC_APPOINTMENT_CANCELLED',
      { appointmentId: 'a1', organizationId: 'cl1', audience: 'CLINIC' },
      '/(app)/organizations/cl1',
    ],
    [
      'SYNDICATE_ANNOUNCEMENT_PUBLISHED',
      { announcementId: 'an1' },
      '/(app)/syndicates/announcements/an1',
    ],
  ])('%s → %s', (type, data, href) => {
    expect(notificationHref(push(type, data))).toBe(href);
  });

  it('an announcement with no destination stays in the inbox (null)', () => {
    expect(notificationHref(push('ADMIN_ANNOUNCEMENT'))).toBeNull();
  });
});

describe('localizedNotificationText', () => {
  const t = ((key: string, opts?: { defaultValue?: string }) =>
    key === 'types.VETERINARIAN_APPROVED.title'
      ? 'Your account is approved'
      : key === 'types.VETERINARIAN_APPROVED.body'
        ? 'Your veterinarian application has been approved.'
        : (opts?.defaultValue ?? key)) as unknown as TFunction<'notifications'>;
  const stored = { type: 'VETERINARIAN_APPROVED' as const, title: 'عنوان', body: 'نص' };

  it('Arabic (default language) shows the stored server text', () => {
    expect(localizedNotificationText(stored, t, 'ar')).toEqual({ title: 'عنوان', body: 'نص' });
  });

  it('another language re-renders system types from the catalogue', () => {
    expect(localizedNotificationText(stored, t, 'en')).toEqual({
      title: 'Your account is approved',
      body: 'Your veterinarian application has been approved.',
    });
  });

  it('author-written types are never re-localized', () => {
    const broadcast = { type: 'ORGANIZATION_BROADCAST' as const, title: 'Sale!', body: '50% off' };
    expect(localizedNotificationText(broadcast, t, 'en')).toEqual({
      title: 'Sale!',
      body: '50% off',
    });
  });
});

describe('notification i18n catalogue', () => {
  it('has Arabic and English copy for every backend notification type', () => {
    for (const type of NOTIFICATION_TYPES) {
      expect(ar.notifications.types[type].title).toBeTruthy();
      expect(en.notifications.types[type].title).toBeTruthy();
      expect(en.notifications.types[type].body).toBeTruthy();
    }
  });
});
