import { useMutation, useQuery, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { poultryMarketApi, poultryMarketKeys } from '../api';
import type { EggRateEntry, EggRateEntryInput, PoultryRateEntry, PoultryRateEntryInput } from '../types';

export function usePoultryRates(date: string, options: { enabled?: boolean } = {}) {
  return useQuery<PoultryRateEntry[]>({
    queryKey: poultryMarketKeys.exchangeRates.poultry(date),
    queryFn: () => poultryMarketApi.exchangeRates.getPoultry(date),
    enabled: options.enabled ?? true,
  });
}

export function useSavePoultryRates(
  date: string,
): UseMutationResult<{ success: boolean }, unknown, PoultryRateEntryInput[]> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['market', 'exchange-rates', 'poultry', 'save', date],
    mutationFn: (entries: PoultryRateEntryInput[]) => poultryMarketApi.exchangeRates.savePoultry(date, entries),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: poultryMarketKeys.exchangeRates.poultry(date) });
    },
  });
}

export function useEggRates(date: string, options: { enabled?: boolean } = {}) {
  return useQuery<EggRateEntry[]>({
    queryKey: poultryMarketKeys.exchangeRates.egg(date),
    queryFn: () => poultryMarketApi.exchangeRates.getEgg(date),
    enabled: options.enabled ?? true,
  });
}

export function useSaveEggRates(
  date: string,
): UseMutationResult<{ success: boolean }, unknown, EggRateEntryInput[]> {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['market', 'exchange-rates', 'egg', 'save', date],
    mutationFn: (entries: EggRateEntryInput[]) => poultryMarketApi.exchangeRates.saveEgg(date, entries),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: poultryMarketKeys.exchangeRates.egg(date) });
    },
  });
}
