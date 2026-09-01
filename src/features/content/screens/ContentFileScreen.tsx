import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Card, Icon } from '@/components/content';
import { EmptyState, ErrorState, SkeletonText, useToast } from '@/components/feedback';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Heading, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { ApiError } from '@/services/api';
import { useTheme } from '@/theme';

import { CONTENT_FILE_KIND_ICON, formatFileSize, isViewableMime, mimeLabel } from '../constants';
import { useContentFileUrl, useContentItem } from '../hooks';
import { openExternalUrl } from '../openExternal';

/**
 * Route `/content/item/[contentId]/files/[fileId]` — the reader entry for a
 * content file (§10, §11). The backend has no in-app PDF/EPUB renderer contract
 * and this project is a managed Expo app with a web-export gate, so a native
 * PDF canvas (`react-native-pdf` + a dev client) is deliberately NOT added.
 * Instead the screen resolves the backend-authorized URL and hands it to the OS
 * viewer / browser (`openExternalUrl`, http/https only) — the platform renders
 * PDFs and images natively. Documented in MOBILE_ARCHITECTURE.md.
 */
export default function ContentFileScreen() {
  const theme = useTheme();
  const { t } = useTranslation('content');
  const toast = useToast();
  const { contentId, fileId } = useLocalSearchParams<{ contentId: string; fileId: string }>();
  const cId = contentId ?? '';
  const fId = fileId ?? '';

  const item = useContentItem(cId);
  const file = item.data?.files.find((f) => f.id === fId);
  const download = useContentFileUrl(cId, fId);
  const [opening, setOpening] = useState(false);

  const open = async () => {
    if (!download.data?.url || opening) return;
    setOpening(true);
    const ok = await openExternalUrl(download.data.url);
    setOpening(false);
    if (!ok) toast.show({ tone: 'danger', message: t('file.openFailed') });
  };

  const notFound =
    (item.error instanceof ApiError && (item.error.status === 404 || item.error.status === 403)) ||
    (download.error instanceof ApiError &&
      (download.error.status === 404 || download.error.status === 403)) ||
    (item.isSuccess && !file);

  if (notFound) {
    return (
      <ScrollScreen>
        <AppHeader title={t('file.title')} showBack />
        <EmptyState
          icon="document-outline"
          title={t('file.notFoundTitle')}
          message={t('file.notFoundBody')}
          actionLabel={t('detail.backToContent')}
          onAction={() => router.replace(Routes.contentHome)}
        />
      </ScrollScreen>
    );
  }

  const loading = item.isLoading || download.isLoading;
  const viewable = isViewableMime(file?.mimeType);

  return (
    <ScrollScreen>
      <AppHeader title={t('file.title')} showBack />

      {loading || !file ? (
        <Section spacing="xl">
          <SkeletonText lines={5} />
        </Section>
      ) : (
        <>
          <Section spacing="lg">
            <Row gap="md" align="center">
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.surfaceAccent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={CONTENT_FILE_KIND_ICON[file.kind]} size="iconLg" color="primary" />
              </View>
              <View style={{ flex: 1, rowGap: 4 }}>
                <Heading level={3} numberOfLines={3}>
                  {file.originalFilename}
                </Heading>
                <Caption>
                  {mimeLabel(file.mimeType)} · {formatFileSize(file.sizeBytes)}
                </Caption>
              </View>
            </Row>
          </Section>

          <Section spacing="lg">
            <Card variant="outlined" padding="md">
              <Text variant="body">
                {viewable ? t('file.viewableHint') : t('file.notViewableHint')}
              </Text>
              {download.data && download.data.expiresInSeconds != null ? (
                <Caption style={{ marginTop: theme.spacing.sm }}>{t('file.expiryHint')}</Caption>
              ) : null}
            </Card>
          </Section>

          {download.isError ? (
            <Section spacing="lg">
              <ErrorState error={download.error} onRetry={() => void download.refetch()} />
            </Section>
          ) : (
            <Section spacing="lg">
              <Button
                label={viewable ? t('file.openCta') : t('file.openExternalCta')}
                fullWidth
                leftIcon="open-outline"
                loading={opening}
                disabled={opening || !download.data?.url}
                onPress={open}
                accessibilityLabel={viewable ? t('file.openCta') : t('file.openExternalCta')}
              />
            </Section>
          )}
        </>
      )}
    </ScrollScreen>
  );
}
