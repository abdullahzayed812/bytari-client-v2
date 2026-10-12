import { manipulateAsync } from 'expo-image-manipulator';

import { editImage, type LocalFile } from '@/services/media';
import { act, fireEvent, renderWithProviders, screen, waitFor } from '@/test-utils/render';

import { i18n } from '@/i18n';

import { ImageEditorHost } from '../ImageEditorHost';

const SAVE = i18n.t('common:media.editor.save');

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  manipulateAsync: jest.fn(),
}));

const mockManipulate = manipulateAsync as jest.MockedFunction<typeof manipulateAsync>;

// The picker reports the raw, un-rotated sensor size (Android EXIF case); the
// manipulator's normalised working copy is the real upright size.
const PICKED: LocalFile = {
  uri: 'file:///photo.jpg',
  name: 'photo.jpg',
  mimeType: 'image/jpeg',
  width: 4000,
  height: 3000,
};

beforeEach(() => {
  mockManipulate.mockReset();
  global.fetch = jest.fn().mockResolvedValue({
    blob: () => Promise.resolve({ size: 4321 }),
  }) as unknown as typeof fetch;
});

describe('ImageEditorHost', () => {
  it('crops the orientation-normalised working copy and exports exactly the output size', async () => {
    mockManipulate
      // working copy: EXIF applied → portrait
      .mockResolvedValueOnce({ uri: 'file:///working.jpg', width: 3000, height: 4000 })
      // final export
      .mockResolvedValueOnce({ uri: 'file:///out.jpg', width: 1200, height: 560 });

    renderWithProviders(<ImageEditorHost />);
    let pending: Promise<unknown> = Promise.resolve();
    await act(async () => {
      pending = editImage(PICKED, { outputSize: { width: 1200, height: 560 } });
    });

    // the ad's required size (default) + a free crop — no other ratios
    await waitFor(() => expect(mockManipulate).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('16:9')).toBeNull();
    expect(screen.getByText('المقاس المطلوب')).toBeTruthy();
    expect(screen.getByText('حر')).toBeTruthy();

    const save = await screen.findByRole('button', { name: SAVE });
    await waitFor(() => expect(save).not.toBeDisabled());
    fireEvent.press(save);

    const outcome = await pending;
    const [srcUri, actions] = mockManipulate.mock.calls[1]!;
    // cropped from the upright working copy, never the raw picked file
    expect(srcUri).toBe('file:///working.jpg');
    expect(actions).toEqual([
      // largest centred 1200:560 box of a 3000×4000 image
      { crop: { originX: 0, originY: 1300, width: 3000, height: 1400 } },
      { resize: { width: 1200, height: 560 } },
    ]);
    expect(outcome).toEqual({
      uri: 'file:///out.jpg',
      name: 'photo.jpg',
      mimeType: 'image/jpeg',
      size: 4321,
      width: 1200,
      height: 560,
    });
  });

  it('a fixed-size slot can switch to a free crop: no forced resize to the output size', async () => {
    mockManipulate
      .mockResolvedValueOnce({ uri: 'file:///working.jpg', width: 3000, height: 4000 })
      .mockResolvedValueOnce({ uri: 'file:///out.jpg', width: 1536, height: 2048 });
    renderWithProviders(<ImageEditorHost />);
    let pending: Promise<unknown> = Promise.resolve();
    await act(async () => {
      pending = editImage(PICKED, { outputSize: { width: 1200, height: 560 } });
    });
    await waitFor(() => expect(mockManipulate).toHaveBeenCalledTimes(1));
    fireEvent.press(await screen.findByText('حر'));
    const save = await screen.findByRole('button', { name: SAVE });
    await waitFor(() => expect(save).not.toBeDisabled());
    fireEvent.press(save);
    await pending;
    // whole image (free starts uncropped), only the longest-edge cap — never 1200×560
    expect(mockManipulate.mock.calls[1]![1]).toEqual([{ resize: { height: 2048 } }]);
  });

  it('caps the working copy at the default longest edge for free crops', async () => {
    mockManipulate.mockResolvedValueOnce({ uri: 'file:///working.jpg', width: 2048, height: 1536 });
    renderWithProviders(<ImageEditorHost />);
    await act(async () => {
      void editImage(PICKED, {});
    });
    await waitFor(() => expect(mockManipulate).toHaveBeenCalledTimes(1));
    expect(mockManipulate.mock.calls[0]![1]).toEqual([{ resize: { width: 2048 } }]);
  });

  it('offers 8 resize handles (corners + sides), each fully inside its touchable parent', async () => {
    mockManipulate.mockResolvedValueOnce({ uri: 'file:///working.jpg', width: 2000, height: 1000 });
    renderWithProviders(<ImageEditorHost />);
    await act(async () => {
      void editImage(PICKED, {});
    });
    await waitFor(() => expect(mockManipulate).toHaveBeenCalledTimes(1));
    fireEvent(screen.getByTestId('image-editor-stage'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 600 } },
    });

    const canvas = await screen.findByTestId('image-editor-canvas');
    const flat = (style: unknown) =>
      Object.assign({}, ...[style].flat(Infinity).filter(Boolean)) as {
        left: number;
        top: number;
        width: number;
        height: number;
      };
    const { width: cw, height: ch } = flat(canvas.props.style);
    for (const h of ['tl', 'tr', 'bl', 'br', 't', 'b', 'l', 'r']) {
      const s = flat(screen.getByTestId(`crop-handle-${h}`).props.style);
      // Android only hit-tests inside the parent's bounds — no part may stick out.
      expect(s.left).toBeGreaterThanOrEqual(0);
      expect(s.top).toBeGreaterThanOrEqual(0);
      expect(s.left + s.width).toBeLessThanOrEqual(cw + 0.001);
      expect(s.top + s.height).toBeLessThanOrEqual(ch + 0.001);
    }
  });

  it('a free crop is not ratio-locked: the full image is offered and exported untouched', async () => {
    mockManipulate.mockResolvedValueOnce({ uri: 'file:///working.jpg', width: 2000, height: 1000 });
    renderWithProviders(<ImageEditorHost />);
    let pending: Promise<unknown> = Promise.resolve();
    await act(async () => {
      pending = editImage({ ...PICKED, width: 2000, height: 1000 }, {});
    });
    await waitFor(() => expect(mockManipulate).toHaveBeenCalledTimes(1));
    const save = await screen.findByRole('button', { name: SAVE });
    await waitFor(() => expect(save).not.toBeDisabled());
    fireEvent.press(save);
    // whole-image free crop, nothing downscaled → the original file, no re-encode
    expect(await pending).toEqual({ ...PICKED, width: 2000, height: 1000 });
    expect(mockManipulate).toHaveBeenCalledTimes(1);
  });
});
