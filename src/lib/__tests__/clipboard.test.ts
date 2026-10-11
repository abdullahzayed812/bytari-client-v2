import * as Clipboard from 'expo-clipboard';

import { copyText } from '../clipboard';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn().mockResolvedValue(true) }));

describe('copyText (native)', () => {
  it('writes through expo-clipboard', async () => {
    await expect(copyText('K7M4QXR')).resolves.toBe(true);
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('K7M4QXR');
  });

  it('reports false instead of throwing when the native module is unavailable', async () => {
    (Clipboard.setStringAsync as jest.Mock).mockRejectedValueOnce(new Error('no native module'));
    await expect(copyText('x')).resolves.toBe(false);
  });
});
