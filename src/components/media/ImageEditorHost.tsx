import { Image } from 'expo-image';
import { manipulateAsync, SaveFormat, type Action } from 'expo-image-manipulator';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image as RNImage,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  View,
  type LayoutChangeEvent,
  type PanResponderInstance,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconButton } from '@/components/actions';
import { Chip } from '@/components/content';
import { Loading } from '@/components/feedback';
import { Caption, Label, Text } from '@/components/typography';
import { createLogger } from '@/lib/logger';
import {
  computeResize,
  cropActionOf,
  CROP_ASPECTS,
  initialCropRect,
  lockedRatio,
  moveCropRect,
  registerImageEditor,
  resizeCropRect,
  RESIZE_OPTIONS,
  type CropAspect,
  type CropCorner,
  type CropRect,
  type EditOutcome,
  type ImageEditOptions,
  type LocalFile,
  type ResizeOption,
} from '@/services/media';
import { useTheme } from '@/theme';

const log = createLogger('image-editor');
const PREVIEW_MAX = 1200;
/** Smallest crop box, in on-screen points. */
const MIN_BOX = 48;
const HANDLE = 28;
const CORNERS: CropCorner[] = ['tl', 'tr', 'bl', 'br'];

/**
 * Web: stop the browser from scrolling / text-selecting / image-dragging while
 * the crop box is dragged with a finger or the mouse. Ignored on native.
 */
const WEB_NO_TOUCH_SCROLL = (
  Platform.OS === 'web' ? { touchAction: 'none', userSelect: 'none', cursor: 'move' } : {}
) as ViewStyle;

interface Job {
  file: LocalFile;
  options: ImageEditOptions & { index: number; total: number };
  resolve: (outcome: EditOutcome) => void;
}

interface Size {
  width: number;
  height: number;
}

function getSize(uri: string): Promise<Size> {
  return new Promise((resolve, reject) =>
    RNImage.getSize(uri, (width, height) => resolve({ width, height }), reject),
  );
}

/** Width/height after a 0/90/180/270° rotation. */
function rotated(size: Size, rotation: number): Size {
  return rotation % 180 === 0 ? size : { width: size.height, height: size.width };
}

function isWholeImage(rect: CropRect, base: Size): boolean {
  const c = cropActionOf(rect, base);
  return c.originX === 0 && c.originY === 0 && c.width === base.width && c.height === base.height;
}

function buildActions(
  rotation: number,
  base: Size,
  rect: CropRect | null,
  maxDimension: ResizeOption,
): Action[] {
  const actions: Action[] = [];
  if (rotation) actions.push({ rotate: rotation });
  let out = base;
  if (rect && !isWholeImage(rect, base)) {
    const crop = cropActionOf(rect, base);
    actions.push({ crop });
    out = { width: crop.width, height: crop.height };
  }
  const resize = computeResize(out.width, out.height, maxDimension);
  if (resize) actions.push({ resize });
  return actions;
}

/**
 * The app-wide image editor: free / ratio-locked manual DRAG-crop (move the
 * frame, drag its corners), rotate, resize to a longest-edge cap. Mounted
 * ONCE at the root; every `pickImage` / `pickImages` call routes the picked
 * image through it via `registerImageEditor`, so all upload locations share
 * one implementation on iOS, Android and web (PanResponder works with touch
 * and mouse through react-native-web). Output is a re-encoded JPEG — the
 * backend still validates type (magic bytes), size and ownership on upload.
 */
