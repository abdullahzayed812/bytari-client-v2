import { extractLinks, openExternalUrl } from '../openExternal';

const mockCanOpenURL = jest.fn();
const mockOpenURL = jest.fn();

jest.mock('expo-linking', () => ({
  canOpenURL: (u: string) => mockCanOpenURL(u),
  openURL: (u: string) => mockOpenURL(u),
}));

beforeEach(() => {
  mockCanOpenURL.mockReset().mockResolvedValue(true);
  mockOpenURL.mockReset().mockResolvedValue(undefined);
});

describe('openExternalUrl — only http/https are ever handed to the OS (§25, §33)', () => {
  it('opens a normal https URL', async () => {
    await expect(openExternalUrl('https://example.com/a.pdf')).resolves.toBe(true);
    expect(mockOpenURL).toHaveBeenCalledWith('https://example.com/a.pdf');
  });

  it('opens a plain http URL', async () => {
    await expect(openExternalUrl('http://example.com/a.pdf')).resolves.toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    'file:///etc/passwd',
    'data:text/html,<script>alert(1)</script>',
    'ftp://example.com/x',
    'not a url',
    '',
    null,
    undefined,
  ])('rejects %p without calling mockOpenURL', async (value) => {
    await expect(openExternalUrl(value as string)).resolves.toBe(false);
    expect(mockOpenURL).not.toHaveBeenCalled();
  });

  it('returns false when the OS cannot open the URL', async () => {
    mockCanOpenURL.mockResolvedValueOnce(false);
    await expect(openExternalUrl('https://example.com')).resolves.toBe(false);
    expect(mockOpenURL).not.toHaveBeenCalled();
  });
});

describe('extractLinks', () => {
  it('pulls unique http(s) URLs out of plain text and ignores everything else', () => {
    const text =
      'see https://a.example/x and http://b.example/y and https://a.example/x again; javascript:x';
    expect(extractLinks(text)).toEqual(['https://a.example/x', 'http://b.example/y']);
  });

  it('returns an empty array when there are no links', () => {
    expect(extractLinks('just some words')).toEqual([]);
  });
});
