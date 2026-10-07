import { apiClient } from '@/services/api';

import { clinicAppointmentService } from '@/features/clinicAppointments/api';
import { organizationAnimalsApi } from '@/features/animals/api';

import { clinicDashboardApi } from '../api';

const get = jest.spyOn(apiClient, 'get');
const post = jest.spyOn(apiClient, 'post');
const envelope = jest.spyOn(apiClient, 'requestEnvelope');

describe('clinic dashboard API wrappers (org id always in the URL, never the body)', () => {
  beforeEach(() => {
    get.mockReset().mockResolvedValue({} as never);
    post.mockReset().mockResolvedValue({} as never);
    envelope.mockReset().mockResolvedValue({ data: [], meta: {} } as never);
  });
  afterAll(() => jest.restoreAllMocks());

  it('summary', async () => {
    await clinicDashboardApi.getSummary('c1');
    expect(get).toHaveBeenCalledWith('/organizations/c1/clinic-dashboard/summary');
  });

  it('clinic-visible animal profile', async () => {
    await organizationAnimalsApi.getProfile('c1', 'a1');
    expect(get).toHaveBeenCalledWith('/organizations/c1/animals/a1');
  });

  it('clinic appointment list + actions', async () => {
    await clinicAppointmentService.list('c1', { page: 1, pageSize: 20, status: 'PENDING' });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/organizations/c1/clinic-appointments',
      params: { page: 1, pageSize: 20, status: 'PENDING' },
    });
    await clinicAppointmentService.confirm('c1', 'ap1');
    expect(post).toHaveBeenCalledWith('/organizations/c1/clinic-appointments/ap1/confirm');
    await clinicAppointmentService.reject('c1', 'ap1');
    expect(post).toHaveBeenCalledWith('/organizations/c1/clinic-appointments/ap1/reject', {});
    await clinicAppointmentService.complete('c1', 'ap1');
    expect(post).toHaveBeenCalledWith('/organizations/c1/clinic-appointments/ap1/complete');
  });
});
