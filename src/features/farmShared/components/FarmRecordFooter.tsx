import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { Icon } from '@/components/content';
import { ConfirmationDialog } from '@/components/feedback';
import { Caption } from '@/components/typography';
import { useTheme } from '@/theme';

import type { FarmRecordCreator } from '../records';

export interface FarmRecordFooterProps {
  /** Server-resolved creator ("أضيف بواسطة"); `null` → "unknown". */
  createdBy?: FarmRecordCreator | null;
  /** Shown only for a role that may manage farm operations (server re-checks). */
  canManage: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
}

/**
 * Bottom of every farm-operation detail view: who added the record, plus
 * Edit / Delete (with a confirmation) for roles that may manage it.
 */
export function FarmRecordFooter({
  createdBy,
  canManage,
  onEdit,
  onDelete,
  deleting,
}: FarmRecordFooterProps) {
  const theme = useTheme();
  const { t } = useTranslation('farm');
  const [confirm, setConfirm] = useState(false);
  const name = createdBy
    ? `${createdBy.firstName} ${createdBy.lastName}`.trim()
    : t('records.unknownAuthor');

  return (
    <View style={{ rowGap: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
        <Icon name="person-circle-outline" size="iconSm" color="textMuted" />
        <Caption color="textMuted">{t('records.addedBy', { name })}</Caption>
      </View>
      {canManage && (onEdit || onDelete) ? (
        <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
          {onEdit ? (
            <View style={{ flex: 1 }}>
              <Button label={t('records.edit')} variant="outline" leftIcon="create-outline" fullWidth onPress={onEdit} />
            </View>
          ) : null}
          {onDelete ? (
            <View style={{ flex: 1 }}>
              <Button
                label={t('records.delete')}
                variant="danger"
                leftIcon="trash-outline"
                fullWidth
                disabled={deleting}
                onPress={() => setConfirm(true)}
              />
            </View>
          ) : null}
        </View>
      ) : null}
      <ConfirmationDialog
        visible={confirm}
        title={t('records.deleteTitle')}
        message={t('records.deleteBody')}
        destructive
        loading={deleting}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          onDelete?.();
        }}
      />
    </View>
  );
}
