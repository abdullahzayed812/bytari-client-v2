import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { IconButton } from '@/components/actions';
import { Text } from '@/components/typography';
import { Routes } from '@/constants/routes';
import { useTheme } from '@/theme';

import { useOrgStoreAvailability, useOrgStoreCart } from '../hooks';

/** Header cart icon for one clinic / office store, with the live item count. */
export function OrgStoreCartButton({ organizationId }: { organizationId: string }) {
  const theme = useTheme();
  const { t } = useTranslation('organizationStore');
  const { storeEnabled, isLoading } = useOrgStoreAvailability(organizationId);
  // Wait for the store's availability so a disabled store is never asked for its cart.
  const cart = useOrgStoreCart(organizationId, { enabled: storeEnabled && !isLoading });
  const count = cart.data?.itemCount ?? 0;

  // A clinic store the Admin turned off has no entry point.
  if (!storeEnabled) return null;

  return (
    <View>
      <IconButton
        icon="cart-outline"
        variant="soft"
        accessibilityLabel={t('cartButton.a11y', { count })}
        onPress={() => router.push(Routes.orgStoreCart(organizationId))}
      />
      {count > 0 ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -4,
            end: -4,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 4,
            borderRadius: 9,
            backgroundColor: theme.colors.danger,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="caption" style={{ color: theme.colors.onPrimary, fontSize: 10 }}>
            {count > 99 ? '99+' : String(count)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
