import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/actions';
import { Badge } from '@/components/content';
import {
  Alert,
  ConfirmationDialog,
  ErrorState,
  Loading,
  useToast,
} from '@/components/feedback';
import { FormField, Select, Switch } from '@/components/forms';
import { ImageUploader } from '@/components/media';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage, fieldErrors } from '@/lib/apiError';
import { useTheme } from '@/theme';

import {
  useEditorialCoverProvider,
  useEditorialItem,
  useEditorialLifecycle,
  useSaveEditorialItem,
} from '../hooks';
import {
  NEWS_TAGS,
  TIP_PRIORITIES,
  isEditorialKind,
  type EditorialInput,
  type EditorialItem,
  type EditorialKind,
  type NewsTag,
  type TipPriority,
} from '../types';

const MAX_POINTS = 20;
const POINT_MAX = 500;

/** One point per line — blank lines dropped (mirrors the server's `string[]` of ≤ 20 × ≤ 500 chars). */
function splitPoints(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

interface SchemaMessages {
  titleRequired: string;
  readMinutes: string;
  tooManyPoints: string;
  pointTooLong: string;
}

function buildSchema(m: SchemaMessages) {
  const points = z
    .string()
    .refine((v) => splitPoints(v).length <= MAX_POINTS, m.tooManyPoints)
    .refine((v) => splitPoints(v).every((p) => p.length <= POINT_MAX), m.pointTooLong);
  return z.object({
    title: z.string().trim().min(1, m.titleRequired).max(300),
    summary: z.string().trim().max(4000),
    // tips
    readMinutes: z
      .string()
      .trim()
      .refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 240), {
        message: m.readMinutes,
      }),
    priority: z.enum(TIP_PRIORITIES),
    bodyIntro: z.string().trim().max(20_000),
    keyPoints: points,
    warningPoints: points,
    vetAdvice: z.string().trim().max(4000),
    // news
    source: z.string().trim().max(200),
    tag: z.enum(NEWS_TAGS),
    isFeatured: z.boolean(),
    body: z.string().trim().max(20_000),
    reasonPoints: points,
    advicePoints: points,
    alertNote: z.string().trim().max(2000),
  });
}
type FormValues = z.infer<ReturnType<typeof buildSchema>>;

function toFormValues(item: EditorialItem | undefined): FormValues {
  return {
    title: item?.title ?? '',
    summary: item?.summary ?? '',
    readMinutes: item?.readMinutes != null ? String(item.readMinutes) : '',
    priority: item?.priority ?? 'NORMAL',
    bodyIntro: item?.bodyIntro ?? '',
    keyPoints: (item?.keyPoints ?? []).join('\n'),
    warningPoints: (item?.warningPoints ?? []).join('\n'),
    vetAdvice: item?.vetAdvice ?? '',
    source: item?.source ?? '',
    tag: item?.tag ?? 'NORMAL',
    isFeatured: item?.isFeatured ?? false,
    body: item?.body ?? '',
    reasonPoints: (item?.reasonPoints ?? []).join('\n'),
    advicePoints: (item?.advicePoints ?? []).join('\n'),
    alertNote: item?.alertNote ?? '',
  };
}

const orNull = (v: string): string | null => (v.trim() ? v.trim() : null);

/** Only the keys the kind's strict server schema accepts. */
function toInput(kind: EditorialKind, v: FormValues): EditorialInput {
  const common = { title: v.title.trim(), summary: orNull(v.summary) };
  if (kind === 'tips') {
    return {
      ...common,
      readMinutes: v.readMinutes ? Number(v.readMinutes) : null,
      priority: v.priority,
      bodyIntro: orNull(v.bodyIntro),
      keyPoints: splitPoints(v.keyPoints),
      warningPoints: splitPoints(v.warningPoints),
      vetAdvice: orNull(v.vetAdvice),
    };
  }
  return {
    ...common,
    source: orNull(v.source),
    tag: v.tag,
    isFeatured: v.isFeatured,
    body: orNull(v.body),
    reasonPoints: splitPoints(v.reasonPoints),
    advicePoints: splitPoints(v.advicePoints),
    alertNote: orNull(v.alertNote),
  };
}

