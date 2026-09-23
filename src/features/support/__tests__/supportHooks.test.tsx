import { waitFor } from '@testing-library/react-native';

import { ApiError } from '@/services/api';
import { makeTestQueryClient, renderHookWithQuery } from '@/test-utils/render';

import { consultationApi, inquiryApi } from '../api';
import { aiSettingsApi } from '../api/supportApi';
import { supportKeys } from '../api/queryKeys';
import {
  useAiSettings,
  useCloseThread,
  useCreateThread,
  useMyThreads,
  useSendMessage,
  useSetSenderBlocked,
  useThread,
  useThreadMessages,
} from '../hooks';
import type { Paginated, Thread, ThreadMessage } from '../types';

const notFound = () => new ApiError({ code: 'NOT_FOUND', message: 'x', status: 404 });
const forbidden = () => new ApiError({ code: 'PERMISSION_DENIED', message: 'x', status: 403 });

const thread = (over: Partial<Thread> = {}): Thread => ({
  id: 'c1',
  kind: 'CONSULTATION',
  status: 'OPEN',
  createdByUserId: 'u1',
  animalId: null,
  senderBlocked: false,
  aiResponded: false,
  lastMessageAt: null,
  closedAt: null,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  ...over,
});

const page = <T,>(items: T[], totalPages = 1, pageNo = 1): Paginated<T> => ({
  items,
  meta: { page: pageNo, pageSize: 20, total: items.length, totalPages },
});

afterEach(() => jest.restoreAllMocks());

describe('useMyThreads', () => {
  it('flattens infinite pages and exposes the reported total', async () => {
    jest.spyOn(consultationApi, 'listMine').mockResolvedValueOnce({
      ...page([thread({ id: 'a' })], 2, 1),
      meta: { page: 1, pageSize: 20, total: 3, totalPages: 2 },
    });

    const { result } = renderHookWithQuery(() => useMyThreads('CONSULTATION', { pageSize: 20 }), {
      client: makeTestQueryClient(),
    });
    await waitFor(() => expect(result.current.threads).toHaveLength(1));
    expect(result.current.total).toBe(3);
    expect(result.current.hasNextPage).toBe(true);
  });

  it('passes the status filter through to the API', async () => {
    const spy = jest.spyOn(inquiryApi, 'listMine').mockResolvedValue(page([]));
    renderHookWithQuery(() => useMyThreads('INQUIRY', { status: 'CLOSED', pageSize: 10 }), {
      client: makeTestQueryClient(),
    });
    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(spy).toHaveBeenCalledWith({ page: 1, pageSize: 10, status: 'CLOSED' });
  });
});

describe('useThread', () => {
  it('does not retry a 404 or 403 (existence stays hidden)', async () => {
    const spy = jest.spyOn(consultationApi, 'get').mockRejectedValue(notFound());
    const { result } = renderHookWithQuery(() => useThread('CONSULTATION', 'c1'), {
      client: makeTestQueryClient(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('admin option routes to getAdmin', async () => {
    const spy = jest.spyOn(inquiryApi, 'getAdmin').mockResolvedValue(thread({ kind: 'INQUIRY' }));
    renderHookWithQuery(() => useThread('INQUIRY', 'i1', { admin: true }), {
      client: makeTestQueryClient(),
    });
    await waitFor(() => expect(spy).toHaveBeenCalledWith('i1'));
  });
});

describe('useThreadMessages', () => {
  it('flattens oldest→newest across pages', async () => {
    const m = (id: string): ThreadMessage => ({
      id,
      threadId: 'c1',
      senderUserId: 'u1',
      source: 'USER',
      body: id,
      imageUrls: [],
      deletedAt: null,
      createdAt: '2026-01-01',
    });
    jest.spyOn(consultationApi, 'listMessages').mockResolvedValueOnce(page([m('m1'), m('m2')]));
    const { result } = renderHookWithQuery(() => useThreadMessages('CONSULTATION', 'c1'), {
      client: makeTestQueryClient(),
    });
    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(result.current.messages.map((x) => x.id)).toEqual(['m1', 'm2']);
  });
});

describe('thread mutations — cache invalidation (no optimistic writes)', () => {
  it('useCreateThread invalidates only the kind’s own lists', async () => {
    jest.spyOn(consultationApi, 'create').mockResolvedValueOnce(thread());
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useCreateThread('CONSULTATION'), { client });

    await result.current.mutateAsync({ body: 'hello' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: supportKeys.myLists('CONSULTATION') });
  });

  it('useSendMessage invalidates messages + detail + both list scopes', async () => {
    jest.spyOn(consultationApi, 'sendMessage').mockResolvedValueOnce({
      id: 'm9',
      imageUrls: [],
      threadId: 'c1',
      senderUserId: 'u1',
      source: 'USER',
      body: 'hi',
      deletedAt: null,
      createdAt: '2026-01-01',
    });
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');
    const { result } = renderHookWithQuery(() => useSendMessage('CONSULTATION', 'c1'), { client });

    await result.current.mutateAsync({ body: 'hi' });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: supportKeys.messages('CONSULTATION', 'c1'),
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: supportKeys.detail('CONSULTATION', 'c1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: supportKeys.myLists('CONSULTATION') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: supportKeys.adminLists('CONSULTATION') });
  });

  it('useCloseThread and useSetSenderBlocked invalidate the thread detail', async () => {
    jest.spyOn(consultationApi, 'close').mockResolvedValueOnce(thread({ status: 'CLOSED' }));
    jest
      .spyOn(consultationApi, 'setSenderBlocked')
      .mockResolvedValueOnce(thread({ senderBlocked: true }));
    const client = makeTestQueryClient();
    const invalidate = jest.spyOn(client, 'invalidateQueries');

    const close = renderHookWithQuery(() => useCloseThread('CONSULTATION', 'c1'), { client });
    await close.result.current.mutateAsync();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: supportKeys.detail('CONSULTATION', 'c1') });

    const block = renderHookWithQuery(() => useSetSenderBlocked('CONSULTATION', 'c1'), { client });
    await block.result.current.mutateAsync({ blocked: true });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: supportKeys.detail('CONSULTATION', 'c1') });
  });
});

describe('useAiSettings', () => {
  it('does not retry a 403 (non-admin caller)', async () => {
    const spy = jest.spyOn(aiSettingsApi, 'get').mockRejectedValue(forbidden());
    const { result } = renderHookWithQuery(() => useAiSettings(), {
      client: makeTestQueryClient(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
