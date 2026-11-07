import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { useToast } from '@/components/feedback';
import { BottomSheet } from '@/components/overlays';
import { Caption, Text } from '@/components/typography';
import { apiErrorMessage } from '@/lib/apiError';
import {
  ID_DOCUMENT_EDIT,
  isPermissionError,
  pickDocument,
  pickImage,
  type LocalFile,
} from '@/services/media';
import { useTheme } from '@/theme';

import { useReplaceVetDocumentMutation } from '../hooks';
import type { VetApplicationDocumentKind } from '../types';

/** Same limit as the server (`MAX_DOCUMENT_BYTES`). */
const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

/** Which document slots an application of each sub-type carries. */
const KINDS_BY_SUB_TYPE: Record<string, readonly VetApplicationDocumentKind[]> = {
  VETERINARIAN: ['LICENSE_OR_ID', 'ADDITIONAL_ID'],
  STUDENT: ['STUDENT_ID_FRONT', 'STUDENT_ID_BACK'],
};

/** Licence / ID slots also accept a PDF; student-ID sides are photos only (server rule). */
const PDF_ALLOWED: ReadonlySet<VetApplicationDocumentKind> = new Set([
  'LICENSE_OR_ID',
  'ADDITIONAL_ID',
]);

export interface VetIdentityDocumentsEditorProps {
  userId: string;
  subType: string;
  documents: { kind: string; filename: string }[];
}

/**
 * "تغيير مستند الهوية" — lets the ADMIN replace a veterinarian's uploaded
 * identity / licence documents (one row per slot of the application's
 * sub-type). Uses the shared private presigned upload + the server's
 * `veterinarian.document.manage` endpoints; render it only for a caller
 * holding that key (the server enforces it on every call regardless).
 */
export function VetIdentityDocumentsEditor({
  userId,
  subType,
  documents,
}: VetIdentityDocumentsEditorProps) {
  const { t } = useTranslation('admin');
  const theme = useTheme();
  const toast = useToast();
  const replace = useReplaceVetDocumentMutation(userId);
  const [choosing, setChoosing] = useState<VetApplicationDocumentKind | null>(null);

  const kinds = KINDS_BY_SUB_TYPE[subType] ?? KINDS_BY_SUB_TYPE.VETERINARIAN!;

  const upload = (kind: VetApplicationDocumentKind, file: LocalFile): void => {
    if ((file.size ?? 0) > MAX_DOCUMENT_BYTES) {
      toast.show({ tone: 'danger', message: t('users.detail.idDocs.tooLarge') });
      return;
    }
    replace.mutate(
      { kind, file },
      {
        onSuccess: () =>
          toast.show({ tone: 'success', message: t('users.detail.idDocs.replaced') }),
        onError: (e) => toast.show({ tone: 'danger', message: apiErrorMessage(e) }),
      },
    );
  };

  const pick = async (kind: VetApplicationDocumentKind, as: 'image' | 'pdf'): Promise<void> => {
    setChoosing(null);
    try {
      const file =
        as === 'image'
          ? await pickImage({ edit: ID_DOCUMENT_EDIT })
          : ((await pickDocument({ types: ['application/pdf'] }))[0] ?? null);
      if (file) upload(kind, file);
    } catch (e) {
      toast.show({
        tone: isPermissionError(e) ? 'warning' : 'danger',
        message: isPermissionError(e) ? t('users.detail.idDocs.permission') : apiErrorMessage(e),
      });
    }
  };

  return (
    <View style={{ rowGap: theme.spacing.sm }}>
      <Text variant="label">{t('users.detail.idDocs.title')}</Text>
      <Caption>{t('users.detail.idDocs.hint')}</Caption>
      {kinds.map((kind) => {
        const current = documents.find((d) => d.kind === kind);
        const busy = replace.isPending && replace.variables?.kind === kind;
        return (
          <View
            key={kind}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              columnGap: theme.spacing.sm,
              padding: theme.spacing.sm,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
            }}
          >
            <View style={{ flex: 1, rowGap: 2 }}>
              <Text variant="bodyMedium">{t(`users.detail.idDocs.kind.${kind}`)}</Text>
              <Caption numberOfLines={1}>
                {current ? current.filename : t('users.detail.idDocs.missing')}
              </Caption>
            </View>
            <Button
              label={current ? t('users.detail.idDocs.replace') : t('users.detail.idDocs.upload')}
              size="sm"
              variant="outline"
              leftIcon="swap-horizontal-outline"
              wrapLabel
              loading={busy}
              disabled={replace.isPending && !busy}
              onPress={() => (PDF_ALLOWED.has(kind) ? setChoosing(kind) : void pick(kind, 'image'))}
            />
          </View>
        );
      })}

      <BottomSheet
        visible={choosing !== null}
        onClose={() => setChoosing(null)}
        title={choosing ? t(`users.detail.idDocs.kind.${choosing}`) : undefined}
      >
        <View style={{ rowGap: theme.spacing.sm }}>
          <Button
            label={t('users.detail.idDocs.pickImage')}
            leftIcon="image-outline"
            fullWidth
            onPress={() => choosing && void pick(choosing, 'image')}
          />
          <Button
            label={t('users.detail.idDocs.pickPdf')}
            variant="outline"
            leftIcon="document-outline"
            fullWidth
            onPress={() => choosing && void pick(choosing, 'pdf')}
          />
        </View>
      </BottomSheet>
    </View>
  );
}