/**
 * `/admin/editorial/[kind]/create` and `/admin/editorial/[kind]/[itemId]` —
 * ONE page for every field of a tip / news item (no multi-step wizard). A new
 * item is saved as DRAFT; the cover image is uploaded (presigned R2) once the
 * item exists, then it can be published / unpublished / deleted here.
 */
export default function EditorialAdminFormScreen() {
  const theme = useTheme();
  const { t } = useTranslation('admin');
  const { t: tTips } = useTranslation('tips');
  const { t: tNews } = useTranslation('news');
  const toast = useToast();
  const params = useLocalSearchParams<{ kind: string; itemId?: string }>();
  const kind: EditorialKind = isEditorialKind(params.kind) ? params.kind : 'tips';
  const itemId = params.itemId;
  const isTips = kind === 'tips';

  const detail = useEditorialItem(kind, itemId);
  const save = useSaveEditorialItem(kind, itemId);
  const { publish, archive, remove } = useEditorialLifecycle(kind);
  const coverProvider = useEditorialCoverProvider(kind, itemId);
  const [formError, setFormError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const schema = useMemo(
    () =>
      buildSchema({
        titleRequired: t('editorial.errors.titleRequired'),
        readMinutes: t('editorial.errors.readMinutes'),
        tooManyPoints: t('editorial.errors.tooManyPoints', { max: MAX_POINTS }),
        pointTooLong: t('editorial.errors.pointTooLong', { max: POINT_MAX }),
      }),
    [t],
  );
  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(undefined),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (detail.data) reset(toFormValues(detail.data));
  }, [detail.data, reset]);

  if (itemId && detail.isLoading) {
    return (
      <ScrollScreen>
        <Loading fill />
      </ScrollScreen>
    );
  }
  if (itemId && (detail.isError || !detail.data)) {
    return (
      <ScrollScreen>
        <AppHeader title={t(`editorial.title.${kind}`)} showBack />
        <ErrorState error={detail.error} onRetry={() => void detail.refetch()} />
      </ScrollScreen>
    );
  }

  const item = detail.data;
  const onError = (e: unknown) => toast.show({ message: apiErrorMessage(e), tone: 'danger' });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    setServerFields({});
    save.mutate(toInput(kind, values), {
      onSuccess: (saved) => {
        toast.show({ message: t('editorial.saved'), tone: 'success' });
        // A brand-new item continues on its edit page (cover + publish live there).
        if (!itemId) router.replace(Routes.adminEditorialEdit(kind, saved.id));
      },
      onError: (e) => {
        setServerFields(fieldErrors(e));
        setFormError(apiErrorMessage(e));
      },
    });
  });

  const pointsField = (name: keyof FormValues, label: string) => (
    <FormField
      control={control}
      name={name}
      label={label}
      hint={t('editorial.pointsHint')}
      multiline
      numberOfLines={4}
      serverError={serverFields[name]}
    />
  );

  return (
    <ScrollScreen>
      <AppHeader
        title={itemId ? t(`editorial.edit.${kind}`) : t(`editorial.add.${kind}`)}
        showBack
      />
      <Section spacing="lg" style={{ rowGap: theme.spacing.lg }}>
        {formError ? <Alert tone="danger" message={formError} /> : null}

        {item ? (
          <Row gap="sm">
            <Badge label={t(`editorial.status.${item.status}`)} size="sm" />
          </Row>
        ) : (
          <Caption>{t('editorial.draftHint')}</Caption>
        )}

        {itemId ? (
          <View style={{ rowGap: theme.spacing.xs }}>
            <Label>{t('editorial.cover')}</Label>
            <ImageUploader
              value={item?.coverImageUrl ?? null}
              provider={coverProvider}
              onChange={() => void detail.refetch()}
              size={140}
            />
          </View>
        ) : null}

        <FormField
          control={control}
          name="title"
          label={t('editorial.fields.title')}
          required
          serverError={serverFields.title}
        />
        <FormField
          control={control}
          name="summary"
          label={t('editorial.fields.summary')}
          multiline
          numberOfLines={3}
          serverError={serverFields.summary}
        />

        {isTips ? (
          <>
            <Controller
              control={control}
              name="priority"
              render={({ field: { value, onChange } }) => (
                <Select<TipPriority>
                  label={t('editorial.fields.priority')}
                  value={value}
                  options={TIP_PRIORITIES.map((p) => ({ value: p, label: tTips(`priority.${p}`) }))}
                  onChange={onChange}
                />
              )}
            />
            <FormField
              control={control}
              name="readMinutes"
              label={t('editorial.fields.readMinutes')}
              keyboardType="number-pad"
              serverError={serverFields.readMinutes}
            />
            <FormField
              control={control}
              name="bodyIntro"
              label={t('editorial.fields.bodyIntro')}
              multiline
              numberOfLines={6}
              serverError={serverFields.bodyIntro}
            />
            {pointsField('keyPoints', t('editorial.fields.keyPoints'))}
            {pointsField('warningPoints', t('editorial.fields.warningPoints'))}
            <FormField
              control={control}
              name="vetAdvice"
              label={t('editorial.fields.vetAdvice')}
              multiline
              numberOfLines={3}
              serverError={serverFields.vetAdvice}
            />
          </>
        ) : (
          <>
            <Controller
              control={control}
              name="tag"
              render={({ field: { value, onChange } }) => (
                <Select<NewsTag>
                  label={t('editorial.fields.tag')}
                  value={value}
                  options={NEWS_TAGS.map((g) => ({ value: g, label: tNews(`tag.${g}`) }))}
                  onChange={onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="isFeatured"
              render={({ field: { value, onChange } }) => (
                <Switch
                  label={t('editorial.fields.isFeatured')}
                  value={value}
                  onValueChange={onChange}
                />
              )}
            />
            <FormField
              control={control}
              name="source"
              label={t('editorial.fields.source')}
              serverError={serverFields.source}
            />
            <FormField
              control={control}
              name="body"
              label={t('editorial.fields.body')}
              multiline
              numberOfLines={8}
              serverError={serverFields.body}
            />
            {pointsField('reasonPoints', t('editorial.fields.reasonPoints'))}
            {pointsField('advicePoints', t('editorial.fields.advicePoints'))}
            <FormField
              control={control}
              name="alertNote"
              label={t('editorial.fields.alertNote')}
              multiline
              numberOfLines={3}
              serverError={serverFields.alertNote}
            />
          </>
        )}

        <Button
          label={itemId ? t('editorial.save') : t('editorial.createDraft')}
          fullWidth
          loading={save.isPending}
          disabled={save.isPending}
          onPress={onSubmit}
        />

        {item ? (
          <View style={{ rowGap: theme.spacing.sm }}>
            {item.status !== 'PUBLISHED' ? (
              <Button
                label={t('editorial.publish')}
                variant="secondary"
                fullWidth
                loading={publish.isPending}
                onPress={() =>
                  publish.mutate(item.id, {
                    onSuccess: () => {
                      toast.show({ message: t('editorial.published'), tone: 'success' });
                      void detail.refetch();
                    },
                    onError,
                  })
                }
              />
            ) : (
              <Button
                label={t('editorial.unpublish')}
                variant="outline"
                fullWidth
                loading={archive.isPending}
                onPress={() =>
                  archive.mutate(item.id, {
                    onSuccess: () => {
                      toast.show({ message: t('editorial.unpublished'), tone: 'success' });
                      void detail.refetch();
                    },
                    onError,
                  })
                }
              />
            )}
            <Button
              label={t('editorial.delete')}
              variant="danger"
              fullWidth
              onPress={() => setConfirmDelete(true)}
            />
          </View>
        ) : null}
      </Section>

      <ConfirmationDialog
        visible={confirmDelete}
        title={t('editorial.deleteTitle')}
        message={t('editorial.deleteBody')}
        confirmLabel={t('editorial.delete')}
        cancelLabel={t('common.cancel')}
        destructive
        loading={remove.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (!item) return;
          remove.mutate(item.id, {
            onSuccess: () => {
              setConfirmDelete(false);
              toast.show({ message: t('editorial.deleted'), tone: 'success' });
              router.back();
            },
            onError: (e) => {
              setConfirmDelete(false);
              onError(e);
            },
          });
        }}
      />
    </ScrollScreen>
  );
}
