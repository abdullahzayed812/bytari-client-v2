import {
  computeCrop,
  computeResize,
  editImage,
  registerImageEditor,
  type LocalFile,
} from '@/services/media';

const file: LocalFile = {
  uri: 'file:///a.jpg',
  name: 'a.jpg',
  mimeType: 'image/jpeg',
  width: 4000,
  height: 3000,
};

describe('computeCrop', () => {
  it('keeps the original frame for "original"', () => {
    expect(computeCrop(4000, 3000, 'original')).toEqual({
      originX: 0,
      originY: 0,
      width: 4000,
      height: 3000,
    });
  });

  it('centres a square crop in a landscape image', () => {
    expect(computeCrop(4000, 3000, '1:1')).toEqual({
      originX: 500,
      originY: 0,
      width: 3000,
      height: 3000,
    });
  });

  it('honours the crop position along the trimmed axis', () => {
    expect(computeCrop(4000, 3000, '1:1', 'start').originX).toBe(0);
    expect(computeCrop(4000, 3000, '1:1', 'end').originX).toBe(1000);
    expect(computeCrop(3000, 4000, '16:9', 'end')).toEqual({
      originX: 0,
      originY: 4000 - 1688,
      width: 3000,
      height: 1688,
    });
  });

  it('never exceeds the image bounds', () => {
    const c = computeCrop(1000, 200, '3:4');
    expect(c.width).toBeLessThanOrEqual(1000);
    expect(c.height).toBeLessThanOrEqual(200);
    expect(c.originX + c.width).toBeLessThanOrEqual(1000);
  });
});

describe('computeResize', () => {
  it('caps the longest edge and skips small images / "original"', () => {
    expect(computeResize(4000, 3000, 1280)).toEqual({ width: 1280 });
    expect(computeResize(3000, 4000, 1280)).toEqual({ height: 1280 });
    expect(computeResize(800, 600, 1280)).toBeNull();
    expect(computeResize(4000, 3000, null)).toBeNull();
  });
});

describe('editImage bridge', () => {
  it('passes the original through when no editor is mounted', async () => {
    await expect(editImage(file)).resolves.toBe(file);
  });

  it('routes through the registered editor, then unregisters', async () => {
    const edited: LocalFile = { ...file, uri: 'file:///edited.jpg' };
    const handler = jest.fn().mockResolvedValue(edited);
    const unregister = registerImageEditor(handler);
    await expect(editImage(file, { aspects: ['1:1'] })).resolves.toBe(edited);
    expect(handler).toHaveBeenCalledWith(file, { aspects: ['1:1'], index: 0, total: 1 });
    unregister();
    await expect(editImage(file)).resolves.toBe(file);
  });
});
