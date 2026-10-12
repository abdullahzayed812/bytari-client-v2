import {
  aspectRatioOf,
  editorAspects,
  planEditActions,
  computeCrop,
  computeResize,
  cropActionOf,
  initialCropRect,
  lockedRatio,
  moveCropRect,
  resizeCropRect,
  resizeCropEdge,
  resizeCropFromHandle,
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

  it('free-resizes ONE side at a time, in every direction', () => {
    const r = { x: 1000, y: 1000, width: 1000, height: 1000 };
    // right edge out: only the width grows, left / top / height untouched
    expect(resizeCropEdge(r, 'r', 700, 999, bounds, null, 50)).toEqual({
      x: 1000,
      y: 1000,
      width: 1700,
      height: 1000,
    });
    // left edge out: the right side (2000) stays put
    expect(resizeCropEdge(r, 'l', -400, 0, bounds, null, 50)).toEqual({
      x: 600,
      y: 1000,
      width: 1400,
      height: 1000,
    });
    // top edge in, bottom edge out
    expect(resizeCropEdge(r, 't', 0, 250, bounds, null, 50)).toEqual({
      x: 1000,
      y: 1250,
      width: 1000,
      height: 750,
    });
    expect(resizeCropEdge(r, 'b', 0, 300, bounds, null, 50)).toEqual({
      x: 1000,
      y: 1000,
      width: 1000,
      height: 1300,
    });
  });

  it('a side never passes the image edge, the opposite side, or the minimum', () => {
    const r = { x: 1000, y: 1000, width: 1000, height: 1000 };
    expect(resizeCropEdge(r, 'r', 99999, 0, bounds, null, 50)).toMatchObject({ width: 3000 });
    expect(resizeCropEdge(r, 'l', -99999, 0, bounds, null, 50)).toMatchObject({
      x: 0,
      width: 2000,
    });
    expect(resizeCropEdge(r, 't', 0, 99999, bounds, null, 50)).toMatchObject({
      y: 1950,
      height: 50,
    });
    expect(resizeCropEdge(r, 'b', 0, 99999, bounds, null, 50)).toMatchObject({ height: 2000 });
  });

  it('a side drag keeps a LOCKED ratio, centred and inside the image', () => {
    const r = { x: 1000, y: 1000, width: 1000, height: 1000 };
    const sq = resizeCropEdge(r, 'r', 500, 0, bounds, 1, 50);
    expect(sq).toEqual({ x: 1000, y: 750, width: 1500, height: 1500 });
    const capped = resizeCropEdge(r, 'r', 99999, 0, bounds, 1, 50);
    expect(capped.width).toBeCloseTo(capped.height);
    expect(capped.y).toBeGreaterThanOrEqual(0);
    expect(capped.y + capped.height).toBeLessThanOrEqual(3000);
    expect(capped.x + capped.width).toBeLessThanOrEqual(4000);
  });

  it('resizeCropFromHandle dispatches corners and sides', () => {
    const r = { x: 1000, y: 1000, width: 1000, height: 1000 };
    expect(resizeCropFromHandle(r, 'br', 100, 100, bounds, null, 50)).toEqual(
      resizeCropRect(r, 'br', 100, 100, bounds, null, 50),
    );
    expect(resizeCropFromHandle(r, 'b', 100, 100, bounds, null, 50)).toEqual(
      resizeCropEdge(r, 'b', 100, 100, bounds, null, 50),
    );
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

describe('custom aspects + exact output size (ad banners)', () => {
  const AD = { width: 1200, height: 560 };

  it('parses any W:H aspect and falls back to the image ratio', () => {
    expect(aspectRatioOf('1200:560', 10, 10)).toBeCloseTo(1200 / 560);
    expect(aspectRatioOf('16:9', 10, 10)).toBeCloseTo(16 / 9);
    expect(aspectRatioOf('original', 400, 300)).toBeCloseTo(4 / 3);
    expect(aspectRatioOf('free', 300, 400)).toBeCloseTo(3 / 4);
  });

  it('an outputSize locks the editor to exactly that ratio', () => {
    expect(editorAspects({ outputSize: AD, aspects: ['1:1', '16:9'] })).toEqual(['1200:560']);
    expect(editorAspects({ aspects: ['1:1'] })).toEqual(['1:1']);
    expect(editorAspects({})).toContain('free');
  });

  it('crops the framed area and resizes it to exactly the output size', () => {
    const base = { width: 4000, height: 3000 };
    const rect = initialCropRect(base.width, base.height, '1200:560');
    expect(rect.width / rect.height).toBeCloseTo(1200 / 560, 2);
    const { actions, output } = planEditActions(base, rect, { maxDimension: 2048, outputSize: AD });
    expect(actions).toEqual([
      { crop: { originX: 0, originY: 566, width: 4000, height: 1867 } },
      { resize: { width: 1200, height: 560 } },
    ]);
    expect(output).toEqual(AD);
  });

  it('keeps a moved crop box where the user put it', () => {
    const base = { width: 3000, height: 4000 };
    const rect = { x: 0, y: 2600, width: 3000, height: 1400 };
    const { actions } = planEditActions(base, rect, { outputSize: AD });
    expect(actions[0]).toEqual({ crop: { originX: 0, originY: 2600, width: 3000, height: 1400 } });
  });

  it('skips a no-op resize when the crop already is the output size', () => {
    const base = { width: 1200, height: 560 };
    const rect = { x: 0, y: 0, width: 1200, height: 560 };
    expect(planEditActions(base, rect, { outputSize: AD })).toEqual({ actions: [], output: AD });
  });

  it('without an outputSize caps the longest edge and reports the real output size', () => {
    const base = { width: 4000, height: 3000 };
    const rect = { x: 0, y: 0, width: 3000, height: 3000 };
    expect(planEditActions(base, rect, { maxDimension: 2048 })).toEqual({
      actions: [
        { crop: { originX: 0, originY: 0, width: 3000, height: 3000 } },
        { resize: { width: 2048 } },
      ],
      output: { width: 2048, height: 2048 },
    });
    expect(planEditActions({ width: 800, height: 600 }, null, { maxDimension: 2048 })).toEqual({
      actions: [],
      output: { width: 800, height: 600 },
    });
  });
});
