import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { BottomTabBar } from '@/components/navigation';
import { useAppMode } from '@/hooks';

/**
 * The shared five-destination shell from the reference design. The custom
 * `BottomTabBar` (raised circular Home) is final.
 *
 * Order in the bar (RTL): Account · Animals · [Home] · Store/More · Categories.
 *
 * Two slots' titles are mode-aware:
 *  - "more"     → Pet Owners Store (owner) / Veterinarian Store (vet) — both
 *                 a store now, so the title is always `tabs.store` — see
 *                 `StoreTabScreen`
 *  - "services" → "كل الأقسام" category grid (owner) / Services hub (vet) — see `CategoriesTabScreen`
 * "animals" is mode-aware in BOTH title AND icon (see `BottomTabBar`'s
 * `iconFor`) — the one truly Pet-Owner-specific tab item, replaced with "my
 * veterinary organizations" in Veterinarian mode (Veterinary Office Dashboard
 * spec §2) — see `AnimalsTabScreen`.
 */
export default function TabsLayout() {
  const { t } = useTranslation('nav');
  const { isVeterinarianMode } = useAppMode();

  return (
    <Tabs tabBar={(props) => <BottomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="account" options={{ title: t('tabs.account') }} />
      <Tabs.Screen
        name="animals"
        options={{ title: isVeterinarianMode ? t('tabs.myOrganizations') : t('tabs.animals') }}
      />
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="more" options={{ title: t('tabs.store') }} />
      <Tabs.Screen
        name="services"
        options={{ title: isVeterinarianMode ? t('tabs.services') : t('tabs.categories') }}
      />
    </Tabs>
  );
}
