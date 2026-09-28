import { Linking } from 'react-native';

import { useTheme } from '@/theme';

import { Text, type TextProps } from './Text';

/** http(s) URLs and bare `www.` hosts; trailing punctuation is not part of the link. */
const URL_PATTERN = /((?:https?:\/\/|www\.)[^\s<>"']+[^\s<>"'.,;:!?)\]])/gi;

/** Only web links are ever opened — never `javascript:`, `file:`, intents, etc. */
function toSafeUrl(raw: string): string | null {
  const url = raw.toLowerCase().startsWith('www.') ? `https://${raw}` : raw;
  return /^https?:\/\//i.test(url) ? url : null;
}

export interface LinkifiedTextProps extends TextProps {
  children: string;
}

/**
 * Plain message text in which web links are tappable (opened in the system
 * browser). Rendered as text only — never markup — so untrusted message
 * content cannot inject anything; only http(s) URLs become links.
 */
export function LinkifiedText({ children, ...props }: LinkifiedTextProps) {
  const theme = useTheme();
  const parts = children.split(URL_PATTERN);
  return (
    <Text {...props}>
      {parts.map((part, i) => {
        const url = i % 2 === 1 ? toSafeUrl(part) : null;
        if (!url) return part;
        return (
          <Text
            key={`${i}-${part}`}
            {...props}
            accessibilityRole="link"
            onPress={() => void Linking.openURL(url)}
            style={[props.style, { color: theme.colors.primary, textDecorationLine: 'underline' }]}
          >
            {part}
          </Text>
        );
      })}
    </Text>
  );
}
