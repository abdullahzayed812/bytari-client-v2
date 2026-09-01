import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { createLogger } from '@/lib/logger';
import type { LocalFile } from '@/services/files/types';

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

function assetToLocalFile(asset: ImagePicker.ImagePickerAsset): LocalFile {
  const name =
    asset.fileName ??
    asset.uri.split('/').pop() ??
    `image-${Date.now()}.${(asset.mimeType ?? 'image/jpeg').split('/')[1] ?? 'jpg'}`;
  return {
    uri: asset.uri,
    name,
    mimeType: asset.mimeType ?? 'image/jpeg',
    size: asset.fileSize,
  };
}

export interface PickImageOptions {
  source?: PickSource;
  /** Square crop UI. Default `true` for avatars. */
  allowsEditing?: boolean;
  /** 0–1 JPEG quality after resize. Default `0.7`. */
  quality?: number;
}

export async function pickImage(options: PickImageOptions = {}): Promise<LocalFile | null> {
  const { source = 'library', allowsEditing = true, quality = 0.7 } = options;

  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new MediaPermissionError('camera');
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing,
      quality,
    });
    if (res.canceled || !res.assets[0]) return null;
    return assetToLocalFile(res.assets[0]);
  }

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new MediaPermissionError('library');
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing,
    quality,
  });
  if (res.canceled || !res.assets[0]) return null;
  return assetToLocalFile(res.assets[0]);
}

export async function pickImages(
  options: { max?: number; quality?: number } = {},
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
  return res.assets.map(assetToLocalFile);
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
