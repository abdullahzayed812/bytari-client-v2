import { i18n } from '@/i18n';
import { ApiError, apiClient } from '@/services/api';

import { aiSettingsApi, consultationApi, inquiryApi, makeThreadApi, threadApi } from '../api';
import { supportKeys } from '../api/queryKeys';
import {
  buildConsultationSchema,
  buildInquirySchema,
  buildMessageSchema,
  supportErrorMessage,
} from '../validation/schemas';

const t = i18n.getFixedT('ar', 'support');

const err = (status: number, code = 'X') =>
  new ApiError({ code: code as never, message: 'x', status });

describe('makeThreadApi — URL construction', () => {
  const get = jest.spyOn(apiClient, 'get');
  const post = jest.spyOn(apiClient, 'post');
  const envelope = jest.spyOn(apiClient, 'requestEnvelope');

  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    envelope.mockReset();
    envelope.mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
    });
  });
  afterAll(() => jest.restoreAllMocks());

  it('consultation slug is /consultations, inquiry slug is /inquiries', async () => {
    await consultationApi.listMine({ page: 1, pageSize: 20 });
    expect(envelope).toHaveBeenLastCalledWith(
      expect.objectContaining({ method: 'GET', url: '/consultations' }),
    );

    await inquiryApi.listMine({ page: 2, pageSize: 10, status: 'OPEN' });
    expect(envelope).toHaveBeenLastCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: '/inquiries',
        params: { page: 2, pageSize: 10, status: 'OPEN' },
      }),
    );
  });

  it('get / listMessages / close / block / unblock hit the kind-scoped paths', async () => {
    get.mockResolvedValue({ id: 'c1' });
    post.mockResolvedValue({ id: 'c1' });

    await consultationApi.get('c1');
    expect(get).toHaveBeenCalledWith('/consultations/c1');

    await consultationApi.listMessages('c1', 1, 30);
    expect(envelope).toHaveBeenLastCalledWith(
      expect.objectContaining({
        url: '/consultations/c1/messages',
        params: { page: 1, pageSize: 30 },
      }),
    );

    await consultationApi.close('c1');
    expect(post).toHaveBeenCalledWith('/consultations/c1/close', {});

    await consultationApi.setSenderBlocked('c1', true);
    expect(post).toHaveBeenLastCalledWith('/consultations/c1/block', {});

    await consultationApi.setSenderBlocked('c1', false);
    expect(post).toHaveBeenLastCalledWith('/consultations/c1/unblock', {});
  });

  it('create sends ONLY { body, animalId? } and message send sends ONLY { body }', async () => {
    post.mockResolvedValue({ id: 'c1' });

    await consultationApi.create({ body: 'help', animalId: 'a1' });
    expect(post).toHaveBeenLastCalledWith('/consultations', { body: 'help', animalId: 'a1' });

    await inquiryApi.create({ body: 'q' });
    expect(post).toHaveBeenLastCalledWith('/inquiries', { body: 'q' });

    await consultationApi.sendMessage('c1', { body: 'hi' });
    expect(post).toHaveBeenLastCalledWith('/consultations/c1/messages', { body: 'hi' });
  });

  it('admin surface is /admin/<slug> and forwards status + createdBy filters', async () => {
    get.mockResolvedValue({ id: 'c1' });

    await consultationApi.listAdmin({ page: 1, pageSize: 20, status: 'CLOSED', createdBy: 'u9' });
    expect(envelope).toHaveBeenLastCalledWith(
      expect.objectContaining({
        url: '/admin/consultations',
        params: { page: 1, pageSize: 20, status: 'CLOSED', createdBy: 'u9' },
      }),
    );

    await inquiryApi.getAdmin('i1');
    expect(get).toHaveBeenCalledWith('/admin/inquiries/i1');
  });

  it('normalizeMessage accepts threadId | consultationId | inquiryId and defaults null fields', async () => {
    envelope.mockResolvedValueOnce({
      data: [
        { id: 'm1', consultationId: 'c1', source: 'USER', body: 'x', createdAt: '2026-01-01' },
        { id: 'm2', inquiryId: 'i1', source: 'AI', createdAt: '2026-01-02' },
      ],
      meta: { page: 1, pageSize: 30, total: 2, totalPages: 1 },
    });
    const page = await consultationApi.listMessages('c1', 1, 30);
    expect(page.items[0]).toMatchObject({
      id: 'm1',
      threadId: 'c1',
      senderUserId: null,
      body: 'x',
    });
    expect(page.items[1]).toMatchObject({ id: 'm2', threadId: 'i1', source: 'AI', body: null });
  });

  it('threadApi(kind) returns the matching singleton factory', () => {
    expect(threadApi('CONSULTATION')).toBe(consultationApi);
    expect(threadApi('INQUIRY')).toBe(inquiryApi);
    // the factory itself is stable per shape
    const fresh = makeThreadApi('CONSULTATION');
    expect(typeof fresh.listMine).toBe('function');
  });
});

