import {
  computeCrop,
  computeResize,
  cropActionOf,
  initialCropRect,
  lockedRatio,
  moveCropRect,
  resizeCropRect,
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

describe('drag crop geometry', () => {
  const bounds = { width: 4000, height: 3000 };

  it('"free" starts on the whole image and has no ratio lock', () => {
    expect(initialCropRect(4000, 3000, 'free')).toEqual({ x: 0, y: 0, width: 4000, height: 3000 });
    expect(lockedRatio('free', 4000, 3000)).toBeNull();
    expect(lockedRatio('1:1', 4000, 3000)).toBe(1);
    expect(lockedRatio('original', 4000, 3000)).toBeCloseTo(4 / 3);
  });

  it('moves the frame but never past the image edges', () => {
    const r = { x: 100, y: 100, width: 1000, height: 1000 };
    expect(moveCropRect(r, 500, 200, bounds)).toMatchObject({ x: 600, y: 300 });
    expect(moveCropRect(r, -999, -999, bounds)).toMatchObject({ x: 0, y: 0 });
    expect(moveCropRect(r, 9999, 9999, bounds)).toMatchObject({ x: 3000, y: 2000 });
  });

  it('free-resizes from a corner with the opposite corner fixed', () => {
    const r = { x: 1000, y: 1000, width: 1000, height: 1000 };
    // drag bottom-right outwards
    expect(resizeCropRect(r, 'br', 500, 200, bounds, null, 50)).toEqual({
      x: 1000,
      y: 1000,
      width: 1500,
      height: 1200,
    });
    // drag top-left inwards: the bottom-right corner (2000,2000) stays put
    const tl = resizeCropRect(r, 'tl', 300, 600, bounds, null, 50);
    expect(tl.x + tl.width).toBe(2000);
    expect(tl.y + tl.height).toBe(2000);
    expect(tl).toMatchObject({ width: 700, height: 400 });
  });

  it('never flips, shrinks below the minimum, or leaves the image', () => {
    const r = { x: 1000, y: 1000, width: 1000, height: 1000 };
    expect(resizeCropRect(r, 'br', -5000, -5000, bounds, null, 80)).toMatchObject({
      x: 1000,
      y: 1000,
      width: 80,
      height: 80,
    });
    const big = resizeCropRect(r, 'br', 99999, 99999, bounds, null, 80);
    expect(big.x + big.width).toBe(4000);
    expect(big.y + big.height).toBe(3000);
  });

  it('keeps a locked ratio while resizing, inside the bounds', () => {
    const r = { x: 0, y: 0, width: 1000, height: 1000 };
    const sq = resizeCropRect(r, 'br', 2000, 100, bounds, 1, 50);
    expect(sq.width).toBeCloseTo(sq.height);
    expect(sq.width).toBeLessThanOrEqual(3000);
    const wide = resizeCropRect(
      { x: 0, y: 0, width: 1600, height: 900 },
      'br',
      99999,
      0,
      bounds,
      16 / 9,
      50,
    );
    expect(wide.width / wide.height).toBeCloseTo(16 / 9);
    expect(wide.width).toBeLessThanOrEqual(4000);
    expect(wide.height).toBeLessThanOrEqual(3000);
  });

  it('rounds to an integer crop action inside the image', () => {
    expect(cropActionOf({ x: 10.4, y: 20.6, width: 99.5, height: 3999 }, bounds)).toEqual({
      originX: 10,
      originY: 21,
      width: 100,
      height: 2979,
    });
  });
});
