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

export type CropAspect = 'original' | '1:1' | '4:3' | '3:4' | '16:9';
export const CROP_ASPECTS: CropAspect[] = ['original', '1:1', '4:3', '3:4', '16:9'];

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
