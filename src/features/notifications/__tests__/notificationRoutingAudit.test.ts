import * as fs from 'fs';
import * as path from 'path';

import { notificationDestination, notificationHref } from '../constants';
import { NOTIFICATION_TYPES, type AppNotification } from '../types';

/**
 * Every notification type, with the ids the server attaches, must land on a
 * screen that exists in `app/` — either its related screen or the
 * notification's own details screen. Guards against a route helper pointing
 * at a file that was moved / never created.
 */
const APP_DIR = path.resolve(__dirname, '../../../../app');

/** Does an expo-router path (`/(app)/a/b`) resolve to a file under `app/`? */
function routeExists(href: string): boolean {
  const parts = href.split('?')[0]!.split('/').filter(Boolean);
  const isDynamic = (name: string) => /^\[[^.]+\]$/.test(name);
  const strip = (e: string) => e.replace(/\.tsx$/, '');

  const walk = (dir: string, rest: string[]): boolean => {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return false;
    const entries = fs.readdirSync(dir);
    if (rest.length === 0) return entries.includes('index.tsx');
    const [head, ...tail] = rest;
    for (const e of entries) {
      const full = path.join(dir, e);
      const isDir = fs.statSync(full).isDirectory();
      // groups like (tabs) are transparent
      if (isDir && /^\(.+\)$/.test(e) && e !== head && walk(full, rest)) return true;
      const name = strip(e);
      if (name === head || isDynamic(name)) {
        if (
          tail.length === 0 &&
          (e.endsWith('.tsx') || (isDir && fs.existsSync(path.join(full, 'index.tsx'))))
        )
          return true;
        if (isDir && walk(full, tail)) return true;
      }
    }
    return false;
  };
  return walk(APP_DIR, parts);
}

/** A representative payload with every id key any type reads. */
const DATA: Record<string, string> = {
  organizationId: 'o1',
  organizationType: 'CLINIC',
  appointmentId: 'ap1',
  farmSpecies: 'POULTRY',
  productId: 'p1',
  conversationId: 'c1',
  consultationId: 't1',
  inquiryId: 't2',
  supportId: 't3',
  entityId: 'e1',
  offerId: 'jo1',
  jobOfferId: 'jo1',
  orderId: 'or1',
  announcementId: 'an1',
  publicationId: 'pub1',
  kind: 'ADOPTION',
  animalId: 'a1',
};

function notification(type: string, data: Record<string, string>): AppNotification {
  return {
    id: 'n1',
    type: type as AppNotification['type'],
    title: 't',
    body: 'b',
    data: { type, ...data },
    actorUserId: null,
    entityType: null,
    entityId: 'e1',
    read: false,
    readAt: null,
    createdAt: '2026-11-03T00:00:00.000Z',
    source: { kind: 'SYSTEM' },
  };
}

