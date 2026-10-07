import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { FilePreview, FileUploader, ImageUploader, ImageViewer } from '@/components/media';
import { Label, Caption } from '@/components/typography';
import { useTheme } from '@/theme';

import { MEDICAL_RECORD_ATTACHMENTS_MAX } from '../constants';
import { useMedicalAttachmentPresignProvider } from '../hooks';

export interface MedicalAttachment {
  key: string;
  /** Signed URL for an existing attachment; `null` for one uploaded in this session. */
  url: string | null;
}

export interface MedicalAttachmentsValue {
  prescription: MedicalAttachment | null;
  attachments: MedicalAttachment[];
}

export interface MedicalAttachmentsEditorProps {
  organizationId: string;
  animalId: string;
  value: MedicalAttachmentsValue;
  onChange: (next: MedicalAttachmentsValue) => void;
  /** `true` while an upload is in flight — the form blocks submit on it. */
  onBusyChange?: (busy: boolean) => void;
  showPrescription?: boolean;
}

function looksLikeImage(url: string | null): boolean {
  return Boolean(url && !/\.pdf(\?|$)/i.test(url));
}

/**
 * Legacy `prescriptionImage` + `fileUrls` editor: one prescription photo and up
 * to {@link MEDICAL_RECORD_ATTACHMENTS_MAX} images / PDFs, each uploaded straight
 * to R2 through a clinic-scoped presigned URL. Only storage keys leave this
 * component; the backend verifies every key belongs to this clinic.
 */
export function MedicalAttachmentsEditor({
  organizationId,
  animalId,
  value,
  onChange,
  onBusyChange,
  showPrescription = true,
}: MedicalAttachmentsEditorProps) {
  const theme = useTheme();
  const { t } = useTranslation('medical');
  const provider = useMedicalAttachmentPresignProvider(organizationId, animalId);
  // Re-mount the single-file uploader after each upload so another can be added.
  const [uploaderKey, setUploaderKey] = useState(0);
  const [viewer, setViewer] = useState<string | null>(null);

  const open = (url: string | null) => {
    if (!url) return;
    if (looksLikeImage(url)) setViewer(url);
    else void Linking.openURL(url);
  };

  return (
    <View style={{ rowGap: theme.spacing.md }}>
      {showPrescription ? (
        <View style={{ rowGap: theme.spacing.xs }}>
          <Label>{t('records.fieldPrescription')}</Label>
          <ImageUploader
            value={value.prescription?.url ?? null}
            provider={provider}
            shape="square"
            size={120}
            replaceable
            onBusyChange={onBusyChange}
            onChange={(result) =>
              onChange({
                ...value,
                prescription: result ? { key: result.storageKey, url: null } : null,
              })
            }
          />
          <Caption>{t('records.prescriptionHint')}</Caption>
        </View>
      ) : null}

      <View style={{ rowGap: theme.spacing.xs }}>
        <Label>{t('records.fieldAttachments')}</Label>
        {value.attachments.map((a, i) => (
          <FilePreview
            key={a.key}
            name={t('records.openAttachment', { index: i + 1 })}
            mimeType={looksLikeImage(a.url) ? 'image/jpeg' : 'application/pdf'}
            onOpen={a.url ? () => open(a.url) : undefined}
            onRemove={() =>
              onChange({
                ...value,
                attachments: value.attachments.filter((x) => x.key !== a.key),
              })
            }
          />
        ))}
        {value.attachments.length < MEDICAL_RECORD_ATTACHMENTS_MAX ? (
          <FileUploader
            key={uploaderKey}
            provider={provider}
            accept={['image/jpeg', 'image/png', 'image/webp', 'application/pdf']}
            label={t('records.addAttachment')}
            onBusyChange={onBusyChange}
            onChange={(result) => {
              if (!result) return;
              onChange({
                ...value,
                attachments: [...value.attachments, { key: result.storageKey, url: null }],
              });
              setUploaderKey((k) => k + 1);
            }}
          />
        ) : null}
      </View>

      <ImageViewer
        visible={viewer !== null}
        images={viewer ? [viewer] : []}
        onClose={() => setViewer(null)}
      />
    </View>
  );
}
