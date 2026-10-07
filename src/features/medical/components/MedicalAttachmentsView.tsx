import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, View } from 'react-native';

import { FilePreview, ImageViewer } from '@/components/media';
import { Label } from '@/components/typography';
import { useTheme } from '@/theme';

function isPdf(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url);
}

/** Read-only prescription photo + attachments (legacy "صورة الوصفة" / "الملفات المرفقة"). */
export function MedicalAttachmentsView({
  prescriptionUrl,
  attachmentUrls,
}: {
  prescriptionUrl: string | null;
  attachmentUrls: string[];
}) {
  const theme = useTheme();
  const { t } = useTranslation('medical');
  const images = [prescriptionUrl, ...attachmentUrls.filter((u) => !isPdf(u))].filter(
    (u): u is string => Boolean(u),
  );
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const openImage = (url: string) => setViewerIndex(Math.max(0, images.indexOf(url)));

  return (
    <View style={{ rowGap: theme.spacing.md }}>
      {prescriptionUrl ? (
        <View style={{ rowGap: theme.spacing.xs }}>
          <Label>{t('records.fieldPrescription')}</Label>
          <Pressable
            accessibilityRole="imagebutton"
            accessibilityLabel={t('records.fieldPrescription')}
            onPress={() => openImage(prescriptionUrl)}
          >
            <Image
              source={{ uri: prescriptionUrl }}
              style={{ width: 120, height: 90, borderRadius: theme.radius.md }}
              contentFit="cover"
            />
          </Pressable>
        </View>
      ) : null}
      {attachmentUrls.length > 0 ? (
        <View style={{ rowGap: theme.spacing.xs }}>
          <Label>{t('records.fieldAttachments')}</Label>
          {attachmentUrls.map((url, i) => (
            <FilePreview
              key={url}
              name={t('records.openAttachment', { index: i + 1 })}
              mimeType={isPdf(url) ? 'application/pdf' : 'image/jpeg'}
              onOpen={() => (isPdf(url) ? void Linking.openURL(url) : openImage(url))}
            />
          ))}
        </View>
      ) : null}
      <ImageViewer
        visible={viewerIndex !== null}
        images={images}
        initialIndex={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
      />
    </View>
  );
}