describe('notification routing audit — every type opens an existing screen', () => {
  it('the route checker itself rejects a missing screen', () => {
    expect(routeExists('/(app)/does-not-exist')).toBe(false);
    expect(routeExists('/(app)/livestock/goat/o1/sections/appointments/ap1')).toBe(false);
    expect(routeExists('/(app)/livestock/sheep/o1/sections/appointments/ap1')).toBe(true);
  });

  it.each(NOTIFICATION_TYPES.map((t) => [t]))('%s', (type) => {
    for (const data of [DATA, {}]) {
      const dest = notificationDestination(notification(type, data));
      expect(routeExists(dest)).toBe(true);
    }
  });

  it('variants: seller vs customer store orders, clinic vs owner appointments, farm species', () => {
    const cases: [string, Record<string, string>][] = [
      ['STORE_ORDER_SUBMITTED', { ...DATA, audience: 'SELLER' }],
      ['STORE_ORDER_UPDATED', { ...DATA, audience: 'CUSTOMER' }],
      ['STORE_ORDER_PLACED', { ...DATA, store: 'PET_OWNER_STORE' }],
      ['STORE_ORDER_STATUS_CHANGED', { ...DATA, store: 'VETERINARIAN_STORE' }],
      ['CLINIC_APPOINTMENT_CONFIRMED', { ...DATA, audience: 'CLINIC' }],
      ['CLINIC_APPOINTMENT_CONFIRMED', { ...DATA, audience: 'OWNER' }],
      ['FARM_APPOINTMENT_DUE', { ...DATA, farmSpecies: 'SHEEP' }],
      ['FARM_APPOINTMENT_DUE', { ...DATA, farmSpecies: 'CATTLE' }],
      ['SUBSCRIPTION_EXPIRED', { ...DATA, organizationType: 'FARM' }],
      ['ORGANIZATION_BROADCAST', { ...DATA, audience: 'SYNDICATE_MEMBERS' }],
      ['CHAT_MESSAGE_RECEIVED', { ...DATA, chatRoomId: 'r1' }],
    ];
    for (const [type, data] of cases) {
      const dest = notificationDestination(notification(type, data));
      expect([type, routeExists(dest)]).toEqual([type, true]);
    }
  });

  // Regression: these shared a case with farm appointments, and `entityId`
  // (= the organization) was read as an appointment id → the poultry
  // appointments screen opened instead of the organization.
  it.each([
    'ORGANIZATION_APPROVED',
    'ORGANIZATION_REJECTED',
    'ORGANIZATION_SUSPENDED',
    'ORGANIZATION_ACTIVATED',
    'ORGANIZATION_DEACTIVATED',
    'ORGANIZATION_MEMBER_ADDED',
    'ORGANIZATION_ROLE_CHANGED',
    'ORGANIZATION_SUPERVISOR_ASSIGNED',
    'SUBSCRIPTION_UPDATED',
    'SUBSCRIPTION_RENEWAL_APPROVED',
    'SUBSCRIPTION_RENEWAL_REJECTED',
  ])('%s (inbox row: entityId = the organization) opens the organization', (type) => {
    for (const organizationType of ['CLINIC', 'VETERINARY_OFFICE', 'FARM']) {
      const n = {
        ...notification(type, { organizationId: 'o1', organizationType }),
        entityType: 'ORGANIZATION',
        entityId: 'o1',
      };
      expect(notificationHref(n)).toBe('/(app)/organizations/o1');
    }
  });

  it('a farm appointment still opens the appointment (data id, or a FARM_APPOINTMENT entityId)', () => {
    const fromData = {
      ...notification('FARM_APPOINTMENT_DUE', { organizationId: 'f1', appointmentId: 'ap1' }),
      entityType: 'FARM_APPOINTMENT',
      entityId: 'ap1',
    };
    expect(notificationHref(fromData)).toBe('/(app)/poultry/f1/sections/appointments/ap1');
    const fromEntity = {
      ...notification('FARM_APPOINTMENT_DUE', { organizationId: 'f1' }),
      entityType: 'FARM_APPOINTMENT',
      entityId: 'ap2',
    };
    expect(notificationHref(fromEntity)).toBe('/(app)/poultry/f1/sections/appointments/ap2');
  });

  it('a Global Chat room message opens the room, not the generic thread', () => {
    expect(
      notificationHref(
        notification('CHAT_MESSAGE_RECEIVED', { conversationId: 'c1', chatRoomId: 'r1' }),
      ),
    ).toBe('/(app)/global-chat/r1/thread');
  });

  it('removed from an organization → the notification details (its page is no longer readable)', () => {
    expect(
      notificationDestination(
        notification('ORGANIZATION_MEMBER_REMOVED', { organizationId: 'o1' }),
      ),
    ).toBe('/(app)/notifications/n1');
  });

  it('a push tap uses entityId from the payload (server now sends it)', () => {
    const pushPayload = {
      id: 'n1',
      type: 'VET_COURSE_APPROVED' as AppNotification['type'],
      entityType: null,
      entityId: null,
      data: { type: 'VET_COURSE_APPROVED', entityType: 'VET_COURSE', entityId: 'course1' },
    };
    expect(notificationHref(pushPayload)).toBe('/(app)/vet-courses/course1');
  });
});