export function ImageEditorHost() {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const queue = useRef<Job[]>([]);
  const active = useRef(false);
  const [job, setJob] = useState<Job | null>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [aspect, setAspect] = useState<CropAspect>('free');
  const [maxDimension, setMaxDimension] = useState<ResizeOption>(null);
  const [rotation, setRotation] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [rect, setRect] = useState<CropRect | null>(null);
  const [stage, setStage] = useState<Size | null>(null);
  const [busy, setBusy] = useState(false);

  const base = useMemo(() => (size ? rotated(size, rotation) : null), [size, rotation]);
  const ratio = base ? lockedRatio(aspect, base.width, base.height) : null;
  // source px → on-screen points, fitting the rotated image inside the stage
  const scale = base && stage ? Math.min(stage.width / base.width, stage.height / base.height) : 0;

  // Gesture handlers read the latest values through a ref (they are created once).
  const live = useRef({ rect, base, ratio, scale });
  live.current = { rect, base, ratio, scale };

  const next = useCallback(() => {
    const upcoming = queue.current.shift() ?? null;
    active.current = upcoming !== null;
    setJob(upcoming);
    if (!upcoming) return;
    const aspects = upcoming.options.aspects ?? CROP_ASPECTS;
    setAspect(upcoming.options.defaultAspect ?? aspects[0] ?? 'free');
    setMaxDimension(upcoming.options.defaultMaxDimension ?? 2048);
    setRotation(0);
    setPreview(null);
    setRect(null);
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

  // Down-scaled, rotated (uncropped) image the crop frame is drawn over.
  useEffect(() => {
    if (!job || !size) return;
    let cancelled = false;
    const actions: Action[] = [];
    if (rotation) actions.push({ rotate: rotation });
    const r = rotated(size, rotation);
    const resize = computeResize(r.width, r.height, PREVIEW_MAX);
    if (resize) actions.push({ resize });
    manipulateAsync(job.file.uri, actions, { compress: 0.7, format: SaveFormat.JPEG })
      .then((out) => {
        if (!cancelled) setPreview(out.uri);
      })
      .catch((error: unknown) => {
        log.warn('preview failed — showing the original', { error });
        if (!cancelled) setPreview(job.file.uri);
      });
    return () => {
      cancelled = true;
    };
  }, [job, size, rotation]);

  // A new image, rotation or aspect starts from that aspect's largest centred frame.
  useEffect(() => {
    if (base) setRect(initialCropRect(base.width, base.height, aspect));
  }, [base, aspect]);

  const responders = useMemo(() => {
    const make = (kind: 'move' | CropCorner): PanResponderInstance => {
      let start: CropRect | null = null;
      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          start = live.current.rect;
        },
        onPanResponderMove: (_e, g) => {
          const { base: b, ratio: lock, scale: s } = live.current;
          if (!start || !b || !s) return;
          const dx = g.dx / s;
          const dy = g.dy / s;
          setRect(
            kind === 'move'
              ? moveCropRect(start, dx, dy, b)
              : resizeCropRect(start, kind, dx, dy, b, lock, MIN_BOX / s),
          );
        },
        onPanResponderRelease: () => {
          start = null;
        },
        onPanResponderTerminate: () => {
          start = null;
        },
      });
    };
    return {
      move: make('move'),
      tl: make('tl'),
      tr: make('tr'),
      bl: make('bl'),
      br: make('br'),
    };
  }, []);

  const finish = (outcome: EditOutcome) => {
    job?.resolve(outcome);
    next();
  };

  const apply = async () => {
    if (!job || !base) return;
    setBusy(true);
    try {
      const actions = buildActions(rotation, base, rect, maxDimension);
      if (actions.length === 0) {
        finish(job.file);
        return;
      }
      const r = await manipulateAsync(job.file.uri, actions, {
        compress: 0.85,
        format: SaveFormat.JPEG,
      });
      const name = job.file.name.replace(/\.[^.]+$/, '') || `image-${Date.now()}`;
      // The re-encoded file's byte size — every presign endpoint requires it.
      const outputBytes = await fetch(r.uri)
        .then((res) => res.blob())
        .then((b) => b.size)
        .catch(() => undefined);
      finish({
        uri: r.uri,
        name: `${name}.jpg`,
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

  const onStageLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setStage((cur) =>
      cur && cur.width === width && cur.height === height ? cur : { width, height },
    );
  };

  if (!job) return null;
  const aspects = job.options.aspects ?? CROP_ASPECTS;
  const crop = base && rect ? cropActionOf(rect, base) : null;
  const result = crop
    ? (() => {
        const r = computeResize(crop.width, crop.height, maxDimension);
        if (!r) return crop;
        return 'width' in r
          ? { width: r.width, height: Math.round((crop.height * r.width) / crop.width) }
          : { width: Math.round((crop.width * r.height) / crop.height), height: r.height };
      })()
    : null;

  const dispW = base ? base.width * scale : 0;
  const dispH = base ? base.height * scale : 0;
  const box = rect
    ? {
        left: rect.x * scale,
        top: rect.y * scale,
        width: rect.width * scale,
        height: rect.height * scale,
      }
    : null;
  const shade = 'rgba(0,0,0,0.5)';

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
          <View style={{ flexDirection: 'row', columnGap: theme.spacing.xs }}>
            <IconButton
              icon="scan-outline"
              variant="soft"
              accessibilityLabel={t('media.editor.reset')}
              onPress={() => base && setRect(initialCropRect(base.width, base.height, aspect))}
            />
            <IconButton
              icon="refresh-outline"
              variant="soft"
              accessibilityLabel={t('media.editor.rotate')}
              onPress={() => setRotation((r) => (r + 90) % 360)}
            />
          </View>
        </View>

        <View
          onLayout={onStageLayout}
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
          {preview && base && scale > 0 && box ? (
            // Geometry is in physical pixels: pin LTR so RTL never mirrors `left`.
            <View style={{ width: dispW, height: dispH, direction: 'ltr' }}>
              <Image
                source={{ uri: preview }}
                style={{ width: dispW, height: dispH }}
                contentFit="fill"
                pointerEvents="none"
                accessibilityLabel={t('media.editor.preview')}
              />
              {/* dim everything outside the crop frame */}
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: dispW,
                  height: box.top,
                  backgroundColor: shade,
                }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: 0,
                  top: box.top + box.height,
                  width: dispW,
                  height: dispH - box.top - box.height,
                  backgroundColor: shade,
                }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: 0,
                  top: box.top,
                  width: box.left,
                  height: box.height,
                  backgroundColor: shade,
                }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: box.left + box.width,
                  top: box.top,
                  width: dispW - box.left - box.width,
                  height: box.height,
                  backgroundColor: shade,
                }}
              />

              {/* the draggable frame */}
              <View
                {...responders.move.panHandlers}
                accessible
                accessibilityLabel={t('media.editor.cropArea')}
                style={[
                  {
                    position: 'absolute',
                    left: box.left,
                    top: box.top,
                    width: box.width,
                    height: box.height,
                    borderWidth: 2,
                    borderColor: '#ffffff',
                  },
                  WEB_NO_TOUCH_SCROLL,
                ]}
              >
                {/* rule-of-thirds guides */}
                {[1, 2].map((i) => (
                  <View
                    key={`v${i}`}
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: (box.width * i) / 3,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      backgroundColor: 'rgba(255,255,255,0.45)',
                    }}
                  />
                ))}
                {[1, 2].map((i) => (
                  <View
                    key={`h${i}`}
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: (box.height * i) / 3,
                      left: 0,
                      right: 0,
                      height: 1,
                      backgroundColor: 'rgba(255,255,255,0.45)',
                    }}
                  />
                ))}
                {CORNERS.map((c) => (
                  <View
                    key={c}
                    {...responders[c].panHandlers}
                    accessible
                    accessibilityLabel={t('media.editor.cropHandle')}
                    hitSlop={12}
                    style={[
                      {
                        position: 'absolute',
                        width: HANDLE,
                        height: HANDLE,
                        left: c === 'tl' || c === 'bl' ? -HANDLE / 2 : box.width - HANDLE / 2,
                        top: c === 'tl' || c === 'tr' ? -HANDLE / 2 : box.height - HANDLE / 2,
                        borderRadius: HANDLE / 2,
                        backgroundColor: '#ffffff',
                        borderWidth: 2,
                        borderColor: theme.colors.primary,
                      },
                      WEB_NO_TOUCH_SCROLL,
                      Platform.OS === 'web'
                        ? ({
                            cursor: c === 'tl' || c === 'br' ? 'nwse-resize' : 'nesw-resize',
                          } as unknown as ViewStyle) // web-only CSS cursors
                        : null,
                    ]}
                  />
                ))}
              </View>
            </View>
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
          <Caption color="textSecondary">{t('media.editor.dragHint')}</Caption>
          {aspects.length > 1 ? (
            <>
              <Label>{t('media.editor.aspect')}</Label>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                {aspects.map((a) => (
                  <Chip
                    key={a}
                    label={
                      a === 'original'
                        ? t('media.editor.original')
                        : a === 'free'
                          ? t('media.editor.free')
                          : a
                    }
                    selected={aspect === a}
                    onPress={() => setAspect(a)}
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
              disabled={busy || !base || !rect}
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
