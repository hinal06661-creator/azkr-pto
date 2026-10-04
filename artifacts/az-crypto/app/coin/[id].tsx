import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useApp, useT } from '@/context/AppContext';
import { formatMoney, Header, Pill, PriceChange, PriceChart, Screen } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useMarkets, usePriceChart } from '@/hooks/useLiveData';
import type { ChartRange } from '@/lib/market';

const ranges: { days: ChartRange; label: 'interval1' | 'interval7' | 'interval30' | 'interval90' | 'interval365' }[] = [
  { days: 1, label: 'interval1' },
  { days: 7, label: 'interval7' },
  { days: 30, label: 'interval30' },
  { days: 90, label: 'interval90' },
  { days: 365, label: 'interval365' },
];

export default function CoinDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const coinId = Array.isArray(params.id) ? params.id[0] : params.id;
  const colors = useColors();
  const t = useT();
  const { currency, locale, favorites, toggleFavorite } = useApp();
  const [range, setRange] = useState<ChartRange>(7);
  const market = useMarkets();
  const chart = usePriceChart(coinId ?? '', range);
  const coin = useMemo(() => market.data?.find((item) => item.id === coinId), [coinId, market.data]);
  const initialValues = coin?.sparkline ?? [];
  const values = chart.data ?? initialValues;
  const low = coin?.low24h ?? Math.min(...initialValues);
  const high = coin?.high24h ?? Math.max(...initialValues);
  const favorite = coin ? favorites.includes(coin.id) : false;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 34, gap: 20 }}>
        <Header
          title={coin?.name ?? (market.isLoading ? t('liveMarket') : t('dataUnavailable'))}
          subtitle={coin ? `${coin.symbol} · #${coin.rank}` : undefined}
          right={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {coin ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={favorite ? t('removeFromWatchlist') : t('addToWatchlist')}
                  onPress={() => {
                    toggleFavorite(coin.id);
                    void Haptics.selectionAsync();
                  }}
                  style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name={favorite ? 'star' : 'star-outline'} size={21} color={favorite ? colors.primary : colors.foreground} />
                </Pressable>
              ) : null}
              <Pressable onPress={() => router.back()} accessibilityLabel={t('home')} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="x" size={21} color={colors.foreground} />
              </Pressable>
            </View>
          }
        />

        {!coin && market.isLoading ? <View style={{ height: 180, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View> : null}

        {coin ? (
          <>
            <View style={{ marginTop: 7 }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{t('liveMarket')}</Text>
              <Text adjustsFontSizeToFit numberOfLines={1} style={{ color: colors.foreground, fontSize: 34, fontWeight: '800', letterSpacing: -1.2, marginTop: 5 }}>
                {formatMoney(coin.price, currency, locale)}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 8 }}>
                <PriceChange value={coin.change24h} large />
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{t('dailyChange')}</Text>
              </View>
            </View>

            <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '700' }}>{t('chart')}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>{chart.isFetching ? t('retrying') : `${t('updated')} · ${t('live')}`}</Text>
              </View>
              {chart.isLoading && initialValues.length === 0 ? (
                <View style={{ height: 175, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>
              ) : values.length > 1 ? (
                <PriceChart values={values} height={175} />
              ) : (
                <Text style={{ color: colors.mutedForeground, paddingVertical: 45, textAlign: 'center', fontSize: 13 }}>{t('noChart')}</Text>
              )}
              <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'space-between', marginTop: 8 }}>
                {ranges.map((item) => (
                  <Pill key={item.days} label={t(item.label)} active={range === item.days} onPress={() => setRange(item.days)} />
                ))}
              </View>
              {chart.isError && initialValues.length > 1 ? (
                <Text style={{ color: colors.mutedForeground, fontSize: 10, textAlign: 'center', marginTop: 8 }}>{t('noChart')}</Text>
              ) : null}
            </View>

            <View style={{ gap: 10 }}>
              <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '700' }}>{t('overview')}</Text>
              <View style={{ backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 15 }}>
                <Metric label={t('marketCap')} value={formatMoney(coin.marketCap, currency, locale, true)} />
                <Metric label={t('volume')} value={formatMoney(coin.volume24h, currency, locale, true)} />
                <Metric label={t('dayRange')} value={`${formatMoney(low, currency, locale)} – ${formatMoney(high, currency, locale)}`} />
                <Metric label={t('rank')} value={`#${coin.rank}`} last />
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Metric({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingBottom: last ? 0 : 13, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{label}</Text>
      <Text numberOfLines={1} style={{ color: colors.foreground, fontSize: 12, fontWeight: '700', flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}