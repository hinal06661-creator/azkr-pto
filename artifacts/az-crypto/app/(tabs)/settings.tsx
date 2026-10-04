import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Alert, ScrollView, Switch, Text, View } from 'react-native';
import { useApp, useT, type Currency, type Locale, type ThemeMode } from '@/context/AppContext';
import { localeLabel, Pill, Screen } from '@/components/ui';
import { useColors } from '@/hooks/useColors';

function PreferenceGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase', paddingHorizontal: 3 }}>{title}</Text>
      <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 19, padding: 15, gap: 14 }}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const t = useT();
  const {
    locale,
    currency,
    theme,
    notificationsEnabled,
    setLocale,
    setCurrency,
    setTheme,
    setNotificationsEnabled,
  } = useApp();

  const onNotificationChange = async (enabled: boolean) => {
    if (enabled) {
      const success = await setNotificationsEnabled(true);
      if (!success) {
        Alert.alert(t('notifications'), t('phoneRequired'));
      }
    } else {
      await setNotificationsEnabled(false);
    }
    void Haptics.selectionAsync();
  };

  const choiceRow = <T extends string>(
    options: { value: T; label: string }[],
    selected: T,
    onChange: (value: T) => void,
  ) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((option) => (
        <Pill key={option.value} label={option.label} active={selected === option.value} onPress={() => onChange(option.value)} />
      ))}
    </View>
  );

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 38, gap: 22 }}>
        <View style={{ marginBottom: 1 }}>
          <Text style={{ color: colors.foreground, fontSize: 27, fontWeight: '800', letterSpacing: -0.7 }}>{t('settings')}</Text>
          <Text style={{ color: colors.mutedForeground, fontSize: 13, marginTop: 5 }}>AZ Crypto</Text>
        </View>

        <PreferenceGroup title={t('currency')}>
          {choiceRow<Currency>(
            [
              { value: 'AZN', label: '₼ AZN' },
              { value: 'USD', label: '$ USD' },
              { value: 'EUR', label: '€ EUR' },
            ],
            currency,
            setCurrency,
          )}
        </PreferenceGroup>

        <PreferenceGroup title={t('language')}>
          {choiceRow<Locale>(
            (['az', 'tr', 'ru', 'en'] as Locale[]).map((value) => ({ value, label: localeLabel(value) })),
            locale,
            setLocale,
          )}
        </PreferenceGroup>

        <PreferenceGroup title={t('appearance')}>
          {choiceRow<ThemeMode>(
            [
              { value: 'system', label: t('system') },
              { value: 'light', label: t('light') },
              { value: 'dark', label: t('dark') },
            ],
            theme,
            setTheme,
          )}
        </PreferenceGroup>

        <PreferenceGroup title={t('notifications')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 39, height: 39, borderRadius: 13, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="bell" size={18} color={colors.accentForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '700' }}>{t('enableNotifications')}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 4 }}>{t('notificationsHint')}</Text>
            </View>
            <Switch
              accessibilityLabel={t('enableNotifications')}
              value={notificationsEnabled}
              onValueChange={(enabled) => void onNotificationChange(enabled)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          {!notificationsEnabled ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 17, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }}>
              {t('phoneRequired')}
            </Text>
          ) : null}
        </PreferenceGroup>

        <PreferenceGroup title={t('dataSources')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Feather name="bar-chart-2" size={17} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }}>{t('marketSource')}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 4 }}>CoinGecko · Open Exchange Rates</Text>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Feather name="book-open" size={17} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700' }}>{t('newsSource')}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 4 }}>CoinDesk · Cointelegraph</Text>
            </View>
          </View>
        </PreferenceGroup>

        <Text style={{ color: colors.mutedForeground, fontSize: 11, lineHeight: 18, paddingHorizontal: 3 }}>{t('aboutData')}</Text>
      </ScrollView>
    </Screen>
  );
}