import { View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

export interface InfoItem {
  icon: IconName;
  label: string;
  value: string;
}

/** 2-column labelled info grid — the "معلومات الطلب" / service-detail blocks. */
export function InfoGrid({ items }: { items: InfoItem[] }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: theme.spacing.md }}>
      {items.map((it, i) => (
        <View
          key={i}
          style={{
            width: '50%',
            paddingEnd: i % 2 === 0 ? theme.spacing.sm : 0,
            rowGap: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.xs }}>
            <Icon name={it.icon} size="iconXs" color="serviceAccent" />
            <Caption color="textSecondary">{it.label}</Caption>
          </View>
          <Text variant="bodyMedium" numberOfLines={2}>
            {it.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
