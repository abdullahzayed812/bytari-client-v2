import { router, type Href } from 'expo-router';
import { View } from 'react-native';

import { Card, Icon, type IconName } from '@/components/content';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Text } from '@/components/typography';

export interface AdminHubEntry {
  key: string;
  label: string;
  icon: IconName;
  route: Href;
}

interface Props {
  title: string;
  intro?: string;
  entries: AdminHubEntry[];
}

/**
 * Small landing screen for a dashboard card that groups 2–3 existing admin
 * sub-screens (e.g. "الخدمات" → listings + requests) into one tile per the
 * redesigned admin dashboard. Pure navigation — no new data of its own.
 */
export function AdminHubScreen({ title, intro, entries }: Props) {
  return (
    <ScrollScreen>
      <AppHeader title={title} showBack />
      {intro ? (
        <Section spacing="lg">
          <Caption>{intro}</Caption>
        </Section>
      ) : null}
      <Section spacing="lg">
        <View style={{ rowGap: 12 }}>
          {entries.map((entry) => (
            <Card
              key={entry.key}
              variant="outlined"
              padding="md"
              onPress={() => router.push(entry.route)}
              accessibilityLabel={entry.label}
            >
              <Row gap="md">
                <Icon name={entry.icon} size="iconMd" color="primary" />
                <Text variant="bodyMedium" style={{ flex: 1 }}>
                  {entry.label}
                </Text>
                <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
              </Row>
            </Card>
          ))}
        </View>
      </Section>
    </ScrollScreen>
  );
}
