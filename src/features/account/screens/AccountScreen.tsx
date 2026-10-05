import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, useWindowDimensions, View } from 'react-native';

import { Button } from '@/components/actions';
import { Avatar, Card, Icon, type IconName } from '@/components/content';
import { ConfirmationDialog, useToast } from '@/components/feedback';
import { ScrollScreen } from '@/components/layout';
import { Caption, Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useLogoutMutation } from '@/features/auth';
import { useAppMode, useAuth, useCapabilities, useInterfaceSwitch } from '@/hooks';
import { pickImage } from '@/services/media';
import { useTheme } from '@/theme';
import { fullName } from '@/utils';

import { useUploadMyAvatar } from '../hooks/useMyProfile';

/** Content width cap so the page stays card-sized on wide web screens. */
const MAX_WIDTH = 720;
const AVATAR = 112;

interface ManageItem {
  key: string;
  icon: IconName;
  title: string;
  hint: string;
  href: Href;
}

/**
 * Account tab — the profile page (reference design "الملف الشخصي"). Reuses the
 * existing session data (`/auth/me`): identity card (avatar, name, verified
 * badge, specialization, governorate), contact row (phone / email / WhatsApp),
 * "نبذة عني", the "إدارة حسابي" grid linking to existing (or profile) screens,
 * and sign-out. Existing account functionality is kept below the grid: the
 * Pet Owner ⇄ Veterinarian switch and the management entry point.
 */
