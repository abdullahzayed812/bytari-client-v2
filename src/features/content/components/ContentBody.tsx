import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useToast } from '@/components/feedback';
import { Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { extractLinks, openExternalUrl } from '../openExternal';

export interface ContentBodyProps {
  body: string;
}

/**
 * Renders an article body as PLAIN TEXT. The backend stores it "verbatim as
 * untrusted text and never rendered by the API — clients MUST escape / sanitise
 * on display." React Native `<Text>` never interprets HTML / Markdown / scripts,
 * so the string is shown literally — that IS the sanitisation (§6, §33).
 *
 * Bare `http(s)://` URLs are surfaced as a tappable list below the text (opened
 * through `openExternalUrl`, which allows only http/https — §25). The body text
 * itself is not turned into rich links, to avoid any parsing ambiguity.
 */
export function ContentBody({ body }: ContentBodyProps) {
  const theme = useTheme();
  const { t } = useTranslation('content');
  const toast = useToast();
  const links = useMemo(() => extractLinks(body), [body]);

  const open = async (url: string) => {
    const ok = await openExternalUrl(url);
    if (!ok) toast.show({ tone: 'danger', message: t('detail.linkOpenFailed') });
  };

  return (
    <View style={{ rowGap: theme.spacing.md }}>
      <Text variant="body" selectable>
        {body}
      </Text>

      {links.length > 0 ? (
        <View style={{ rowGap: theme.spacing.xs }}>
          <Text variant="label" color="textSecondary">
            {t('detail.linksTitle')}
          </Text>
          {links.map((url) => (
            <Text
              key={url}
              variant="body"
              color="primary"
              onPress={() => void open(url)}
              accessibilityRole="link"
              accessibilityLabel={t('detail.openLink', { url })}
            >
              {url}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
