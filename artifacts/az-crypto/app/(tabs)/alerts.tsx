import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useApp, useT } from '@/context/AppContext';
import {
  CoinAvatar,
  EmptyState,
  formatMoney,
  Header,
  Pill,
  Screen,
} from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useMarkets } from '@/hooks/useLiveData';

export default function AlertsScreen() {
  const colors = useColors();
  const t = useT();
  const { alerts, currency, locale, addAlert, removeAlert, toggleAlert } = useApp();
  const market = useMarkets();
  const [coinId, setCoinId] = useState('bitcoin');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [targetPrice, setTargetPrice] = useState('');
  const chosenCoin = market.data?.find((coin) => coin.id === coinId) ?? market.data?.[0];
  const selectedId = chosenCoin?.id ?? coinId;
  const selectedCoins = useMemo(() => (market.data ?? []).slice(0, 10), [market.data]);

  const onAdd = () => {
    const normalized = Number(targetPrice.replace(',', '.'));
    if (!chosenCoin || !Number.isFinite(normalized) || normalized <= 0) {
      Alert.alert(t('createAlert'), t('invalidPrice'));
      return;
    }
    addAlert({
      coinId: chosenCoin.id,
      coinName: chosenCoin.name,
      symbol: chosenCoin.symbol,
      price: normalized,
      condition,
    });
    setTargetPrice('');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(t('alertAdded'));
  };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 34, gap: 22 }}>
        <Header
          title={t('alerts')}
          subtitle={t('notificationsHint')}
          right={
            <Pressable onPress={() => router.push('/(tabs)/settings')} accessibilityLabel={t('settings')} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="settings" size={20} color={colors.foreground} />
            </Pressable>
          }
        />

        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 16, gap: 16 }}>
          <View>
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700' }}>{t('createAlert')}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 18, marginTop: 5 }}>{t('chooseCoin')}</Text>
          </View>
          {selectedCoins.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {selectedCoins.map((coin) => (
                <Pressable
                  key={coin.id}
                  onPress={() => setCoinId(coin.id)}
                  style={{
                    borderRadius: 16,
                    paddingVertical: 8,
                    paddingHorizontal: 11,
                    borderWidth: 1,
                    borderColor: selectedId === coin.id ? colors.primary : colors.border,
                    backgroundColor: selectedId === coin.id ? colors.accent : colors.background,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 7,
                  }}
                >
                  <CoinAvatar coin={coin} size={21} />
                  <Text style={{ color: selectedId === coin.id ? colors.accentForeground : colors.foreground, fontSize: 12, fontWeight: '700' }}>{coin.symbol}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{t('dataUnavailable')}</Text>
          )}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pill label={t('priceAbove')} active={condition === 'above'} onPress={() => setCondition('above')} />
            <Pill label={t('priceBelow')} active={condition === 'below'} onPress={() => setCondition('below')} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, height: 52, borderWidth: 1, borderColor: colors.input, borderRadius: 14, paddingHorizontal: 13, justifyContent: 'center', backgroundColor: colors.background }}>
              <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '700', marginBottom: 2 }}>{t('targetPrice')} · {currency}</Text>
              <TextInput
                accessibilityLabel={t('targetPrice')}
                value={targetPrice}
                onChangeText={setTargetPrice}
                keyboardType="decimal-pad"
                placeholder={chosenCoin ? String(Number(chosenCoin.price.toFixed(2))) : '0.00'}
                placeholderTextColor={colors.mutedForeground}
                style={{ color: colors.foreground, fontSize: 15, fontWeight: '700', padding: 0 }}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onAdd}
              disabled={!chosenCoin}
              style={({ pressed }) => ({
                height: 52,
                minWidth: 52,
                borderRadius: 15,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed || !chosenCoin ? 0.65 : 1,
              })}
            >
              <Ionicons name="add" size={23} color={colors.primaryForeground} />
            </Pressable>
          </View>
          {chosenCoin ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>
              {chosenCoin.name} · {t('liveMarket')}: {formatMoney(chosenCoin.price, currency, locale)}
            </Text>
          ) : null}
        </View>

        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '700' }}>{t('alerts')}</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>{alerts.length}</Text>
          </View>
          {alerts.length === 0 ? (
            <EmptyState title={t('noAlerts')} detail={t('noAlertsHint')} />
          ) : (
            <View style={{ backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 15 }}>
              {alerts.map((alert, index) => {
                const status = alert.triggeredAt ? t('alertTriggered') : alert.enabled ? t('alertActive') : t('alertPaused');
                const current = market.data?.find((coin) => coin.id === alert.coinId);
                return (
                  <View key={alert.id} style={{ minHeight: 75, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomColor: colors.border, borderBottomWidth: index === alerts.length - 1 ? 0 : 1 }}>
                    <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
                      <Feather name={alert.condition === 'above' ? 'trending-up' : 'trending-down'} size={16} color={alert.condition === 'above' ? colors.positive : colors.negative} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }}>{alert.coinName} · {alert.symbol}</Text>
                      <Text numberOfLines={1} style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 4 }}>
                        {alert.condition === 'above' ? t('priceAbove') : t('priceBelow')} {formatMoney(alert.price, currency, locale)}
                        {current ? ` · ${formatMoney(current.price, currency, locale)}` : ''}
                      </Text>
                      <Text style={{ color: alert.triggeredAt ? colors.positive : colors.mutedForeground, fontSize: 10, marginTop: 4 }}>{status}</Text>
                    </View>
                    <Switch
                      accessibilityLabel={status}
                      value={alert.enabled}
                      onValueChange={() => toggleAlert(alert.id)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                    <Pressable onPress={() => removeAlert(alert.id)} accessibilityLabel={t('removeAlert')} hitSlop={8} style={{ padding: 5 }}>
                      <Feather name="trash-2" size={16} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}