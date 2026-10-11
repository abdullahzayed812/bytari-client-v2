import { Image } from 'expo-image';
import { manipulateAsync, SaveFormat, type Action } from 'expo-image-manipulator';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image as RNImage,
  Modal,
  PanResponder,
  Platform,
  View,
  type LayoutChangeEvent,
  type PanResponderInstance,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconButton } from '@/components/actions';
import { Chip } from '@/components/content';
import { Loading } from '@/components/feedback';
import { Text } from '@/components/typography';
import { createLogger } from '@/lib/logger';
import {
  computeResize,
  editorAspects,
  initialCropRect,
  lockedRatio,
  moveCropRect,
  planEditActions,
  registerImageEditor,
  resizeCropRect,
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
/** Smallest crop box, in on-screen points. */
const MIN_BOX = 48;
const HANDLE = 28;
const CORNERS: CropCorner[] = ['tl', 'tr', 'bl', 'br'];
/** JPEG quality of the orientation-normalised working copy (re-encoded once more on save). */
const WORKING_QUALITY = 0.95;

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

/**
 * The image every crop coordinate refers to: the picked file re-encoded once
 * by the manipulator, which bakes in its EXIF orientation. Its `width/height`
 * are therefore the real, upright pixel size — the picker's reported size is
 * NOT trusted (on Android it can be the un-rotated sensor size, which put the
 * crop box on the wrong pixels). `downscaled` = smaller than the original.
 */
interface Working extends Size {
  uri: string;
  downscaled: boolean;
}

function getSize(uri: string): Promise<Size> {
  return new Promise((resolve, reject) =>
    RNImage.getSize(uri, (width, height) => resolve({ width, height }), reject),
  );
}

/**
 * The app-wide image editor — deliberately minimal: pick the image size /
 * dimensions (crop ratio), drag the frame and its corners to crop/resize, and
 * save. The output is always capped to a sensible longest edge
 * (`defaultMaxDimension`, 2048 px) without any extra control. Mounted
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
  const [working, setWorking] = useState<Working | null>(null);
  const [aspect, setAspect] = useState<CropAspect>('free');
  const [maxDimension, setMaxDimension] = useState<ResizeOption>(null);
  const [rect, setRect] = useState<CropRect | null>(null);
  const [stage, setStage] = useState<Size | null>(null);
  const [busy, setBusy] = useState(false);

  const base: Size | null = useMemo(
    () => (working ? { width: working.width, height: working.height } : null),
    [working],
  );
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
    const aspects = editorAspects(upcoming.options);
    const preferred = upcoming.options.defaultAspect;
    setAspect(preferred && aspects.includes(preferred) ? preferred : (aspects[0] ?? 'free'));
    setMaxDimension(upcoming.options.defaultMaxDimension ?? 2048);
    setWorking(null);
    setRect(null);
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

  // Build the working copy: orientation baked in, capped at the output's
  // longest edge (anything larger would be thrown away on save anyway).
  useEffect(() => {
    if (!job) return;
    let cancelled = false;
    const { file, options } = job;
    const cap = options.outputSize
      ? null
      : options.defaultMaxDimension === undefined
        ? 2048
        : options.defaultMaxDimension;
    const resize = file.width && file.height ? computeResize(file.width, file.height, cap) : null;
    const actions: Action[] = resize ? [{ resize }] : [];
    manipulateAsync(file.uri, actions, { compress: WORKING_QUALITY, format: SaveFormat.JPEG })
      .then((out) => {
        if (cancelled) return;
        setWorking({
          uri: out.uri,
          width: out.width,
          height: out.height,
          downscaled: resize !== null,
        });
      })
      .catch(async (error: unknown) => {
        log.warn('could not normalise the image — editing the original', { error });
        try {
          const s = await getSize(file.uri);
          if (!cancelled) setWorking({ uri: file.uri, ...s, downscaled: false });
        } catch (sizeError) {
          log.warn('could not read image size — passing the original through', {
            error: sizeError,
          });
          if (!cancelled) {
            job.resolve(file);
            next();
          }
        }
      });
    return () => {
      cancelled = true;
    };
  }, [job, next]);

  // A new image or aspect starts from that aspect's largest centred frame.
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
    if (!job || !working || !base) return;
    setBusy(true);
    try {
      const { actions } = planEditActions(base, rect, {
        maxDimension,
        outputSize: job.options.outputSize,
      });
      // Untouched and not downscaled → keep the original bytes (best quality).
      if (actions.length === 0 && !working.downscaled) {
        finish(job.file);
        return;
      }
      const r =
        actions.length === 0
          ? { uri: working.uri, width: working.width, height: working.height }
          : await manipulateAsync(working.uri, actions as Action[], {
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
  const aspects = editorAspects(job.options);
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
          <IconButton
            icon="close"
            variant="soft"
            accessibilityLabel={t('media.editor.cancel')}
            disabled={busy}
            onPress={() => finish(null)}
          />
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
          {working && base && scale > 0 && box ? (
            // Geometry is in physical pixels: pin LTR so RTL never mirrors `left`.
            <View style={{ width: dispW, height: dispH, direction: 'ltr' }}>
              <Image
                source={{ uri: working.uri }}
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

        {/* image size / dimensions */}
        {aspects.length > 1 ? (
          <View
            accessibilityLabel={t('media.editor.size')}
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: theme.spacing.xs,
              paddingHorizontal: theme.screenPadding,
            }}
          >
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
        ) : null}

        <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.md }}>
          <Button
            label={t('media.editor.save')}
            fullWidth
            loading={busy}
            disabled={busy || !base || !rect}
            onPress={() => void apply()}
          />
        </View>
      </View>
    </Modal>
  );
}
