import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

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

import { useEggRates, useSaveEggRates } from '../hooks';
import type { EggRateEntryInput } from '../types';

const today = () => new Date().toISOString().slice(0, 10);

/** Route `/(app)/poultry/egg-exchange-rates/entry` — admin/specialist bourse entry. */
export default function EggExchangeRateEntryScreen() {
  const theme = useTheme();
  const { t } = useTranslation('poultryMarket');
  const toast = useToast();
  const caps = useCapabilities();
  const canManage = caps.isAdmin || caps.isSupervisorOf('MARKET') || caps.can('market.rate.manage');

  const date = today();
  const q = useEggRates(date, { enabled: canManage });
  const save = useSaveEggRates(date);

  const [price, setPrice] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!q.data) return;
    const next: Record<string, string> = {};
    for (const entry of q.data) {
      if (entry.eggPricePerTray != null) next[entry.governorate] = entry.eggPricePerTray;
    }
    setPrice(next);
  }, [q.data]);

  const entries: EggRateEntryInput[] = useMemo(
    () =>
      IRAQ_GOVERNORATES.map((governorate) => ({
        governorate,
        eggPricePerTray: price[governorate]?.trim() || undefined,
      })).filter((e) => e.eggPricePerTray != null),
    [price],
  );

  if (!canManage) {
    return (
      <ScrollScreen>
        <AppHeader title={t('exchangeRates.entryTitleEgg')} showBack />
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
      <AppHeader title={t('exchangeRates.entryTitleEgg')} showBack />

      <Section spacing="lg">
        <Caption>{t('exchangeRates.entryHintEgg')}</Caption>
      </Section>

      {IRAQ_GOVERNORATES.map((governorate) => (
        <Section key={governorate} spacing="lg">
          <Caption>{governorate}</Caption>
          <Input
            placeholder={t('exchangeRates.entryEggLabel')}
            keyboardType="decimal-pad"
            value={price[governorate] ?? ''}
            onChangeText={(v) => setPrice((prev) => ({ ...prev, [governorate]: v }))}
            containerStyle={{ marginTop: theme.spacing.xs }}
          />
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
