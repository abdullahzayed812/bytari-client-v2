import { Image } from 'expo-image';
import { manipulateAsync, SaveFormat, type Action } from 'expo-image-manipulator';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image as RNImage, Modal, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconButton } from '@/components/actions';
import { Chip } from '@/components/content';
import { Loading } from '@/components/feedback';
import { Caption, Label, Text } from '@/components/typography';
import { createLogger } from '@/lib/logger';
import {
  computeCrop,
  computeResize,
  CROP_ASPECTS,
  registerImageEditor,
  RESIZE_OPTIONS,
  type CropAspect,
  type CropFocus,
  type EditOutcome,
  type ImageEditOptions,
  type LocalFile,
  type ResizeOption,
} from '@/services/media';
import { useTheme } from '@/theme';

const log = createLogger('image-editor');
const PREVIEW_MAX = 900;
const FOCI: CropFocus[] = ['start', 'center', 'end'];

interface Job {
  file: LocalFile;
  options: ImageEditOptions & { index: number; total: number };
  resolve: (outcome: EditOutcome) => void;
}

function getSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) =>
    RNImage.getSize(uri, (width, height) => resolve({ width, height }), reject),
  );
}

/** Width/height after a 0/90/180/270° rotation. */
function rotated(size: { width: number; height: number }, rotation: number) {
  return rotation % 180 === 0 ? size : { width: size.height, height: size.width };
}

function buildActions(
  size: { width: number; height: number },
  rotation: number,
  aspect: CropAspect,
  focus: CropFocus,
  maxDimension: ResizeOption,
): Action[] {
  const actions: Action[] = [];
  if (rotation) actions.push({ rotate: rotation });
  const base = rotated(size, rotation);
  const crop = computeCrop(base.width, base.height, aspect, focus);
  if (crop.width !== base.width || crop.height !== base.height) actions.push({ crop });
  const resize = computeResize(crop.width, crop.height, maxDimension);
  if (resize) actions.push({ resize });
  return actions;
}

/**
 * The app-wide image editor (crop by aspect ratio + crop position, resize to a
 * longest-edge cap, rotate, live preview). Mounted ONCE at the root; every
 * `pickImage` / `pickImages` call routes the picked image through it via
 * `registerImageEditor`, so all upload locations share one implementation.
 * Output is a re-encoded JPEG in the app cache — the backend still validates
 * type (magic bytes), size and ownership on upload.
 */
