import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Icon } from '@/components/content';
import { Caption } from '@/components/typography';
import { useTheme } from '@/theme';
import { fullName } from '@/utils';

export interface DailyRecordFooterProps {
  createdBy?: { firstName: string; lastName: string } | null;
  /** Shown only when the viewer's org role may edit / delete (backend re-checks). */
  onEdit?: () => void;
  onDelete?: () => void;
}

/** "أضيف بواسطة: …" + edit / delete, at the bottom of every daily-data card. */
export function DailyRecordFooter({ createdBy, onEdit, onDelete }: DailyRecordFooterProps) {
  const theme = useTheme();
  const { t } = useTranslation('farm');
  const name = createdBy ? fullName(createdBy.firstName, createdBy.lastName) : '';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: theme.spacing.xs,
        marginTop: theme.spacing.xs,
        paddingTop: theme.spacing.xs,
        borderTopWidth: theme.sizes.hairline,
        borderTopColor: theme.colors.divider,
      }}
    >
      <Icon name="person-circle-outline" size="iconXs" color="textMuted" />
      <Caption style={{ flex: 1 }} numberOfLines={1}>
        {t('daily.addedBy', { name: name || t('daily.unknownAuthor') })}
      </Caption>
      {onEdit ? (
        <IconButton
          icon="create-outline"
          size="sm"
          variant="plain"
          accessibilityLabel={t('daily.edit')}
          onPress={onEdit}
        />
      ) : null}
      {onDelete ? (
        <IconButton
          icon="trash-outline"
          size="sm"
          variant="plain"
          accessibilityLabel={t('daily.delete')}
          onPress={onDelete}
        />
      ) : null}
    </View>
  );
}
