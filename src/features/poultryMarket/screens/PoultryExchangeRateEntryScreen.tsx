import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/actions';
import { EmptyState, useToast } from '@/components/feedback';
import { Input } from '@/components/forms';
import { ScrollScreen, Section } from '@/components/layout';
import { AppHeader } from '@/components/navigation';
import { Caption } from '@/components/typography';
import { IRAQ_GOVERNORATES } from '@/constants/governorates';
import { useCapabilities } from '@/hooks';
import { apiErrorMessage } from '@/lib/apiError';
import { useTheme } from '@/theme';

import { usePoultryRates, useSavePoultryRates } from '../hooks';
import type { PoultryRateEntryInput } from '../types';

const today = () => new Date().toISOString().slice(0, 10);

/** Route `/(app)/poultry/exchange-rates/entry` — admin/specialist bourse entry. */
export default function PoultryExchangeRateEntryScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultryMarket');
  const toast = useToast();
  const caps = useCapabilities();
  const canManage = caps.isAdmin || caps.isSupervisorOf('MARKET') || caps.can('market.rate.manage');

  const date = today();
  const q = usePoultryRates(date, { enabled: canManage });
  const save = useSavePoultryRates(date);

  const [meat, setMeat] = useState<Record<string, string>>({});
  const [layer, setLayer] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!q.data) return;
    const nextMeat: Record<string, string> = {};
    const nextLayer: Record<string, string> = {};
    for (const entry of q.data) {
      if (entry.meatPricePerKg != null) nextMeat[entry.governorate] = entry.meatPricePerKg;
      if (entry.layerPricePerBird != null) nextLayer[entry.governorate] = entry.layerPricePerBird;
    }
    setMeat(nextMeat);
    setLayer(nextLayer);
  }, [q.data]);

  const entries: PoultryRateEntryInput[] = useMemo(
    () =>
      IRAQ_GOVERNORATES.map((governorate) => ({
        governorate,
        meatPricePerKg: meat[governorate]?.trim() || undefined,
        layerPricePerBird: layer[governorate]?.trim() || undefined,
      })).filter((e) => e.meatPricePerKg != null || e.layerPricePerBird != null),
    [meat, layer],
  );

  if (!canManage) {
    return (
      <ScrollScreen>
        <AppHeader title={t('exchangeRates.entryTitlePoultry')} showBack />
        <EmptyState icon="lock-closed-outline" title={t('gate.notRegisteredTitle')} />
      </ScrollScreen>
    );
  }

  const onSave = () => {
    save.mutate(entries, {
      onSuccess: () => {
        toast.show({ tone: 'success', message: t('exchangeRates.saveSuccess') });
        router.back();
      },
      onError: (error) => toast.show({ tone: 'danger', message: apiErrorMessage(error) }),
    });
  };

  return (
    <ScrollScreen>
      <AppHeader title={t('exchangeRates.entryTitlePoultry')} showBack />

      <Section spacing="lg">
        <Caption>{t('exchangeRates.entryHintPoultry')}</Caption>
      </Section>

      {IRAQ_GOVERNORATES.map((governorate) => (
        <Section key={governorate} spacing="lg">
          <Caption>{governorate}</Caption>
          <View style={{ flexDirection: 'row', columnGap: theme.spacing.md, marginTop: theme.spacing.xs }}>
            <View style={{ flex: 1 }}>
              <Input
                placeholder={t('exchangeRates.entryMeatLabel')}
                keyboardType="decimal-pad"
                value={meat[governorate] ?? ''}
                onChangeText={(v) => setMeat((prev) => ({ ...prev, [governorate]: v }))}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                placeholder={t('exchangeRates.entryLayerLabel')}
                keyboardType="decimal-pad"
                value={layer[governorate] ?? ''}
                onChangeText={(v) => setLayer((prev) => ({ ...prev, [governorate]: v }))}
              />
            </View>
          </View>
        </Section>
      ))}

      <Section spacing="xl">
        <Button
          label={t('exchangeRates.save')}
          fullWidth
          loading={save.isPending}
          disabled={save.isPending}
          onPress={onSave}
        />
      </Section>
    </ScrollScreen>
  );
}
