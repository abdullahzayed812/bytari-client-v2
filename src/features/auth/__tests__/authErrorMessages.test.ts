import { initI18n } from '@/i18n';
import { ApiError } from '@/services/api';

import { authErrorMessage, fieldErrors } from '../errors';

beforeAll(() => initI18n('ar'));

const err = (
  code: string,
  status = 400,
  details?: { path: string; message: string; rule?: string }[],
) => new ApiError({ code: code as never, message: 'raw backend message', status, details });

describe('authErrorMessage — backend code → safe Arabic string', () => {
  it('maps invalid credentials', () => {
    expect(authErrorMessage(err('INVALID_CREDENTIALS', 401), 'login')).toContain('كلمة المرور');
  });

  it('maps a duplicate email only in the register context', () => {
    expect(authErrorMessage(err('CONFLICT', 409), 'register')).toContain('مُستخدم');
    expect(authErrorMessage(err('CONFLICT', 409), 'login')).not.toContain('مُستخدم');
  });

  it('maps inactive account, rate limit, session expiry', () => {
    expect(authErrorMessage(err('ACCOUNT_INACTIVE', 403))).toContain('موقوف');
    expect(authErrorMessage(err('RATE_LIMITED', 429))).toContain('محاولات');
    expect(authErrorMessage(err('INVALID_REFRESH_TOKEN', 401))).toContain('انتهت');
  });

  it('distinguishes network / timeout / server errors', () => {
    expect(authErrorMessage(err('NETWORK_ERROR', 0))).toContain('اتصالك');
    expect(authErrorMessage(err('TIMEOUT', 0))).toContain('وقتاً');
    expect(authErrorMessage(err('INTERNAL_ERROR', 500))).toContain('الخادم');
  });

  it('never leaks the raw backend message', () => {
    expect(authErrorMessage(err('SOME_UNKNOWN_CODE', 418))).not.toContain('raw backend message');
  });

  it('falls back to a generic message for a non-ApiError', () => {
    expect(authErrorMessage(new Error('boom'))).toBeTruthy();
    expect(authErrorMessage(new Error('boom'))).not.toContain('boom');
  });

  it('fieldErrors maps 422 details to field keys', () => {
    const map = fieldErrors(
      err('VALIDATION_ERROR', 422, [
        { path: 'body.email', message: 'Invalid email', rule: 'invalid_string' },
        { path: 'body.password', message: 'too short', rule: 'too_small' },
      ]),
    );
    expect(Object.keys(map).sort()).toEqual(['email', 'password']);
    expect(map.password).toContain('10');
  });
});
