import { Fragment } from 'react';
import { View } from 'react-native';

import { Card, Divider, Icon } from '@/components/content';
import { Alert } from '@/components/feedback';
import { Caption, Label, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import type { SyndicateContentSectionStyle, SyndicateServiceContent } from '../types';

function Bullet({ children, style }: { children: string; style: SyndicateContentSectionStyle }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', columnGap: theme.spacing.xs }}>
      <Icon
        name={style === 'NOTE' ? 'alert-circle' : 'checkmark-circle'}
        size="iconXs"
        color={style === 'NOTE' ? 'warning' : 'primary'}
      />
      <Text variant="body" style={{ flex: 1 }}>
        {children}
      </Text>
    </View>
  );
}

/**
 * A syndicate service page's content (heading, intro, section cards with ✓ /
 * ! bullets, processing-time line, note) — the same layout the built-in pages
 * always had, now driven by the editable document. Empty parts render nothing.
 */
export function SyndicateServiceContentView({ content }: { content: SyndicateServiceContent }) {
  const theme = useTheme();
  return (
    <>
      {content.heading ? <Label>{content.heading}</Label> : null}
      {content.body ? (
        <Text variant="body" color="textSecondary">
          {content.body}
        </Text>
      ) : null}

      {content.sections.map((section, index) => (
        <Fragment key={section.id}>
          {index > 0 ? <Divider /> : null}
          <Card variant="outlined" padding="md" style={{ rowGap: theme.spacing.sm }}>
            <Text variant="bodyStrong">{section.title}</Text>
            {section.items.map((item) => (
              <Bullet key={item.id} style={section.style}>
                {item.text}
              </Bullet>
            ))}
          </Card>
        </Fragment>
      ))}

      {content.footnote ? <Caption color="textMuted">{content.footnote}</Caption> : null}
      {content.note ? <Alert tone="info" message={content.note} /> : null}
    </>
  );
}