export default function AccountScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { t } = useTranslation('profile');
  const { t: ta } = useTranslation('auth');
  const { user } = useAuth();
  const caps = useCapabilities();
  const mode = useAppMode();
  const interfaceSwitch = useInterfaceSwitch();
  const logout = useLogoutMutation();
  const uploadAvatar = useUploadMyAvatar();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { width } = useWindowDimensions();

  const isVet = caps.isApprovedVeterinarian;
  const vetMode = mode.isVeterinarianMode;
  const name = user ? fullName(user.firstName, user.lastName) : '—';
  const displayName = isVet ? t('doctorPrefix', { name }) : name;
  const place = [user?.governorate].filter(Boolean).join(' - ');
  const hasDocuments = Boolean(user && user.veterinarianStatus !== 'NOT_APPLIED');

  const changePhoto = async () => {
    try {
      const file = await pickImage({ edit: { aspects: ['1:1'], defaultAspect: '1:1' } });
      if (!file) return;
      await uploadAvatar.mutateAsync(file);
      toast.show({ tone: 'success', message: t('photoUpdated') });
    } catch {
      // permission denied, picker failure or upload/finalize rejection
      toast.show({ tone: 'danger', message: t('photoFailed') });
    }
  };

  const items: ManageItem[] = [
    {
      key: 'orders',
      icon: 'bag-handle-outline',
      title: t('manage.orders'),
      hint: t('manage.ordersHint'),
      href: vetMode ? Routes.veterinarianStoreOrders : Routes.petOwnerStoreOrders,
    },
    {
      key: 'edit',
      icon: 'create-outline',
      title: t('manage.edit'),
      hint: t('manage.editHint'),
      href: Routes.profileEdit,
    },
    ...(hasDocuments
      ? [
          {
            key: 'documents',
            icon: 'document-attach-outline' as const,
            title: t('manage.documents'),
            hint: t('manage.documentsHint'),
            href: Routes.profileDocuments,
          },
        ]
      : []),
    {
      key: 'support',
      icon: 'headset-outline',
      title: t('manage.support'),
      hint: t('manage.supportHint'),
      href: Routes.contact,
    },
    {
      key: 'ads',
      icon: 'megaphone-outline',
      title: t('manage.ads'),
      hint: t('manage.adsHint'),
      href: Routes.profileAds,
    },
    ...(vetMode
      ? [
          {
            key: 'saved',
            icon: 'bookmark-outline' as const,
            title: t('manage.saved'),
            hint: t('manage.savedHint'),
            href: Routes.veterinaryMagazineSection('saved'),
          },
        ]
      : []),
    {
      key: 'settings',
      icon: 'settings-outline',
      title: t('manage.settings'),
      hint: t('manage.settingsHint'),
      href: Routes.settings,
    },
    {
      key: 'complaints',
      icon: 'document-text-outline',
      title: t('manage.complaints'),
      hint: t('manage.complaintsHint'),
      href: Routes.supportCreate('support-messages'),
    },
  ];

  // 3 per row (2 on very narrow phones); a short last row stretches to fill.
  const perRow = width < 340 ? 2 : 3;
  const rows: ManageItem[][] = [];
  for (let i = 0; i < items.length; i += perRow) rows.push(items.slice(i, i + perRow));

  const goHome = () => (router.canGoBack() ? router.back() : router.push(Routes.home));

  return (
    <ScrollScreen padded={false}>
      <View
        style={{
          width: '100%',
          maxWidth: MAX_WIDTH,
          alignSelf: 'center',
          paddingHorizontal: theme.screenPadding,
          paddingTop: theme.spacing.md,
          rowGap: theme.spacing.lg,
        }}
      >
        {/* --- identity card -------------------------------------------- */}
        <View
          style={{
            borderRadius: theme.radius.xl,
            backgroundColor: theme.colors.surface,
            overflow: 'hidden',
            ...theme.shadows.card,
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.primaryPressed,
              height: 150,
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.lg,
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            {isVet ? (
              <View
                accessibilityLabel={t('verified')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  columnGap: theme.spacing.xs,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.xs,
                  borderRadius: theme.radius.pill,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.45)',
                }}
              >
                <Text variant="bodyMedium" style={{ color: theme.colors.onPrimary }}>
                  {t('verified')}
                </Text>
                <Icon name="checkmark-circle" size="iconSm" color="onPrimary" />
              </View>
            ) : (
              <View />
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={ta('account.title')}
              onPress={goHome}
              hitSlop={8}
            >
              <Icon name="arrow-forward" directional size="iconMd" color="onPrimary" />
            </Pressable>
          </View>

          <View
            style={{
              marginTop: -88,
              marginHorizontal: theme.spacing.md,
              padding: theme.spacing.lg,
              borderRadius: theme.radius.xl,
              backgroundColor: theme.colors.surface,
              flexDirection: 'row',
              alignItems: 'center',
              columnGap: theme.spacing.lg,
            }}
          >
            <View>
              <Avatar uri={user?.avatarUrl} name={name} size={AVATAR} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('changePhoto')}
                disabled={uploadAvatar.isPending}
                onPress={() => void changePhoto()}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  insetInlineEnd: 0,
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: theme.colors.primaryPressed,
                  borderWidth: 3,
                  borderColor: theme.colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: uploadAvatar.isPending ? 0.6 : 1,
                }}
              >
                <Icon name="camera" size="iconSm" color="onPrimary" />
              </Pressable>
            </View>
            <View style={{ flex: 1, rowGap: theme.spacing.xs }}>
              <Text variant="title" weight="bold" numberOfLines={2}>
                {displayName}
              </Text>
              {user?.specialization ? (
                <Text variant="bodyMedium" color="primary" numberOfLines={1}>
                  {user.specialization}
                </Text>
              ) : null}
              {place ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
                  <Icon name="location-outline" size="iconSm" color="primary" />
                  <Text variant="body" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {place}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* contact row: phone · email · WhatsApp */}
          <View
            style={{
              flexDirection: 'row',
              margin: theme.spacing.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
              paddingVertical: theme.spacing.md,
            }}
          >
            <ContactCell
              label={t('contact.phone')}
              value={user?.phone ?? null}
              icon="call-outline"
              onPress={
                user?.phone ? () => void Linking.openURL(`tel:${user.phone ?? ''}`) : undefined
              }
            />
            <ContactCell
              label={t('contact.email')}
              value={user?.email ?? null}
              icon="mail-outline"
              divider
              onPress={user?.email ? () => void Linking.openURL(`mailto:${user.email}`) : undefined}
            />
            <ContactCell
              label={t('contact.whatsapp')}
              value={user?.whatsapp ?? null}
              icon="logo-whatsapp"
              divider
              onPress={
                user?.whatsapp
                  ? () =>
                      void Linking.openURL(
                        `https://wa.me/${(user.whatsapp ?? '').replace(/\D/g, '')}`,
                      )
                  : undefined
              }
            />
          </View>
        </View>

        {/* --- نبذة عني --------------------------------------------------- */}
        <Card padding="lg">
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              columnGap: theme.spacing.sm,
              marginBottom: theme.spacing.sm,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.colors.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="person-outline" size="iconSm" color="primary" />
            </View>
            <Text variant="subtitle" weight="bold" color="primary">
              {t('about.title')}
            </Text>
          </View>
          {user?.bio ? (
            <Text variant="body" style={{ lineHeight: 28 }}>
              {user.bio}
            </Text>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => router.push(Routes.profileEdit)}>
              <Caption color="textSecondary">{t('about.empty')}</Caption>
              <Caption color="primary" style={{ marginTop: 4 }}>
                {t('about.add')}
              </Caption>
            </Pressable>
          )}
        </Card>

        {/* --- إدارة حسابي ------------------------------------------------ */}
        <View style={{ rowGap: theme.spacing.md }}>
          <Text variant="subtitle" weight="bold">
            {t('manage.title')}
          </Text>
          {rows.map((row, i) => (
            <View key={i} style={{ flexDirection: 'row', columnGap: theme.spacing.md }}>
              {row.map((item) => (
                <ManageTile key={item.key} item={item} />
              ))}
            </View>
          ))}
        </View>

        {/* --- kept account functionality --------------------------------- */}
        {interfaceSwitch.canSwitch || caps.canAccessManagementArea ? (
          <Card padding="lg" variant="outlined">
            <View style={{ rowGap: theme.spacing.md }}>
              {interfaceSwitch.canSwitch ? (
                <View style={{ rowGap: theme.spacing.sm }}>
                  <Caption color="textSecondary">{t('more.mode')}</Caption>
                  <View style={{ flexDirection: 'row', columnGap: theme.spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <Button
                        label={ta('mode.owner')}
                        variant={mode.activeMode === 'owner' ? 'primary' : 'ghost'}
                        size="sm"
                        fullWidth
                        disabled={interfaceSwitch.switching}
                        onPress={() => void interfaceSwitch.switchTo('owner')}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        label={ta('mode.veterinarian')}
                        variant={mode.activeMode === 'veterinarian' ? 'primary' : 'ghost'}
                        size="sm"
                        fullWidth
                        loading={interfaceSwitch.switching}
                        disabled={interfaceSwitch.switching}
                        onPress={() => void interfaceSwitch.switchTo('veterinarian')}
                      />
                    </View>
                  </View>
                </View>
              ) : null}
              {caps.canAccessManagementArea ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('more.management')}
                  onPress={() => router.push(Routes.managementHome)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    columnGap: theme.spacing.md,
                  }}
                >
                  <Icon name="shield-checkmark-outline" size="iconMd" color="primary" />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium">{t('more.management')}</Text>
                    <Caption color="textSecondary">{t('more.managementHint')}</Caption>
                  </View>
                  <Icon name="chevron-forward" directional size="iconSm" color="textMuted" />
                </Pressable>
              ) : null}
            </View>
          </Card>
        ) : null}

        {/* --- تسجيل الخروج ------------------------------------------------ */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('signOut.title')}
          disabled={logout.isPending}
          onPress={() => setConfirmLogout(true)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: theme.spacing.md,
            padding: theme.spacing.lg,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.colors.dangerSoft,
            opacity: pressed || logout.isPending ? 0.8 : 1,
          })}
        >
          <Icon name="settings-outline" size="iconMd" color="danger" />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text variant="bodyStrong" color="danger">
              {t('signOut.title')}
            </Text>
            <Caption color="textSecondary">{t('signOut.hint')}</Caption>
          </View>
          <Icon name="log-out-outline" size="iconMd" color="danger" />
        </Pressable>
      </View>

      <ConfirmationDialog
        visible={confirmLogout}
        title={t('signOut.confirmTitle')}
        message={t('signOut.confirmBody')}
        confirmLabel={t('signOut.title')}
        cancelLabel={t('signOut.cancel')}
        destructive
        loading={logout.isPending}
        onConfirm={() => {
          setConfirmLogout(false);
          logout.mutate();
        }}
        onCancel={() => setConfirmLogout(false)}
      />
    </ScrollScreen>
  );
}

