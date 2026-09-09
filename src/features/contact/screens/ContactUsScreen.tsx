import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, View } from 'react-native';

import { Button } from '@/components/actions';
import { Card, Divider, Icon, type IconName } from '@/components/content';
import { ErrorState, useToast } from '@/components/feedback';
import { Input } from '@/components/forms';
import { Row, ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption, Label, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useCreateThread } from '@/features/support';
import { useAuth } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';
import { fullName } from '@/utils';

import { CONTACT_INFO, phoneDigits } from '../constants';

const MESSAGE_MAX = 4000;

/** Route: `/(app)/contact` — "تواصل معنا". Contact channels + a message to the administration. */
export default function ContactUsScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { t } = useTranslation('contact');
  const { user } = useAuth();

  const name = fullName(user?.firstName, user?.lastName);
  const email = user?.email ?? '';

  const create = useCreateThread('SUPPORT');
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);

  const trimmed = message.trim();
  const invalid = touched && (trimmed.length === 0 || trimmed.length > MESSAGE_MAX);

  const onSend = () => {
    setTouched(true);
    if (trimmed.length === 0 || trimmed.length > MESSAGE_MAX || create.isPending) return;
    create.mutate(
      { body: trimmed },
      {
        onSuccess: (thread) => {
          toast.show({ tone: 'success', message: t('form.success') });
          setMessage('');
          setTouched(false);
          router.push(Routes.supportThread('support-messages', thread.id));
        },
        onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
      },
    );
  };

  return (
    <ScrollScreen padded={false}>
      <AppHeader title={t('title')} showBack />
      <View style={{ paddingHorizontal: theme.screenPadding, paddingTop: theme.spacing.lg }}>
        {/* --- hero --- */}
        <Card
          padding="lg"
          style={{ backgroundColor: theme.colors.primary, borderRadius: theme.radius.xl }}
        >
          <Row gap="lg" align="center">
            <Icon name="headset" size="iconXl" color="onPrimary" />
            <View style={{ flex: 1, rowGap: theme.spacing.xs }}>
              <Text style={{ color: theme.colors.onPrimary }} variant="bodyStrong">
                {t('hero.title')}
              </Text>
              <Text style={{ color: theme.colors.onPrimary }} variant="caption">
                {t('hero.subtitle')}
              </Text>
            </View>
          </Row>
        </Card>

        {/* --- contact info --- */}
        <Section>
          <Label>{t('info.title')}</Label>
          <Card padding="lg">
            <ContactRow
              icon="mail-outline"
              label={t('info.email')}
              value={CONTACT_INFO.email}
              onPress={() => void Linking.openURL(`mailto:${CONTACT_INFO.email}`)}
            />
            <Divider spacing="md" />
            <ContactRow
              icon="call-outline"
              label={t('info.phone')}
              value={CONTACT_INFO.phone}
              onPress={() => void Linking.openURL(`tel:${phoneDigits(CONTACT_INFO.phone)}`)}
            />
            <Divider spacing="md" />
            <ContactRow
              icon="logo-whatsapp"
              label={t('info.whatsapp')}
              value={CONTACT_INFO.whatsapp}
              onPress={() =>
                void Linking.openURL(`https://wa.me/${phoneDigits(CONTACT_INFO.whatsapp)}`)
              }
            />
            <Divider spacing="md" />
            <ContactRow
              icon="location-outline"
              label={t('info.address')}
              value={CONTACT_INFO.address}
              onPress={() =>
                void Linking.openURL(
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    CONTACT_INFO.address,
                  )}`,
                )
              }
            />
          </Card>
        </Section>

        {/* --- support types (informational) --- */}
        <Section>
          <Label>{t('types.title')}</Label>
          <Card padding="lg">
            <SupportType
              icon="headset-outline"
              title={t('types.technical.title')}
              subtitle={t('types.technical.subtitle')}
            />
            <Divider spacing="md" />
            <SupportType
              icon="chatbubbles-outline"
              title={t('types.general.title')}
              subtitle={t('types.general.subtitle')}
            />
            <Divider spacing="md" />
            <SupportType
              icon="create-outline"
              title={t('types.complaints.title')}
              subtitle={t('types.complaints.subtitle')}
            />
          </Card>
        </Section>

        {/* --- send a message --- */}
        <Section>
          <Label>{t('form.title')}</Label>
          {!user ? (
            <ErrorState title={t('form.signInRequired')} />
          ) : (
            <Card padding="lg">
              <View style={{ rowGap: theme.spacing.md }}>
                <Input
                  label={t('form.nameLabel')}
                  value={name}
                  editable={false}
                  leftIcon="person-outline"
                />
                <Input
                  label={t('form.emailLabel')}
                  value={email}
                  editable={false}
                  leftIcon="mail-outline"
                />
                <Input
                  label={t('form.messageLabel')}
                  placeholder={t('form.messagePlaceholder')}
                  value={message}
                  onChangeText={setMessage}
                  onBlur={() => setTouched(true)}
                  multiline
                  numberOfLines={4}
                  maxLength={MESSAGE_MAX}
                  error={invalid ? t('form.messageRequired') : undefined}
                  leftIcon="create-outline"
                />
                <Button
                  label={t('form.submit')}
                  variant="primary"
                  fullWidth
                  leftIcon="send"
                  loading={create.isPending}
                  disabled={create.isPending}
                  onPress={onSend}
                />
                <Caption color="textMuted">{t('form.note')}</Caption>
              </View>
            </Card>
          )}
        </Section>

        <View style={{ height: theme.spacing.huge }} />
      </View>
    </ScrollScreen>
  );
}

// --- row helpers -----------------------------------------------------

function ContactRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: IconName;
  label: string;
  value: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Row justify="space-between" align="center" gap="md">
      <View style={{ flex: 1, rowGap: 2 }}>
        <Text variant="label" color="textSecondary">
          {label}
        </Text>
        <Text color="primary" onPress={onPress}>
          {value}
        </Text>
      </View>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size="iconSm" color="primary" />
      </View>
    </Row>
  );
}

function SupportType({
  icon,
  title,
  subtitle,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
}) {
  const theme = useTheme();
  return (
    <Row gap="md" align="flex-start">
      <View style={{ flex: 1, rowGap: 2 }}>
        <Text variant="bodyStrong">{title}</Text>
        <Caption color="textSecondary">{subtitle}</Caption>
      </View>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size="iconSm" color="primary" />
      </View>
    </Row>
  );
}
