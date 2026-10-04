import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useApp, useT } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useLatestNews, useMarkets } from '@/hooks/useLiveData';
import { CoinAvatar, CoinRow, ErrorState, formatMoney, PriceChange, PriceChart, Screen, SectionTitle } from '@/components/ui';

export default function HomeScreen() {
  const colors = useColors();
  const t = useT();
  const { currency, locale, favorites, toggleFavorite } = useApp();
  const market = useMarkets();
  const news = useLatestNews();
  const coins = market.data ?? [];
  const bitcoin = coins.find((coin) => coin.id === 'bitcoin');
  const latestNews = news.data?.slice(0, 3) ?? [];
  const movers = useMemo(
    () => [...coins].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)).slice(0, 4),
    [coins],
  );

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, gap: 23 }}
        refreshControl={
          <RefreshControl
            refreshing={market.isRefetching || news.isRefetching}
            onRefresh={() => {
              void market.refetch();
              void news.refetch();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.hero, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="activity" size={19} color="#43D3B0" />
            </View>
            <View>
              <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 }}>AZ KRİPTO</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>{t('liveMarket')}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            <Pressable onPress={() => router.push('/(tabs)/markets')} accessibilityLabel={t('search')} style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="search" size={20} color={colors.foreground} />
            </Pressable>
            <Pressable onPress={() => router.push('/(tabs)/settings')} accessibilityLabel={t('settings')} style={{ width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="settings" size={20} color={colors.foreground} />
            </Pressable>
          </View>
        </View>

        {market.isLoading ? (
          <View style={{ minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{t('liveMarket')}</Text>
          </View>
        ) : market.isError ? (
          <ErrorState message={t('dataUnavailable')} retry={() => void market.refetch()} />
        ) : bitcoin ? (
          <>
            <View style={{ backgroundColor: colors.hero, borderRadius: 24, padding: 20, overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                  <CoinAvatar coin={bitcoin} size={34} />
                  <View>
                    <Text style={{ color: colors.heroForeground, fontSize: 14, fontWeight: '700' }}>Bitcoin</Text>
                    <Text style={{ color: '#9FAFB9', fontSize: 11, marginTop: 2 }}>BTC · #{bitcoin.rank}</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: '#19352F', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#54D2AF' }} />
                  <Text style={{ color: '#75DEC3', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 }}>{t('live')}</Text>
                </View>
              </View>
              <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: colors.heroForeground, fontSize: 31, fontWeight: '800', letterSpacing: -1.1, marginTop: 20 }}>
                {formatMoney(bitcoin.price, currency, locale)}
              </Text>
              <View style={{ marginTop: 7 }}>
                <PriceChange value={bitcoin.change24h} large />
              </View>
              <View style={{ marginHorizontal: -10, marginTop: 8 }}>
                <PriceChart values={bitcoin.sparkline} height={100} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#283A47' }}>
                <Text style={{ color: '#9FAFB9', fontSize: 11 }}>{t('volume')}</Text>
                <Text style={{ color: colors.heroForeground, fontSize: 11, fontWeight: '700' }}>{formatMoney(bitcoin.volume24h, currency, locale, true)}</Text>
              </View>
            </View>

            <View>
              <SectionTitle title={t('topMovers')} action={t('allCoins')} onAction={() => router.push('/(tabs)/markets')} />
              <View style={{ backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border }}>
                {movers.map((coin) => (
                  <CoinRow
                    key={coin.id}
                    coin={coin}
                    favorite={favorites.includes(coin.id)}
                    onPress={() => router.push({ pathname: '/coin/[id]', params: { id: coin.id } })}
                    onFavorite={() => {
                      void Haptics.selectionAsync();
                      toggleFavorite(coin.id);
                    }}
                  />
                ))}
              </View>
            </View>

            <View>
              <SectionTitle title={t('latestNews')} action={t('allNews')} onAction={() => router.push('/news')} />
              {news.isLoading && latestNews.length === 0 ? (
                <View style={{ paddingVertical: 25, alignItems: 'center' }}><ActivityIndicator color={colors.primary} /></View>
              ) : news.isError && latestNews.length === 0 ? (
                <Text style={{ color: colors.mutedForeground, fontSize: 13, paddingVertical: 14 }}>{t('newsUnavailable')}</Text>
              ) : (
                latestNews.map((story, index) => (
                  <Pressable
                    key={story.id}
                    onPress={() => router.push('/news')}
                    style={{ paddingVertical: 14, borderBottomWidth: index === latestNews.length - 1 ? 0 : 1, borderBottomColor: colors.border }}
                  >
                    <Text numberOfLines={2} style={{ color: colors.foreground, fontSize: 14, lineHeight: 21, fontWeight: '700' }}>{story.title}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 7 }}>{story.source}</Text>
                  </Pressable>
                ))
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
