import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useApp, useT } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { useMarkets } from '@/hooks/useLiveData';
import { CoinRow, EmptyState, ErrorState, Header, Pill, Screen } from '@/components/ui';

export default function MarketsScreen() {
  const colors = useColors();
  const t = useT();
  const { favorites, toggleFavorite } = useApp();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const market = useMarkets();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (market.data ?? []).filter((coin) => {
      const matchesText = !query || coin.name.toLowerCase().includes(query) || coin.symbol.toLowerCase().includes(query);
      return matchesText && (filter === 'all' || favorites.includes(coin.id));
    });
  }, [favorites, filter, market.data, search]);

  return (
    <Screen>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, flexGrow: 1 }}
        ListHeaderComponent={
          <View style={{ gap: 18, marginBottom: 12 }}>
            <Header title={t('markets')} subtitle={t('overview')} />
            <View style={{ height: 48, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: 15, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 }}>
              <Feather name="search" size={18} color={colors.mutedForeground} />
              <TextInput
                accessibilityLabel={t('search')}
                placeholder={t('search')}
                placeholderTextColor={colors.mutedForeground}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                returnKeyType="search"
                style={{ flex: 1, color: colors.foreground, fontSize: 14, paddingVertical: 0 }}
              />
              {search ? (
                <Pressable onPress={() => setSearch('')} accessibilityLabel="Clear search">
                  <Feather name="x-circle" size={17} color={colors.mutedForeground} />
                </Pressable>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pill label={t('allCoins')} active={filter === 'all'} onPress={() => setFilter('all')} />
              <Pill label={t('favorites')} active={filter === 'favorites'} onPress={() => setFilter('favorites')} />
              <View style={{ flex: 1 }} />
              <View style={{ justifyContent: 'center' }}>
                {market.dataUpdatedAt > 0 ? <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>{market.data?.length} coins</Text> : null}
              </View>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <CoinRow
            coin={item}
            favorite={favorites.includes(item.id)}
            onPress={() => router.push({ pathname: '/coin/[id]', params: { id: item.id } })}
            onFavorite={() => {
              void Haptics.selectionAsync();
              toggleFavorite(item.id);
            }}
          />
        )}
        ListEmptyComponent={
          market.isLoading ? (
            <View style={{ flex: 1, minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{t('liveMarket')}</Text>
            </View>
          ) : market.isError ? (
            <ErrorState message={t('dataUnavailable')} retry={() => void market.refetch()} />
          ) : filter === 'favorites' && !search ? (
            <EmptyState title={t('noFavorites')} detail={t('noFavoritesHint')} />
          ) : (
            <EmptyState title={t('noResults')} detail={t('noResults')} />
          )
        }
      />
    </Screen>
  );
}