import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Caption, Text } from '@/components/typography';
import { IRAQ_GOVERNORATES } from '@/constants/governorates';
import { useTheme } from '@/theme';

import type { EggRateEntry, PoultryRateEntry, Trend } from '../types';

function TrendDot({ trend }: { trend: Trend | null }) {
  const theme = useTheme();
  if (!trend) return null;
  const color =
    trend === 'UP' ? theme.colors.success : trend === 'DOWN' ? theme.colors.danger : theme.colors.textMuted;
  return <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }} />;
}

function Cell({ value, trend }: { value: string | null; trend?: Trend | null }) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', columnGap: 6 }}>
      <Text variant="bodyMedium" color={value ? 'textPrimary' : 'textMuted'}>
        {value ?? '—'}
      </Text>
      {trend !== undefined ? <TrendDot trend={trend} /> : null}
    </View>
  );
}

export interface ExchangeRateTableProps {
  board: 'POULTRY' | 'EGG';
  poultryEntries?: PoultryRateEntry[];
  eggEntries?: EggRateEntry[];
  showTrend?: boolean;
}

/**
 * Read-only governorate price table shared by both bourse viewer screens —
 * always renders all 18 governorates (canonical `IRAQ_GOVERNORATES` order),
 * filling in "—" for any without a saved entry for the selected date.
 */
export function ExchangeRateTable({
  board,
  poultryEntries = [],
  eggEntries = [],
  showTrend = false,
}: ExchangeRateTableProps) {
  const theme = useTheme();
  const { t } = useTranslation('poultryMarket');

  const poultryByGov = useMemo(
    () => new Map(poultryEntries.map((e) => [e.governorate, e])),
    [poultryEntries],
  );
  const eggByGov = useMemo(() => new Map(eggEntries.map((e) => [e.governorate, e])), [eggEntries]);

  return (
    <View style={{ borderRadius: theme.radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border }}>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: theme.colors.primary,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
        }}
      >
        <Text variant="label" style={{ flex: 1.4, color: theme.colors.onPrimary }}>
          {t('exchangeRates.columnGovernorate')}
        </Text>
        {board === 'POULTRY' ? (
          <>
            <Text variant="label" style={{ flex: 1, color: theme.colors.onPrimary, textAlign: 'center' }}>
              {t('exchangeRates.columnMeatPrice')}
            </Text>
            <Text variant="label" style={{ flex: 1, color: theme.colors.onPrimary, textAlign: 'center' }}>
              {t('exchangeRates.columnLayerPrice')}
            </Text>
          </>
        ) : (
          <Text variant="label" style={{ flex: 1, color: theme.colors.onPrimary, textAlign: 'center' }}>
            {t('exchangeRates.columnEggPrice')}
          </Text>
        )}
      </View>

      {IRAQ_GOVERNORATES.map((governorate, index) => {
        const poultry = poultryByGov.get(governorate);
        const egg = eggByGov.get(governorate);
        return (
          <View
            key={governorate}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.md,
              backgroundColor: index % 2 === 0 ? theme.colors.surface : theme.colors.surfaceMuted,
            }}
          >
            <Text variant="bodyMedium" style={{ flex: 1.4 }}>
              {governorate}
            </Text>
            {board === 'POULTRY' ? (
              <>
                <Cell
                  value={poultry?.meatPricePerKg ?? null}
                  trend={showTrend ? poultry?.meatTrend ?? null : undefined}
                />
                <Cell
                  value={poultry?.layerPricePerBird ?? null}
                  trend={showTrend ? poultry?.layerTrend ?? null : undefined}
                />
              </>
            ) : (
              <Cell
                value={egg?.eggPricePerTray ?? null}
                trend={showTrend ? egg?.trend ?? null : undefined}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

export function ExchangeRateLegend() {
  const theme = useTheme();
  const { t } = useTranslation('poultryMarket');
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', columnGap: theme.spacing.md }}>
      <LegendItem color={theme.colors.success} label={t('exchangeRates.legendUp')} />
      <LegendItem color={theme.colors.danger} label={t('exchangeRates.legendDown')} />
      <LegendItem color={theme.colors.textMuted} label={t('exchangeRates.legendFlat')} />
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Caption>{label}</Caption>
    </View>
  );
}