export function ImageEditorHost() {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const queue = useRef<Job[]>([]);
  const active = useRef(false);
  const [job, setJob] = useState<Job | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [aspect, setAspect] = useState<CropAspect>('original');
  const [focus, setFocus] = useState<CropFocus>('center');
  const [maxDimension, setMaxDimension] = useState<ResizeOption>(null);
  const [rotation, setRotation] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const next = useCallback(() => {
    const upcoming = queue.current.shift() ?? null;
    active.current = upcoming !== null;
    setJob(upcoming);
    if (!upcoming) return;
    const aspects = upcoming.options.aspects ?? CROP_ASPECTS;
    setAspect(upcoming.options.defaultAspect ?? aspects[0] ?? 'original');
    setMaxDimension(upcoming.options.defaultMaxDimension ?? 2048);
    setFocus('center');
    setRotation(0);
    setPreview(null);
    setSize(
      upcoming.file.width && upcoming.file.height
        ? { width: upcoming.file.width, height: upcoming.file.height }
        : null,
    );
  }, []);

  useEffect(
    () =>
      registerImageEditor(
        (file, options) =>
          new Promise<EditOutcome>((resolve) => {
            queue.current.push({ file, options, resolve });
            if (!active.current) next();
          }),
      ),
    [next],
  );

  // Resolve the source dimensions when the picker didn't report them.
  useEffect(() => {
    if (!job || size) return;
    getSize(job.file.uri)
      .then(setSize)
      .catch((error: unknown) => {
        log.warn('could not read image size — passing the original through', { error });
        job.resolve(job.file);
        next();
      });
  }, [job, size, next]);

  // Live, down-scaled preview of the current settings.
  useEffect(() => {
    if (!job || !size) return;
    let cancelled = false;
    const actions = buildActions(size, rotation, aspect, focus, PREVIEW_MAX);
    manipulateAsync(job.file.uri, actions, { compress: 0.6, format: SaveFormat.JPEG })
      .then((r) => {
        if (!cancelled) setPreview(r.uri);
      })
      .catch((error: unknown) => log.warn('preview failed', { error }));
    return () => {
      cancelled = true;
    };
  }, [job, size, rotation, aspect, focus]);

  const finish = (outcome: EditOutcome) => {
    job?.resolve(outcome);
    next();
  };

  const apply = async () => {
    if (!job || !size) return;
    setBusy(true);
    try {
      const actions = buildActions(size, rotation, aspect, focus, maxDimension);
      if (actions.length === 0) {
        finish(job.file);
        return;
      }
      const r = await manipulateAsync(job.file.uri, actions, {
        compress: 0.85,
        format: SaveFormat.JPEG,
      });
      const base = job.file.name.replace(/\.[^.]+$/, '') || `image-${Date.now()}`;
      // The re-encoded file's byte size — every presign endpoint requires it.
      const outputBytes = await fetch(r.uri)
        .then((res) => res.blob())
        .then((b) => b.size)
        .catch(() => undefined);
      finish({
        uri: r.uri,
        name: `${base}.jpg`,
        mimeType: 'image/jpeg',
        size: outputBytes,
        width: r.width,
        height: r.height,
      });
    } catch (error) {
      log.warn('edit failed — using the original', { error });
      finish(job.file);
    } finally {
      setBusy(false);
    }
  };

  if (!job) return null;
  const aspects = job.options.aspects ?? CROP_ASPECTS;
  const base = size ? rotated(size, rotation) : null;
  const crop = base ? computeCrop(base.width, base.height, aspect, 'center') : null;
  const trimmed = !!base && !!crop && (crop.width !== base.width || crop.height !== base.height);
  const result =
    base && crop
      ? (() => {
          const r = computeResize(crop.width, crop.height, maxDimension);
          if (!r) return crop;
          return 'width' in r
            ? { width: r.width, height: Math.round((crop.height * r.width) / crop.width) }
            : { width: Math.round((crop.width * r.height) / crop.height), height: r.height };
        })()
      : null;

  return (
    <Modal visible animationType="slide" onRequestClose={() => finish(null)} statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          paddingTop: insets.top + theme.spacing.sm,
          paddingBottom: Math.max(insets.bottom, theme.spacing.md),
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: theme.screenPadding,
          }}
        >
          <Text variant="title" weight="bold">
            {job.options.total > 1
              ? t('media.editor.titleMany', {
                  index: job.options.index + 1,
                  total: job.options.total,
                })
              : t('media.editor.title')}
          </Text>
          <IconButton
            icon="refresh-outline"
            variant="soft"
            accessibilityLabel={t('media.editor.rotate')}
            onPress={() => setRotation((r) => (r + 90) % 360)}
          />
        </View>

        <View
          style={{
            flex: 1,
            margin: theme.screenPadding,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.colors.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {preview ? (
            <Image
              source={{ uri: preview }}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
              accessibilityLabel={t('media.editor.preview')}
            />
          ) : (
            <Loading />
          )}
        </View>

        <ScrollView
          style={{ flexGrow: 0 }}
          contentContainerStyle={{
            paddingHorizontal: theme.screenPadding,
            rowGap: theme.spacing.sm,
          }}
        >
          {aspects.length > 1 ? (
            <>
              <Label>{t('media.editor.aspect')}</Label>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                {aspects.map((a) => (
                  <Chip
                    key={a}
                    label={a === 'original' ? t('media.editor.original') : a}
                    selected={aspect === a}
                    onPress={() => setAspect(a)}
                  />
                ))}
              </View>
            </>
          ) : null}

          {trimmed ? (
            <>
              <Label>{t('media.editor.position')}</Label>
              <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
                {FOCI.map((f) => (
                  <Chip
                    key={f}
                    label={t(`media.editor.focus.${f}`)}
                    selected={focus === f}
                    onPress={() => setFocus(f)}
                  />
                ))}
              </View>
            </>
          ) : null}

          <Label>{t('media.editor.size')}</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            {RESIZE_OPTIONS.map((m) => (
              <Chip
                key={String(m)}
                label={m ? t('media.editor.maxPx', { px: m }) : t('media.editor.original')}
                selected={maxDimension === m}
                onPress={() => setMaxDimension(m)}
              />
            ))}
          </View>
          {result ? (
            <Caption>
              {t('media.editor.resultSize', { width: result.width, height: result.height })}
            </Caption>
          ) : null}
        </ScrollView>

        <View
          style={{
            flexDirection: 'row',
            columnGap: theme.spacing.sm,
            paddingHorizontal: theme.screenPadding,
            paddingTop: theme.spacing.md,
          }}
        >
          <View style={{ flex: 2 }}>
            <Button
              label={t('media.editor.apply')}
              fullWidth
              loading={busy}
              disabled={busy || !size}
              onPress={() => void apply()}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t('media.editor.cancel')}
              variant="ghost"
              fullWidth
              disabled={busy}
              onPress={() => finish(null)}
            />
          </View>
        </View>
        {job.options.total > 1 && job.options.index + 1 < job.options.total ? (
          <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.xs }}>
            <Button
              label={t('media.editor.keepRest')}
              variant="ghost"
              size="sm"
              fullWidth
              disabled={busy}
              onPress={() => finish('keep-rest')}
            />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