describe('aiSettingsApi', () => {
  it('reads and patches /admin/ai-settings', async () => {
    const get = jest
      .spyOn(apiClient, 'get')
      .mockResolvedValueOnce({ consultationAiEnabled: true, inquiryAiEnabled: false });
    await aiSettingsApi.get();
    expect(get).toHaveBeenCalledWith('/admin/ai-settings');

    const patch = jest
      .spyOn(apiClient, 'patch')
      .mockResolvedValueOnce({ consultationAiEnabled: false, inquiryAiEnabled: false });
    await aiSettingsApi.update({ consultationAiEnabled: false });
    expect(patch).toHaveBeenCalledWith('/admin/ai-settings', { consultationAiEnabled: false });
    jest.restoreAllMocks();
  });
});

describe('supportKeys', () => {
  it('namespaces by kind then scope, and messages nest under detail', () => {
    expect(supportKeys.forKind('CONSULTATION')).toEqual(['support', 'CONSULTATION']);
    expect(supportKeys.myList('CONSULTATION', { pageSize: 20 })).toEqual([
      'support',
      'CONSULTATION',
      'mine',
      { pageSize: 20 },
    ]);
    expect(supportKeys.adminLists('INQUIRY')).toEqual(['support', 'INQUIRY', 'admin']);
    expect(supportKeys.messages('CONSULTATION', 'c1')).toEqual([
      'support',
      'CONSULTATION',
      'detail',
      'c1',
      'messages',
    ]);
    // consultation and inquiry never collide
    expect(supportKeys.detail('CONSULTATION', 'x')).not.toEqual(supportKeys.detail('INQUIRY', 'x'));
    expect(supportKeys.aiSettings()).toEqual(['support', 'ai-settings']);
  });
});

describe('validation schemas', () => {
  it('body is required and capped at 4000 for every kind', () => {
    const c = buildConsultationSchema(t);
    expect(c.safeParse({ body: '', animalId: '', animalType: 'CAT' }).success).toBe(false);
    expect(c.safeParse({ body: 'a'.repeat(4001), animalId: '', animalType: 'CAT' }).success).toBe(
      false,
    );
    expect(c.safeParse({ body: 'valid question', animalId: '', animalType: 'CAT' }).success).toBe(
      true,
    );

    expect(buildInquirySchema(t).safeParse({ body: 'ok', category: 'GENERAL' }).success).toBe(true);
    expect(buildMessageSchema(t).safeParse({ body: '' }).success).toBe(false);
  });

  it('consultation animalId must be a UUID when present, but may be omitted / empty', () => {
    const c = buildConsultationSchema(t);
    const base = { body: 'x', animalType: 'DOG' as const };
    expect(c.safeParse({ ...base, animalId: 'not-a-uuid' }).success).toBe(false);
    expect(c.safeParse({ ...base, animalId: '' }).success).toBe(true);
    expect(c.safeParse({ ...base, animalId: '11111111-1111-1111-1111-111111111111' }).success).toBe(
      true,
    );
    expect(c.safeParse(base).success).toBe(true);
  });

  it('consultation requires a generic animal type from the shared vocabulary', () => {
    const c = buildConsultationSchema(t);
    expect(c.safeParse({ body: 'x' }).success).toBe(false);
    expect(c.safeParse({ body: 'x', animalType: 'DRAGON' }).success).toBe(false);
    for (const type of ['CAT', 'DOG', 'BIRD', 'HORSE', 'CATTLE', 'SHEEP', 'GOAT', 'OTHER']) {
      expect(c.safeParse({ body: 'x', animalType: type }).success).toBe(true);
    }
  });

  it('inquiry requires a known category', () => {
    const i = buildInquirySchema(t);
    expect(i.safeParse({ body: 'x' }).success).toBe(false);
    expect(i.safeParse({ body: 'x', category: 'ASTROLOGY' }).success).toBe(false);
    for (const c of [
      'EMERGENCY',
      'GENERAL',
      'SURGERY',
      'MEDICATION',
      'DISEASES',
      'NUTRITION',
      'OTHER',
    ]) {
      expect(i.safeParse({ body: 'x', category: c }).success).toBe(true);
    }
  });
});

describe('supportErrorMessage', () => {
  it('maps THREAD_NOT_WRITABLE to blocked (403) vs closed (409)', () => {
    expect(supportErrorMessage(err(403, 'THREAD_NOT_WRITABLE'), t)).toBe(t('errors.senderBlocked'));
    expect(supportErrorMessage(err(409, 'THREAD_NOT_WRITABLE'), t)).toBe(t('errors.threadClosed'));
  });

  it('maps forbidden / not-found / conflict without leaking backend text', () => {
    expect(supportErrorMessage(err(403), t)).toBe(t('errors.forbidden'));
    expect(supportErrorMessage(err(404), t)).toBe(t('errors.notFound'));
    expect(supportErrorMessage(err(409), t)).toBe(t('errors.conflict'));
    expect(supportErrorMessage(err(403, 'PERMISSION_DENIED'), t)).toBe(t('errors.forbidden'));
  });

  it('falls back to the generic mapper for anything else', () => {
    expect(typeof supportErrorMessage(new Error('boom'), t)).toBe('string');
  });
});
