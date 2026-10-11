import { Linking } from 'react-native';

import { openPhone, openWebsite, telUrl, websiteUrl } from '../contactLinks';

describe('telUrl', () => {
  it('keeps the international + and strips formatting', () => {
    expect(telUrl('+964 777 756 4666')).toBe('tel:+9647777564666');
    expect(telUrl('0770-123-4567')).toBe('tel:07701234567');
    expect(telUrl('00964 770 123')).toBe('tel:+964770123');
    expect(telUrl('(0770) 123 4567')).toBe('tel:07701234567');
  });

  it('returns null when there is no number', () => {
    expect(telUrl('')).toBeNull();
    expect(telUrl(null)).toBeNull();
    expect(telUrl('call me')).toBeNull();
  });
});

describe('websiteUrl', () => {
  it('normalises bare hosts and keeps explicit http(s)', () => {
    expect(websiteUrl('example.com')).toBe('https://example.com/');
    expect(websiteUrl('www.vet.iq/about')).toBe('https://www.vet.iq/about');
    expect(websiteUrl(' https://example.com/x?y=1 ')).toBe('https://example.com/x?y=1');
    expect(websiteUrl('http://example.com')).toBe('http://example.com/');
    expect(websiteUrl('example.com:8080/p')).toBe('https://example.com:8080/p');
  });

  it('collapses a duplicated scheme', () => {
    expect(websiteUrl('https://https://example.com')).toBe('https://example.com/');
    expect(websiteUrl('http://https://example.com')).toBe('https://example.com/');
  });

  it('rejects unsafe or malformed values', () => {
    expect(websiteUrl('javascript:alert(1)')).toBeNull();
    expect(websiteUrl('data:text/html,hi')).toBeNull();
    expect(websiteUrl('ftp://example.com')).toBeNull();
    expect(websiteUrl('mailto:a@b.c')).toBeNull();
    expect(websiteUrl('not a url')).toBeNull();
    expect(websiteUrl('localhost')).toBeNull();
    expect(websiteUrl('')).toBeNull();
    expect(websiteUrl(null)).toBeNull();
  });
});

describe('openPhone / openWebsite', () => {
  const open = jest.spyOn(Linking, 'openURL');
  beforeEach(() => open.mockReset().mockResolvedValue(true));

  it('opens the dialer with a tel: link (the user still places the call)', async () => {
    await expect(openPhone('+964 777 756 4666')).resolves.toBe(true);
    expect(open).toHaveBeenCalledWith('tel:+9647777564666');
  });

  it('opens a normalised website and never an unsafe one', async () => {
    await expect(openWebsite('example.com')).resolves.toBe(true);
    expect(open).toHaveBeenCalledWith('https://example.com/');
    open.mockClear();
    await expect(openWebsite('javascript:alert(1)')).resolves.toBe(false);
    expect(open).not.toHaveBeenCalled();
  });

  it('reports failure instead of throwing', async () => {
    open.mockRejectedValueOnce(new Error('no handler'));
    await expect(openPhone('123')).resolves.toBe(false);
  });
});
