import { useTranslation } from 'react-i18next';
import { Linking, Pressable, View } from 'react-native';

import { useToast } from '@/components/feedback/Toast';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';
import { openPhone, openWebsite, telUrl, websiteUrl } from '@/utils';

import { Icon, type IconName } from './Icon';

export type ContactKind = 'phone' | 'website' | 'email';

export interface ContactActionRowProps {
  kind: ContactKind;
  /** The value exactly as stored / displayed — formatting is preserved on screen. */
  value: string;
  /** Optional caption above the value (e.g. "رقم الهاتف"). */
  label?: string;
  icon?: IconName;
}

const ICONS: Record<ContactKind, IconName> = {
  phone: 'call-outline',
  website: 'globe-outline',
  email: 'mail-outline',
};

/**
 * One tappable contact line: a phone number opens the dialer (`tel:` — the
 * user still starts the call), a website opens the browser (normalised,
 * http(s) only), an e-mail opens the mail app. A value that cannot be turned
 * into a safe link is shown as plain text.
 */
export function ContactActionRow({ kind, value, label, icon }: ContactActionRowProps) {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const toast = useToast();

  const actionable =
    kind === 'phone'
      ? telUrl(value) !== null
      : kind === 'website'
        ? websiteUrl(value) !== null
        : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const open = async () => {
    let ok = false;
    if (kind === 'phone') ok = await openPhone(value);
    else if (kind === 'website') ok = await openWebsite(value);
    else {
      ok = await Linking.openURL(`mailto:${value.trim()}`)
        .then(() => true)
        .catch(() => false);
    }
    if (!ok) toast.show({ message: t('contactAction.failed'), tone: 'danger' });
  };

  const content = (
    <>
      <Icon name={icon ?? ICONS[kind]} size="iconSm" color="primary" />
      <View style={{ flex: 1 }}>
        {label ? <Caption color="textMuted">{label}</Caption> : null}
        <Text
          variant="body"
          style={[
            // numbers / URLs read left-to-right even in RTL
            { writingDirection: 'ltr', textAlign: 'auto' },
            actionable && { color: theme.colors.primary },
          ]}
        >
          {value}
        </Text>
      </View>
    </>
  );

  if (!actionable) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={t(`contactAction.${kind}A11y`, { value })}
      onPress={() => void open()}
      hitSlop={6}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: theme.spacing.sm,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {content}
    </Pressable>
  );
}