function ContactCell({
  label,
  value,
  icon,
  divider,
  onPress,
}: {
  label: string;
  value: string | null;
  icon: IconName;
  divider?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('profile');
  return (
    <Pressable
      accessibilityRole={onPress ? 'link' : undefined}
      accessibilityLabel={`${label}: ${value ?? t('contact.none')}`}
      disabled={!onPress}
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: 'center',
        rowGap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.xs,
        borderColor: theme.colors.border,
        borderStartWidth: divider ? 1 : 0,
      }}
    >
      <Text variant="bodyMedium" numberOfLines={1}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4, maxWidth: '100%' }}>
        <Icon name={icon} size="iconSm" color="primary" />
        <Caption
          color={value ? 'primary' : 'textMuted'}
          numberOfLines={1}
          style={{ flexShrink: 1, writingDirection: 'ltr' }}
        >
          {value ?? t('contact.none')}
        </Caption>
      </View>
    </Pressable>
  );
}

function ManageTile({ item }: { item: ManageItem }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title}
      onPress={() => router.push(item.href)}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: 'center',
        rowGap: theme.spacing.xs,
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Icon name={item.icon} size="iconLg" color="primary" />
      <Text variant="bodyStrong" numberOfLines={1} style={{ textAlign: 'center' }}>
        {item.title}
      </Text>
      <Caption color="textSecondary" numberOfLines={2} style={{ textAlign: 'center' }}>
        {item.hint}
      </Caption>
    </Pressable>
  );
}
