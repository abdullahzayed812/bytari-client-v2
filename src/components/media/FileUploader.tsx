import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { useToast } from '@/components/feedback';
import { apiErrorMessage } from '@/lib/apiError';
import { isPermissionError, pickDocument } from '@/services/media';
import {
  useMediaUpload,
  type LocalFile,
  type PresignProvider,
  type UploadResult,
} from '@/services/media';
import { useTheme } from '@/theme';

import { FilePreview } from './FilePreview';

export interface FileUploaderProps {
  provider: PresignProvider;
  onChange: (result: UploadResult | null) => void;
  /** Accepted MIME types. Default: PDF + images. */
  accept?: string[];
  label?: string;
  disabled?: boolean;
}

/**
 * Reusable single-file attachment field: pick a document → secure presigned
 * upload → preview row, with progress / retry / remove.
 */
export function FileUploader({ provider, onChange, accept, label, disabled }: FileUploaderProps) {
  const { t } = useTranslation('common');
  const theme = useTheme();
  const toast = useToast();
  const up = useMediaUpload(provider);

  useEffect(() => {
    if (up.status === 'success' && up.result) onChange(up.result);
    if (up.status === 'error') {
      toast.show({ message: apiErrorMessage(up.error), tone: 'danger' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [up.status]);

  const start = async () => {
    try {
      const [file] = await pickDocument({ types: accept });
      if (!file) return;
      await up.upload(file);
    } catch (error) {
      if (isPermissionError(error)) {
        toast.show({ message: t('media.permissionBody'), tone: 'warning' });
      } else {
        toast.show({ message: apiErrorMessage(error), tone: 'danger' });
      }
    }
  };

  const remove = () => {
    up.reset();
    onChange(null);
  };

  return (
    <View style={{ rowGap: theme.spacing.sm }}>
      {up.file ? (
        <FilePreview
          name={up.file.name}
          mimeType={up.file.mimeType}
          size={up.file.size}
          uploading={up.status === 'uploading'}
          progress={up.progress}
          error={up.status === 'error'}
          onRetry={() => void up.upload(up.file as LocalFile)}
          onRemove={disabled ? undefined : remove}
        />
      ) : (
        <Button
          label={label ?? t('media.addFile')}
          variant="outline"
          leftIcon="attach-outline"
          fullWidth
          disabled={disabled}
          onPress={() => void start()}
        />
      )}
    </View>
  );
}
