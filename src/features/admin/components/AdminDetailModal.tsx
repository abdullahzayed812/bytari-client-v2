import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { Modal } from '@/components/overlays';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

export interface AdminDetailField {
  label: string;
  /** Rendered only when non-empty — `null` / `undefined` / `''` rows are skipped. */
  value: string | null | undefined;
}

export interface AdminDetailModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  fields: AdminDetailField[];
  /** Optional footer — e.g. gallery thumbnails or action buttons. */
  children?: ReactNode;
}

/**
 * Read-only detail view for an admin list row. Shows a label/value table in a
 * bounded scroll area so long records (e.g. a LOST publication) stay usable.
 */
export function AdminDetailModal({
  visible,
  onClose,
  title,
  fields,
  children,
}: AdminDetailModalProps) {
  const theme = useTheme();
  const rows = fields.filter((f) => f.value != null && String(f.value).trim() !== '');

  return (
    <Modal visible={visible} onClose={onClose} title={title}>
      <ScrollView
        style={{ maxHeight: 420 }}
        contentContainerStyle={{ rowGap: theme.spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((f) => (
          <View key={f.label} style={{ rowGap: 2 }}>
            <Text variant="overline" color="textMuted">
              {f.label}
            </Text>
            <Text variant="body">{f.value}</Text>
          </View>
        ))}
        {children}
      </ScrollView>
    </Modal>
  );
}
