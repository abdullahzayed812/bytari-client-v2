import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/content';
import { ErrorState, Loading } from '@/components/feedback';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Heading, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import { OrganizationTypeBadge } from '../components';
import { usePublicOrganization } from '../hooks';

interface InfoRowProps {
  icon: IconName;
  label: string;
  onPress?: () => void;
}

function InfoRow({ icon, label, onPress }: InfoRowProps) {
  const theme = useTheme();
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: theme.spacing.sm }}>
      <Icon name={icon} size="iconSm" color="primary" />
      <Text variant="body" color={onPress ? 'primary' : 'textSecondary'} style={{ flex: 1 }}>
        {label}
      </Text>
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={4}>
      {content}
    </Pressable>
  );
}

/** A publicly-discoverable clinic's profile — no membership required. */
export default function ClinicDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation('organizations');
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const q = usePublicOrganization(organizationId);

  return (
    <ScrollScreen>
      <AppHeader title={t('discover.detailTitle')} showBack backAlign="left" />

      {q.isLoading ? (
        <Loading fill />
      ) : q.isError || !q.data ? (
        <ErrorState error={q.error} title={t('discover.notFound')} onRetry={() => void q.refetch()} />
      ) : (
        <Section spacing="xl">
          <View
            style={{
              alignItems: 'center',
              rowGap: theme.spacing.md,
              paddingVertical: theme.spacing.xl,
            }}
          >
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: theme.radius.pill,
                backgroundColor: theme.colors.surfaceAccent,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {q.data.logoUrl ? (
                <Image
                  source={q.data.logoUrl}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <Icon name="medkit-outline" size="iconXl" color="primary" />
              )}
            </View>
            <View style={{ alignItems: 'center', rowGap: theme.spacing.xs }}>
              <Heading level={2} center>
                {q.data.name}
              </Heading>
              <OrganizationTypeBadge type={q.data.type} />
            </View>
          </View>

          {q.data.description ? (
            <Text variant="body" color="textSecondary" style={{ marginBottom: theme.spacing.lg }}>
              {q.data.description}
            </Text>
          ) : null}

          <View style={{ rowGap: theme.spacing.md }}>
            {q.data.address ? <InfoRow icon="location-outline" label={q.data.address} /> : null}
            {q.data.phone ? (
              <InfoRow
                icon="call-outline"
                label={q.data.phone}
                onPress={() => void Linking.openURL(`tel:${q.data?.phone}`)}
              />
            ) : null}
          </View>
        </Section>
      )}
    </ScrollScreen>
  );
}
