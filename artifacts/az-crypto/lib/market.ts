import type { Currency } from '@/context/AppContext';
import type { ListCryptoNewsQueryResult } from '@workspace/api-client-react';

const COINGECKO = 'https://api.coingecko.com/api/v3';

export interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  rank: number;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
  sparkline: number[];
  lastUpdated: string;
}

export type NewsStory = ListCryptoNewsQueryResult[number];

export type ChartRange = 1 | 7 | 30 | 90 | 365;

const currencyRates = new Map<Currency, { value: number; until: number }>();

async function jsonRequest<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    if (response.status === 429) throw new Error('The market-data provider is rate limiting requests.');
    throw new Error(`Market-data request failed (${response.status}).`);
  }
  return (await response.json()) as T;
}

async function getUsdRate(currency: Currency, signal?: AbortSignal): Promise<number> {
  if (currency === 'USD') return 1;
  const cached = currencyRates.get(currency);
  if (cached && cached.until > Date.now()) return cached.value;
  const data = await jsonRequest<{ result: string; rates?: Record<string, number> }>(
    'https://open.er-api.com/v6/latest/USD',
    signal,
  );
  const rate = data.rates?.[currency];
  if (data.result !== 'success' || !rate || !Number.isFinite(rate)) {
    throw new Error(`A current USD/${currency} exchange rate is unavailable.`);
  }
  currencyRates.set(currency, { value: rate, until: Date.now() + 30 * 60 * 1000 });
  return rate;
}

interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  market_cap_rank: number | null;
  current_price: number;
  price_change_percentage_24h: number | null;
  total_volume: number;
  market_cap: number;
  high_24h: number;
  low_24h: number;
  sparkline_in_7d?: { price?: number[] };
  last_updated: string;
}

export async function fetchMarkets(currency: Currency, signal?: AbortSignal): Promise<MarketCoin[]> {
  const [raw, rate] = await Promise.all([
    jsonRequest<CoinGeckoMarket[]>(
      `${COINGECKO}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h`,
      signal,
    ),
    getUsdRate(currency, signal),
  ]);
  if (!Array.isArray(raw) || raw.length === 0) throw new Error('The market-data provider returned no coins.');
  return raw.map((coin, index) => ({
    id: coin.id,
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    image: coin.image,
    rank: coin.market_cap_rank ?? index + 1,
    price: coin.current_price * rate,
    change24h: coin.price_change_percentage_24h ?? 0,
    volume24h: coin.total_volume * rate,
    marketCap: coin.market_cap * rate,
    high24h: coin.high_24h * rate,
    low24h: coin.low_24h * rate,
    sparkline: coin.sparkline_in_7d?.price ?? [],
    lastUpdated: coin.last_updated,
  }));
}

interface MarketChartResponse {
  prices?: [number, number][];
}

export async function fetchChart(
  coinId: string,
  currency: Currency,
  days: ChartRange,
  signal?: AbortSignal,
): Promise<number[]> {
  const [data, rate] = await Promise.all([
    jsonRequest<MarketChartResponse>(
      `${COINGECKO}/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=usd&days=${days}`,
      signal,
    ),
    getUsdRate(currency, signal),
  ]);
  const points = data.prices?.map((entry) => entry[1] * rate) ?? [];
  if (points.length < 2) throw new Error('The chart provider returned too few price points.');
  return points;
}
