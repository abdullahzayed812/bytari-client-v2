import { CALLING_CODES, DEFAULT_CALLING_CODE } from '../data/callingCodes';
import { isValidNationalNumber, toInternationalPhone } from '../lib/phone';

describe('registration phone helpers', () => {
  it('defaults to Iraq (+964), listed first', () => {
    expect(DEFAULT_CALLING_CODE).toBe('IQ');
    expect(CALLING_CODES[0]).toMatchObject({ code: 'IQ', dial: '964' });
  });

  it('has unique ISO codes', () => {
    const codes = CALLING_CODES.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('joins code + national number into the format the API stores', () => {
    expect(toInternationalPhone('IQ', '07701234567')).toBe('+9647701234567');
    expect(toInternationalPhone('IQ', '770 123 4567')).toBe('+9647701234567');
    expect(toInternationalPhone('EG', '010-1234-5678')).toBe('+201012345678');
    expect(toInternationalPhone('US', '(202) 555-0123')).toBe('+12025550123');
  });

  it('produces values the server phoneSchema regex accepts', () => {
    const serverRe = /^\+?[0-9][0-9\s\-()]{5,23}$/;
    expect(serverRe.test(toInternationalPhone('IQ', '7701234567'))).toBe(true);
    expect(serverRe.test(toInternationalPhone('GB', '07911 123456'))).toBe(true);
  });

  it('validates per calling code', () => {
    expect(isValidNationalNumber('IQ', '7701234567')).toBe(true);
    expect(isValidNationalNumber('IQ', '12345')).toBe(false);
    expect(isValidNationalNumber('IQ', '77a1234567')).toBe(false);
    expect(isValidNationalNumber('ZZ', '7701234567')).toBe(false);
  });

  it('rejects unknown countries when joining', () => {
    expect(() => toInternationalPhone('ZZ', '7701234567')).toThrow();
  });
});
