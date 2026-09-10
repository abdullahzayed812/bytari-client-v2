import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/actions';
import { Badge, Card, Divider } from '@/components/content';
import { ConfirmationDialog, ErrorState, Loading, useToast } from '@/components/feedback';
import { SafeAreaScreen } from '@/components/layout';
import { FilePreview, FileUploader, ImagePreview, ImageUploader } from '@/components/media';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import {
  useAdminContentFileUrl,
  useAdminContentItem,
  useAdminContentLifecycle,
  useContentFilePresignProvider,
  useDeleteAdminContentFile,
} from '../hooks';
import type { AdminContentFile } from '../types';

const STATUS_TONE = {
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  ARCHIVED: 'warning',
} as const;

/** Route `/(app)/admin/veterinary-content/[type]/[contentId]` — preview + manage. */
export default function AdminContentDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('content');
  const toast = useToast();
  const { contentId } = useLocalSearchParams<{ type: 'MAGAZINE' | 'BOOK'; contentId: string }>();

  const q = useAdminContentItem(contentId);
  const { publish, archive, remove, restore } = useAdminContentLifecycle();
  const deleteFile = useDeleteAdminContentFile(contentId ?? '');
  const coverPresign = useContentFilePresignProvider(contentId, 'COVER');
  const mainPresign = useContentFilePresignProvider(contentId, 'MAIN');
  const attachmentPresign = useContentFilePresignProvider(contentId, 'ATTACHMENT');
  const coverUrl = useAdminContentFileUrl(
    contentId,
    q.data?.files.find((f) => f.kind === 'COVER')?.id,
  );

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [coverUploadKey, setCoverUploadKey] = useState(0);
  const [mainUploadKey, setMainUploadKey] = useState(0);
  const [attachmentUploadKey, setAttachmentUploadKey] = useState(0);

  const item = q.data;
  const main = item?.files.find((f) => f.kind === 'MAIN');
  const attachments = item?.files.filter((f) => f.kind === 'ATTACHMENT') ?? [];

  const onError = (error: unknown) => toast.show({ message: apiErrorMessage(error), tone: 'danger' });

  return (
    <SafeAreaScreen>
      <AppHeader
        title={t('admin.detail.title')}
        showBack
        right={
          item ? (
            <Button
              label={t('admin.detail.edit')}
              size="sm"
              variant="ghost"
              onPress={() =>
                router.push(
                  Routes.adminVeterinaryContentEdit(item.type as 'MAGAZINE' | 'BOOK', item.id),
                )
              }
            />
          ) : undefined
        }
      />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError || !item ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={{
            padding: theme.screenPadding,
            rowGap: theme.spacing.lg,
            paddingBottom: theme.spacing.huge,
          }}
        >
          <Card variant="outlined" padding="md">
            <View style={{ rowGap: theme.spacing.xs }}>
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Text variant="title" style={{ flex: 1 }}>
                  {item.title}
                </Text>
                <Badge label={t(`admin.status.${item.status}`)} tone={STATUS_TONE[item.status]} size="sm" />
              </View>
              <Caption>
                {item.authorName ?? '—'} · {t('admin.list.commentCount', { count: item.commentCount })} ·{' '}
                {t('admin.list.likeCount', { count: item.likeCount })} ·{' '}
                {t('admin.detail.viewCount', { count: item.viewCount })}
              </Caption>
              {item.type === 'BOOK' ? (
                <Caption>
                  {[
                    item.language,
                    item.pageCount ? t('admin.detail.pages', { count: item.pageCount }) : null,
                    item.publishYear,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Caption>
              ) : null}
              {item.description ? (
                <Text variant="body" color="textSecondary">
                  {item.description}
                </Text>
              ) : null}
              {item.categories.length > 0 ? (
                <Caption>{item.categories.map((c) => c.name).join(' · ')}</Caption>
              ) : null}
            </View>
          </Card>

          <View style={{ rowGap: theme.spacing.sm }}>
            <Label>{t('admin.detail.cover')}</Label>
            <ImageUploader
              key={coverUploadKey}
              value={coverUrl.data?.url ?? null}
              provider={coverPresign}
              onChange={(result) => {
                if (result) {
                  setCoverUploadKey((k) => k + 1);
                  toast.show({ message: t('admin.detail.fileUploaded'), tone: 'success' });
                }
              }}
            />
          </View>

          <View style={{ rowGap: theme.spacing.sm }}>
            <Label>{t('admin.detail.mainFile')}</Label>
            {main ? (
              <FilePreview
                name={main.originalFilename}
                mimeType={main.mimeType}
                size={main.sizeBytes}
                onRemove={() => deleteFile.mutate(main.id, { onError })}
              />
            ) : null}
            <FileUploader
              key={mainUploadKey}
              provider={mainPresign}
              label={main ? t('admin.detail.replaceFile') : t('admin.detail.addFile')}
              onChange={(result) => {
                if (result) {
                  setMainUploadKey((k) => k + 1);
                  toast.show({ message: t('admin.detail.fileUploaded'), tone: 'success' });
                }
              }}
            />
          </View>

          {item.type === 'MAGAZINE' ? (
            <View style={{ rowGap: theme.spacing.sm }}>
              <Label>{t('admin.detail.attachments')}</Label>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
                {attachments.map((f) => (
                  <AttachmentThumbnail
                    key={f.id}
                    contentId={item.id}
                    file={f}
                    onRemove={() => deleteFile.mutate(f.id, { onError })}
                  />
                ))}
                <ImageUploader
                  key={attachmentUploadKey}
                  value={null}
                  provider={attachmentPresign}
                  icon="add"
                  onChange={(result) => {
                    if (result) setAttachmentUploadKey((k) => k + 1);
                  }}
                />
              </View>
            </View>
          ) : null}

          <Divider />

          <View style={{ rowGap: theme.spacing.sm }}>
            {item.deletedAt ? (
              <Button
                label={t('admin.detail.restore')}
                variant="outline"
                fullWidth
                loading={restore.isPending}
                onPress={() => restore.mutate(item.id, { onError })}
              />
            ) : (
              <>
                {item.status === 'DRAFT' || item.status === 'ARCHIVED' ? (
                  <Button
                    label={t('admin.detail.publish')}
                    fullWidth
                    loading={publish.isPending}
                    onPress={() => publish.mutate(item.id, { onError })}
                  />
                ) : null}
                {item.status === 'PUBLISHED' ? (
                  <Button
                    label={t('admin.detail.archive')}
                    variant="outline"
                    fullWidth
                    loading={archive.isPending}
                    onPress={() => archive.mutate(item.id, { onError })}
                  />
                ) : null}
                <Button
                  label={t('admin.detail.delete')}
                  variant="danger"
                  fullWidth
                  loading={remove.isPending}
                  onPress={() => setConfirmDelete(true)}
                />
              </>
            )}
          </View>
        </ScrollView>
      )}

      <ConfirmationDialog
        visible={confirmDelete}
        title={t('admin.detail.delete')}
        message={t('admin.detail.deleteConfirm')}
        confirmLabel={t('admin.detail.delete')}
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          if (item) remove.mutate(item.id, { onError });
        }}
      />
    </SafeAreaScreen>
  );
}

/** One attachment thumbnail — its own fixed hook call resolves that file's signed URL. */
function AttachmentThumbnail({
  contentId,
  file,
  onRemove,
}: {
  contentId: string;
  file: AdminContentFile;
  onRemove: () => void;
}) {
  const theme = useTheme();
  const url = useAdminContentFileUrl(contentId, file.id);
  if (!url.data?.url) {
    return (
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.surfaceAccent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loading />
      </View>
    );
  }
  return <ImagePreview uri={url.data.url} size={96} onRemove={onRemove} />;
}
