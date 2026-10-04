import { getListCryptoNewsQueryKey, useListCryptoNews } from '@workspace/api-client-react';
import { useQuery } from '@tanstack/react-query';
import { useApp } from '@/context/AppContext';
import { fetchChart, fetchMarkets, type ChartRange } from '@/lib/market';

export function useMarkets() {
  const { currency } = useApp();
  return useQuery({
    queryKey: ['market-coins', currency],
    queryFn: ({ signal }) => fetchMarkets(currency, signal),
    staleTime: 20_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: 1,
  });
}

export function useLatestNews() {
  return useListCryptoNews({
    query: {
      queryKey: getListCryptoNewsQueryKey(),
      staleTime: 5 * 60_000,
      refetchInterval: 10 * 60_000,
      refetchIntervalInBackground: false,
      retry: 1,
    },
  });
}

export function usePriceChart(coinId: string, days: ChartRange) {
  const { currency } = useApp();
  return useQuery({
    queryKey: ['market-chart', coinId, currency, days],
    queryFn: ({ signal }) => fetchChart(coinId, currency, days, signal),
    staleTime: 45_000,
    retry: 1,
  });
}