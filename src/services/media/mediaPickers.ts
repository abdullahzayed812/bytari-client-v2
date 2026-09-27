import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { createLogger } from '@/lib/logger';
import type { LocalFile } from '@/services/files/types';

import { editImage, isImageEditorAvailable, type ImageEditOptions } from './imageEditing';

/**
 * Thin, permission-aware wrappers over `expo-image-picker` / `expo-document-picker`
 * that always return the shared {@link LocalFile} shape (or `null` on cancel).
 *
 * Permission denial throws {@link MediaPermissionError} so the UI can steer the
 * user to Settings; everything else (cancel, no selection) resolves to `null`.
 */

const log = createLogger('media-picker');

export class MediaPermissionError extends Error {
  constructor(public readonly kind: 'camera' | 'library') {
    super(`${kind} permission denied`);
    this.name = 'MediaPermissionError';
  }
}

export type PickSource = 'camera' | 'library';

function assetToLocalFile(
  asset: ImagePicker.ImagePickerAsset,
  fallbackMime = 'image/jpeg',
): LocalFile {
  const mimeType = asset.mimeType ?? fallbackMime;
  const name =
    asset.fileName ??
    asset.uri.split('/').pop() ??
    `${mimeType.split('/')[0]}-${Date.now()}.${mimeType.split('/')[1] ?? 'bin'}`;
  return {
    uri: asset.uri,
    name,
    mimeType,
    size: asset.fileSize,
    width: asset.width,
    height: asset.height,
  };
}

export interface PickImageOptions {
  source?: PickSource;
  /**
   * Legacy native crop. Only used when the shared editor is NOT mounted —
   * with `<ImageEditorHost />` present the shared editor replaces it.
   */
  allowsEditing?: boolean;
  /** 0–1 JPEG quality after resize. Default `0.7`. */
  quality?: number;
  /**
   * Shared editor step (crop / aspect / resize / preview). Default: on, free
   * aspect. `false` keeps the ORIGINAL untouched — required for identity
   * documents / certificates that must not be cropped.
   */
  edit?: ImageEditOptions | false;
}

export async function pickImage(options: PickImageOptions = {}): Promise<LocalFile | null> {
  const { source = 'library', quality = 0.7, edit = {} } = options;
  const editorActive = edit !== false && isImageEditorAvailable();
  // Never let the native picker crop when the shared editor runs or when the
  // original must be preserved.
  const allowsEditing = edit === false || editorActive ? false : (options.allowsEditing ?? true);
  const finish = async (file: LocalFile): Promise<LocalFile | null> => {
    if (!editorActive) return file;
    const out = await editImage(file, edit);
    return out === 'keep-rest' ? file : out;
  };

  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new MediaPermissionError('camera');
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing,
      quality,
    });
    if (res.canceled || !res.assets[0]) return null;
    return finish(assetToLocalFile(res.assets[0]));
  }

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new MediaPermissionError('library');
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing,
    quality,
  });
  if (res.canceled || !res.assets[0]) return null;
  return finish(assetToLocalFile(res.assets[0]));
}

/**
 * Multi-select. Each picked image goes through the shared editor in turn
 * ("1 / 3"); the user may cancel one (dropped) or keep the remaining originals.
 */
export async function pickImages(
  options: { max?: number; quality?: number; edit?: ImageEditOptions | false } = {},
): Promise<LocalFile[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new MediaPermissionError('library');
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: options.max ?? 10,
    quality: options.quality ?? 0.7,
  });
  if (res.canceled) return [];
  const files = res.assets.map((a) => assetToLocalFile(a));
  if (options.edit === false || !isImageEditorAvailable()) return files;
  const out: LocalFile[] = [];
  for (let i = 0; i < files.length; i += 1) {
    const file = files[i] as LocalFile;
    const edited = await editImage(file, {
      ...(options.edit ?? {}),
      index: i,
      total: files.length,
    });
    if (edited === 'keep-rest') {
      out.push(...files.slice(i));
      break;
    }
    if (edited) out.push(edited);
  }
  return out;
}

/** One video from the library or camera (no editing — originals are sent as-is). */
export async function pickVideo(
  options: { source?: PickSource; maxDurationSeconds?: number } = {},
): Promise<LocalFile | null> {
  const { source = 'library', maxDurationSeconds = 180 } = options;
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new MediaPermissionError('camera');
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: maxDurationSeconds,
    });
    if (res.canceled || !res.assets[0]) return null;
    return assetToLocalFile(res.assets[0], 'video/mp4');
  }
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new MediaPermissionError('library');
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    videoMaxDuration: maxDurationSeconds,
  });
  if (res.canceled || !res.assets[0]) return null;
  return assetToLocalFile(res.assets[0], 'video/mp4');
}

export interface PickDocumentOptions {
  /** MIME types / extensions to allow, e.g. `['application/pdf', 'image/*']`. */
  types?: string[];
  multiple?: boolean;
}

export async function pickDocument(options: PickDocumentOptions = {}): Promise<LocalFile[]> {
  const res = await DocumentPicker.getDocumentAsync({
    type: options.types ?? ['application/pdf', 'image/*'],
    multiple: options.multiple ?? false,
    copyToCacheDirectory: true,
  });
  if (res.canceled) return [];
  return res.assets.map((a) => ({
    uri: a.uri,
    name: a.name,
    mimeType: a.mimeType ?? 'application/octet-stream',
    size: a.size ?? undefined,
  }));
}

export function isPermissionError(error: unknown): error is MediaPermissionError {
  return error instanceof MediaPermissionError;
}

export { log as mediaPickerLog };
