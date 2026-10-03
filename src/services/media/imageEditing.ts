import type { LocalFile } from '@/services/files/types';

/**
 * Shared image-editing step (crop / aspect ratio / resize / rotate + preview)
 * that runs between picking an image and uploading it — for EVERY image the
 * app picks through `pickImage` / `pickImages`, so no screen implements its
 * own cropper.
 *
 * The UI lives in one `<ImageEditorHost />` mounted at the app root; it
 * registers itself here. `pickImage` then awaits {@link editImage}. Editing is
 * client-side only — the backend still validates MIME (magic bytes), size and
 * ownership of whatever is uploaded. Callers that must keep the ORIGINAL (ID
 * documents, certificates) pass `edit: false`.
 */

/**
 * `free` = manual drag-crop with no ratio lock (the default); `original` keeps
 * the image's own ratio; the rest lock the crop box to that ratio.
 */
export type CropAspect = 'free' | 'original' | '1:1' | '4:3' | '3:4' | '16:9';
export const CROP_ASPECTS: CropAspect[] = ['free', 'original', '1:1', '4:3', '3:4', '16:9'];

/** Longest-edge caps offered by the "size" control. `null` = keep original. */
export type ResizeOption = number | null;
export const RESIZE_OPTIONS: ResizeOption[] = [null, 2048, 1280, 800];

/** Where the crop window sits along the axis that gets trimmed. */
export type CropFocus = 'start' | 'center' | 'end';

export interface ImageEditOptions {
  /** Aspect choices offered. A single entry locks it (e.g. avatars → `['1:1']`). */
  aspects?: CropAspect[];
  defaultAspect?: CropAspect;
  /** Default longest-edge cap. */
  defaultMaxDimension?: ResizeOption;
}

export type EditOutcome = LocalFile | null | 'keep-rest';

type Handler = (
  file: LocalFile,
  options: ImageEditOptions & { index: number; total: number },
) => Promise<EditOutcome>;

let handler: Handler | null = null;

/** Called by `<ImageEditorHost />`. Returns an unregister function. */
export function registerImageEditor(h: Handler): () => void {
  handler = h;
  return () => {
    if (handler === h) handler = null;
  };
}

export function isImageEditorAvailable(): boolean {
  return handler !== null;
}

/**
 * Let the user edit one picked image. Resolves the edited file, the original
 * (no editor mounted, e.g. tests), `null` when the user cancelled, or
 * `'keep-rest'` in a multi-pick when they chose to keep the remaining
 * originals.
 */
export async function editImage(
  file: LocalFile,
  options: ImageEditOptions & { index?: number; total?: number } = {},
): Promise<EditOutcome> {
  if (!handler) return file;
  return handler(file, { ...options, index: options.index ?? 0, total: options.total ?? 1 });
}

export function aspectRatioOf(aspect: CropAspect, width: number, height: number): number {
  switch (aspect) {
    case '1:1':
      return 1;
    case '4:3':
      return 4 / 3;
    case '3:4':
      return 3 / 4;
    case '16:9':
      return 16 / 9;
    default:
      return width / height;
  }
}

/**
 * Largest rectangle of `aspect` that fits in `width × height`, positioned by
 * `focus` along the trimmed axis. Integer pixels, never outside the image.
 */
export function computeCrop(
  width: number,
  height: number,
  aspect: CropAspect,
  focus: CropFocus = 'center',
): { originX: number; originY: number; width: number; height: number } {
  const target = aspectRatioOf(aspect, width, height);
  let w = width;
  let h = Math.round(width / target);
  if (h > height) {
    h = height;
    w = Math.round(height * target);
  }
  w = Math.min(w, width);
  h = Math.min(h, height);
  const place = (free: number) =>
    focus === 'start' ? 0 : focus === 'end' ? free : Math.floor(free / 2);
  return { originX: place(width - w), originY: place(height - h), width: w, height: h };
}

/** Resize action that caps the longest edge, or `null` when already small enough. */
export function computeResize(
  width: number,
  height: number,
  maxDimension: ResizeOption,
): { width: number } | { height: number } | null {
  if (!maxDimension || Math.max(width, height) <= maxDimension) return null;
  return width >= height ? { width: maxDimension } : { height: maxDimension };
}

// --- interactive (drag) crop ---------------------------------------------

/** A crop box in source-image pixels (after rotation). */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type CropCorner = 'tl' | 'tr' | 'bl' | 'br';

/** Ratio the crop box is locked to, or `null` for a free crop. */
export function lockedRatio(aspect: CropAspect, width: number, height: number): number | null {
  return aspect === 'free' ? null : aspectRatioOf(aspect, width, height);
}

/** Starting crop box for an aspect: the whole image when free, else the centred max box. */
export function initialCropRect(width: number, height: number, aspect: CropAspect): CropRect {
  const c = computeCrop(width, height, aspect, 'center');
  return { x: c.originX, y: c.originY, width: c.width, height: c.height };
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), hi);

/** Drag the whole box by (dx, dy) source pixels, kept inside the image. */
export function moveCropRect(
  rect: CropRect,
  dx: number,
  dy: number,
  bounds: { width: number; height: number },
): CropRect {
  return {
    ...rect,
    x: clamp(rect.x + dx, 0, bounds.width - rect.width),
    y: clamp(rect.y + dy, 0, bounds.height - rect.height),
  };
}

/**
 * Drag one corner by (dx, dy) source pixels. The opposite corner stays put;
 * the box never flips, never leaves the image, never shrinks below `minSize`,
 * and keeps `ratio` (width / height) when one is locked.
 */
export function resizeCropRect(
  rect: CropRect,
  corner: CropCorner,
  dx: number,
  dy: number,
  bounds: { width: number; height: number },
  ratio: number | null,
  minSize: number,
): CropRect {
  const left = corner === 'tl' || corner === 'bl';
  const top = corner === 'tl' || corner === 'tr';
  // anchor = the fixed opposite corner
  const ax = left ? rect.x + rect.width : rect.x;
  const ay = top ? rect.y + rect.height : rect.y;
  const maxW = left ? ax : bounds.width - ax;
  const maxH = top ? ay : bounds.height - ay;
  const min = Math.min(minSize, maxW, maxH);

  let w = clamp(rect.width + (left ? -dx : dx), min, maxW);
  let h = clamp(rect.height + (top ? -dy : dy), min, maxH);
  if (ratio) {
    // follow whichever edge moved further, then fit back inside the bounds
    if (w / h > ratio) h = w / ratio;
    else w = h * ratio;
    if (w > maxW) {
      w = maxW;
      h = w / ratio;
    }
    if (h > maxH) {
      h = maxH;
      w = h * ratio;
    }
  }
  return { x: left ? ax - w : ax, y: top ? ay - h : ay, width: w, height: h };
}

/** Integer crop action for the manipulator — rounded and clamped to the image. */
export function cropActionOf(
  rect: CropRect,
  bounds: { width: number; height: number },
): { originX: number; originY: number; width: number; height: number } {
  const originX = clamp(Math.round(rect.x), 0, bounds.width - 1);
  const originY = clamp(Math.round(rect.y), 0, bounds.height - 1);
  return {
    originX,
    originY,
    width: clamp(Math.round(rect.width), 1, bounds.width - originX),
    height: clamp(Math.round(rect.height), 1, bounds.height - originY),
  };
}
