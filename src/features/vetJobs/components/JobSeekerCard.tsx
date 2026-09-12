import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, Icon } from '@/components/content';
import { Caption, Text } from '@/components/typography';
import { useTheme } from '@/theme';

import type { PublicVetJobSeekerProfile } from '../types';

/** A job-seeker profile card, matching the "باحثون عن عمل" reference grid. */
export function JobSeekerCard({
  profile,
  onPress,
}: {
  profile: PublicVetJobSeekerProfile;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('vetJobs');
  const name = `${profile.user.firstName} ${profile.user.lastName}`;
  const location = [profile.governorate, profile.district].filter(Boolean).join(' - ');

  return (
    <Card variant="elevated" padding="md" onPress={onPress} style={{ alignItems: 'center' }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: theme.colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          marginBottom: theme.spacing.sm,
        }}
      >
        {profile.photoUrl ? (
          <Image source={{ uri: profile.photoUrl }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Icon name="person" size="iconLg" color="primary" />
        )}
      </View>
      <Text variant="bodyStrong" numberOfLines={1} style={{ textAlign: 'center' }}>
        {name}
      </Text>
      <Caption numberOfLines={1} style={{ textAlign: 'center' }}>
        {profile.specialty}
      </Caption>
      {location ? (
        <Caption numberOfLines={1} style={{ textAlign: 'center' }}>
          {location}
        </Caption>
      ) : null}
      <Caption color="textMuted" style={{ textAlign: 'center' }}>
        {t('seekers.experienceYears', { count: profile.experienceYears })}
      </Caption>
    </Card>
  );
}
