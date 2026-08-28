import type { AxiosInstance } from 'axios';

import { ApiClient } from '@/services/api/client';
import { ApiError } from '@/services/api/errors';

function fakeAxios(handler: () => Promise<unknown>): AxiosInstance {
  return { request: jest.fn(handler) } as unknown as AxiosInstance;
}

describe('ApiClient', () => {
  it('unwraps the { data } envelope on success', async () => {
    const client = new ApiClient(fakeAxios(() => Promise.resolve({ data: { data: { id: '1' } } })));
    await expect(client.get('/x')).resolves.toEqual({ id: '1' });
  });

  it('normalises an HTTP error envelope into an ApiError', async () => {
    const client = new ApiClient(
      fakeAxios(() =>
        Promise.reject({
          isAxiosError: true,
          response: {
            status: 422,
            data: { error: { code: 'VALIDATION_ERROR', message: 'bad', requestId: 'req_1' } },
            headers: {},
          },
        }),
      ),
    );
    await expect(client.post('/x')).rejects.toMatchObject({
      name: 'ApiError',
      code: 'VALIDATION_ERROR',
      status: 422,
      requestId: 'req_1',
    });
  });

  it('maps a missing response to a NETWORK_ERROR ApiError', async () => {
    const client = new ApiClient(
      fakeAxios(() => Promise.reject({ isAxiosError: true, response: undefined })),
    );
    const error = await client.get('/x').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('NETWORK_ERROR');
    expect((error as ApiError).isNetworkError).toBe(true);
  });
});

describe('ApiError semantics', () => {
  const make = (status: number, code = 'X') =>
    new ApiError({ code: code as ApiError['code'], message: 'm', status });

  it('classifies auth errors', () => {
    expect(make(401).isAuthError).toBe(true);
    expect(
      new ApiError({ code: 'INVALID_REFRESH_TOKEN', message: 'm', status: 400 }).isAuthError,
    ).toBe(true);
    expect(make(200).isAuthError).toBe(false);
  });

  it('classifies retryable errors', () => {
    expect(make(503).isRetryable).toBe(true);
    expect(make(500).isRetryable).toBe(false);
    expect(make(400).isRetryable).toBe(false);
  });

  it('classifies validation + permission errors', () => {
    expect(make(422).isValidationError).toBe(true);
    expect(make(403).isPermissionError).toBe(true);
  });
});
