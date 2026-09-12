import { apiClient } from '@/services/api';

import { vetCoursesApi } from '../api';

const envelope = jest.spyOn(apiClient, 'requestEnvelope');
const get = jest.spyOn(apiClient, 'get');
const post = jest.spyOn(apiClient, 'post');
const patch = jest.spyOn(apiClient, 'patch');
const del = jest.spyOn(apiClient, 'delete');

beforeEach(() => [envelope, get, post, patch, del].forEach((s) => s.mockReset()));
afterAll(() => jest.restoreAllMocks());

describe('vetCoursesApi — courses', () => {
  it('listCourses → GET /vet-courses with filters', async () => {
    envelope.mockResolvedValueOnce({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } });
    await vetCoursesApi.listCourses({ page: 1, pageSize: 20, search: 'تغذية', type: 'COURSE' });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/vet-courses',
      params: { page: 1, pageSize: 20, search: 'تغذية', type: 'COURSE', locationMode: undefined },
    });
  });

  it('listMyCourses → GET /vet-courses/mine', async () => {
    envelope.mockResolvedValueOnce({ data: [] });
    await vetCoursesApi.listMyCourses({ page: 1, pageSize: 20 });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/vet-courses/mine',
      params: { page: 1, pageSize: 20 },
    });
  });

  it('getMyCourse → GET /vet-courses/:id/manage', async () => {
    get.mockResolvedValueOnce({});
    await vetCoursesApi.getMyCourse('c1');
    expect(get).toHaveBeenCalledWith('/vet-courses/c1/manage');
  });

  it('createCourse → POST /vet-courses', async () => {
    post.mockResolvedValueOnce({});
    await vetCoursesApi.createCourse({
      type: 'COURSE',
      title: 'أساسيات التغذية',
      description: 'وصف الدورة',
      organizingBody: 'جمعية الأطباء البيطريين',
      instructorName: 'د. أحمد',
      startDate: '2999-06-15',
      endDate: '2999-06-17',
      locationMode: 'ONLINE',
      locationDetails: 'أونلاين عبر Zoom',
    });
    expect(post).toHaveBeenCalledWith(
      '/vet-courses',
      expect.objectContaining({ title: 'أساسيات التغذية' }),
    );
  });

  it('updateCourse → PATCH /vet-courses/:id', async () => {
    patch.mockResolvedValueOnce({});
    await vetCoursesApi.updateCourse('c1', { title: 'محدثة' });
    expect(patch).toHaveBeenCalledWith('/vet-courses/c1', { title: 'محدثة' });
  });

  it('cancelCourse → POST /vet-courses/:id/cancel', async () => {
    post.mockResolvedValueOnce({});
    await vetCoursesApi.cancelCourse('c1');
    expect(post).toHaveBeenCalledWith('/vet-courses/c1/cancel');
  });

  it('deleteCourse → DELETE /vet-courses/:id', async () => {
    del.mockResolvedValueOnce({});
    await vetCoursesApi.deleteCourse('c1');
    expect(del).toHaveBeenCalledWith('/vet-courses/c1');
  });
});

describe('vetCoursesApi — registrations', () => {
  it('register → POST /vet-courses/:id/registrations', async () => {
    post.mockResolvedValueOnce({});
    await vetCoursesApi.register('c1', { fullName: 'د. سارة', phone: '0770', governorate: 'بغداد' });
    expect(post).toHaveBeenCalledWith(
      '/vet-courses/c1/registrations',
      expect.objectContaining({ fullName: 'د. سارة' }),
    );
  });

  it('listCourseRegistrations → GET /vet-courses/:id/registrations', async () => {
    envelope.mockResolvedValueOnce({ data: [] });
    await vetCoursesApi.listCourseRegistrations('c1', { page: 1, pageSize: 20 });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/vet-courses/c1/registrations',
      params: { page: 1, pageSize: 20 },
    });
  });

  it('listMyRegistrations → GET /vet-courses/registrations/mine', async () => {
    envelope.mockResolvedValueOnce({ data: [] });
    await vetCoursesApi.listMyRegistrations({ page: 1, pageSize: 20 });
    expect(envelope).toHaveBeenCalledWith({
      method: 'GET',
      url: '/vet-courses/registrations/mine',
      params: { page: 1, pageSize: 20 },
    });
  });

  it('getRegistration → GET /vet-courses/registrations/:id', async () => {
    get.mockResolvedValueOnce({});
    await vetCoursesApi.getRegistration('r1');
    expect(get).toHaveBeenCalledWith('/vet-courses/registrations/r1');
  });
});
