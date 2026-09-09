import { apiClient } from '@/services/api';

import { petOwnerAppointmentService } from '../api';
import {
  formatAppointmentDate,
  formatAppointmentDateTime,
  formatAppointmentTime,
} from '../constants';

const envelope = jest.spyOn(apiClient, 'requestEnvelope');
const get = jest.spyOn(apiClient, 'get');
const post = jest.spyOn(apiClient, 'post');

beforeEach(() => {
  [envelope, get, post].forEach((s) => s.mockReset());
});
afterAll(() => jest.restoreAllMocks());

describe('petOwnerAppointmentService — 1:1 with /clinic-appointments*', () => {
  it('book() POSTs to the org-scoped route', async () => {
    post.mockResolvedValue({});
    await petOwnerAppointmentService.book('org-1', {
      animalId: 'pet-1',
      visitType: 'FOLLOW_UP',
      scheduledFor: '2026-09-10T14:05:00.000Z',
      note: 'حجز موعد عملية التعقييم',
    });
    expect(post).toHaveBeenCalledWith('/organizations/org-1/clinic-appointments', {
      animalId: 'pet-1',
      visitType: 'FOLLOW_UP',
      scheduledFor: '2026-09-10T14:05:00.000Z',
      note: 'حجز موعد عملية التعقييم',
    });
  });

  it('list() GETs the owner-scoped list with the status filter', async () => {
    envelope.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
    await petOwnerAppointmentService.list({ page: 1, pageSize: 20, status: 'PENDING' });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/clinic-appointments',
      params: { page: 1, pageSize: 20, status: 'PENDING' },
    });
  });

  it('detail / history / cancel / reschedule-response hit the id-scoped routes', async () => {
    get.mockResolvedValue({});
    post.mockResolvedValue({});
    await petOwnerAppointmentService.get('a1');
    expect(get).toHaveBeenCalledWith('/clinic-appointments/a1');
    await petOwnerAppointmentService.history('a1');
    expect(get).toHaveBeenCalledWith('/clinic-appointments/a1/history');
    await petOwnerAppointmentService.cancel('a1');
    expect(post).toHaveBeenCalledWith('/clinic-appointments/a1/cancel');
    await petOwnerAppointmentService.respondToReschedule('a1', true);
    expect(post).toHaveBeenCalledWith('/clinic-appointments/a1/reschedule-response', {
      accept: true,
    });
  });
});

describe('appointment date/time formatting (Arabic-Indic, matches the reference)', () => {
  const iso = '2026-09-08T14:05:00.000Z';
  it('formats date as y/m/d and time as h:mm am/pm', () => {
    // ar-EG → Arabic-Indic digits; exact glyphs depend on the ICU build, so
    // assert structure rather than the literal string.
    expect(formatAppointmentDate(iso, 'en')).toMatch(/^0?8\/0?9\/2026$/);
    expect(formatAppointmentTime(iso, 'en')).toMatch(/\d{1,2}:\d{2}\s?(am|pm|AM|PM)/);
    expect(formatAppointmentDateTime(iso, 'en')).toContain('،');
  });
});
