import { Feather, Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Currency, Locale, useApp, useT } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import type { MarketCoin } from '@/lib/market';

export function Screen({ children }: { children: ReactNode }) {
  const colors = useColors();
  const t = useT();
  return (
    <SafeAreaView
      edges={Platform.OS === 'web' ? [] : ['top']}
      style={[
        styles.screen,
        { backgroundColor: colors.background },
        Platform.OS === 'web' ? { paddingTop: 67, paddingBottom: 34 } : null,
      ]}
    >
      <View
        accessibilityLabel={t('adPlaceholder')}
        style={[
          styles.adSlot,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Feather name="tag" size={14} color={colors.mutedForeground} />
        <Text style={[styles.adSlotText, { color: colors.mutedForeground }]}>
          {t('adPlaceholder')}
        </Text>
      </View>
      {children}
    </SafeAreaView>
  );
}

export function IconButton({
  name,
  onPress,
  label,
  color,
}: {
  name: keyof typeof Feather.glyphMap;
  onPress: () => void;
  label: string;
  color?: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed ? { opacity: 0.55 } : null]}
      hitSlop={8}
    >
      <Feather name={name} size={20} color={color ?? colors.foreground} />
    </Pressable>
  );
}

export function Header({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionTitle}>
      <Text style={[styles.sectionHeading, { color: colors.foreground }]}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button">
          <Text style={[styles.actionText, { color: colors.primary }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Pill({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  const colors = useColors();
  const Component = onPress ? Pressable : View;
  return (
    <Component
      onPress={onPress}
      style={[
        styles.pill,
        {
          backgroundColor: active ? colors.accent : colors.card,
          borderColor: active ? colors.accent : colors.border,
        },
      ]}
    >
      <Text style={{ fontSize: 12, color: active ? colors.accentForeground : colors.mutedForeground, fontWeight: '600' }}>
        {label}
      </Text>
    </Component>
  );
}

export function LoadingState({ label }: { label: string }) {
  const colors = useColors();
  return (
    <View style={styles.stateBox}>
      <ActivityIndicator color={colors.primary} />
      <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{label}</Text>
    </View>
  );
}

export function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  const colors = useColors();
  const t = useT();
  return (
    <View style={[styles.errorBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name="cloud-off" size={20} color={colors.negative} />
      <Text style={[styles.errorText, { color: colors.mutedForeground }]}>{message}</Text>
      <Pressable onPress={retry} style={[styles.retryButton, { backgroundColor: colors.accent }]}>
        <Text style={{ color: colors.accentForeground, fontWeight: '700', fontSize: 13 }}>{t('tryAgain')}</Text>
      </Pressable>
    </View>
  );
}

export function formatMoney(value: number, currency: Currency, locale: Locale, compact = false): string {
  if (!Number.isFinite(value)) return '—';
  const localeTag = { az: 'az-AZ', tr: 'tr-TR', ru: 'ru-RU', en: 'en-US' }[locale];
  const decimals = Math.abs(value) >= 1000 ? 0 : Math.abs(value) >= 1 ? 2 : 5;
  try {
    return new Intl.NumberFormat(localeTag, {
      style: 'currency',
      currency,
      notation: compact ? 'compact' : 'standard',
      maximumFractionDigits: compact ? 1 : decimals,
    }).format(value);
  } catch {
    return `${currency} ${new Intl.NumberFormat(localeTag, { maximumFractionDigits: decimals }).format(value)}`;
  }
}

export function formatPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function PriceChange({ value, large = false }: { value: number; large?: boolean }) {
  const colors = useColors();
  const isPositive = value >= 0;
  return (
    <View style={styles.changeWrap}>
      <Ionicons name={isPositive ? 'arrow-up' : 'arrow-down'} size={large ? 14 : 12} color={isPositive ? colors.positive : colors.negative} />
      <Text style={{ color: isPositive ? colors.positive : colors.negative, fontSize: large ? 14 : 12, fontWeight: '700' }}>
        {formatPercent(value)}
      </Text>
    </View>
  );
}

export function CoinAvatar({ coin, size = 40 }: { coin: MarketCoin; size?: number }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.secondary },
      ]}
    >
      {coin.image ? (
        <Image source={{ uri: coin.image }} style={{ width: size - 2, height: size - 2, borderRadius: size / 2 }} />
      ) : (
        <Text style={{ color: colors.primary, fontWeight: '800' }}>{coin.symbol.slice(0, 1)}</Text>
      )}
    </View>
  );
}

export function MiniSparkline({ values, positive, width = 58, height = 26 }: { values: number[]; positive: boolean; width?: number; height?: number }) {
  const colors = useColors();
  if (values.length < 2) return <View style={{ width, height }} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  const points = values.filter(Number.isFinite);
  const path = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - 2 - ((value - min) / spread) * (height - 4);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <Svg width={width} height={height}>
      <Path d={path} fill="none" stroke={positive ? colors.positive : colors.negative} strokeWidth={1.8} />
    </Svg>
  );
}

export function PriceChart({
  values,
  height = 170,
}: {
  values: number[];
  height?: number;
}) {
  const colors = useColors();
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.max(240, Math.min(720, screenWidth - 44));
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  const padding = 8;
  const xSpan = width - padding * 2;
  const ySpan = height - padding * 2;
  const coords = values.map((value, index) => ({
    x: padding + (index / (values.length - 1)) * xSpan,
    y: padding + (1 - (value - min) / spread) * ySpan,
  }));
  const line = coords.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  const first = coords[0]!;
  const last = coords[coords.length - 1]!;
  const fill = `${line} L${last.x.toFixed(1)},${(height - padding).toFixed(1)} L${first.x.toFixed(1)},${(height - padding).toFixed(1)} Z`;
  const rising = values[values.length - 1]! >= values[0]!;
  const color = rising ? colors.positive : colors.negative;
  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <Path d={`M0,${height / 2} L${width},${height / 2}`} stroke={colors.border} strokeWidth={1} strokeDasharray="4 5" />
      <Path d={fill} fill={color} opacity={0.1} />
      <Path d={line} fill="none" stroke={color} strokeWidth={2.7} strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx={last.x} cy={last.y} r={4} fill={color} />
    </Svg>
  );
}

export function CoinRow({
  coin,
  favorite,
  onPress,
  onFavorite,
}: {
  coin: MarketCoin;
  favorite: boolean;
  onPress: () => void;
  onFavorite?: () => void;
}) {
  const colors = useColors();
  const { currency, locale } = useApp();
  const t = useT();
  return (
    <View style={[styles.coinRow, { borderBottomColor: colors.border }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [styles.coinRowContent, { opacity: pressed ? 0.72 : 1 }]}
      >
        <CoinAvatar coin={coin} />
        <View style={styles.coinIdentity}>
          <Text numberOfLines={1} style={[styles.coinName, { color: colors.foreground }]}>{coin.name}</Text>
          <Text style={[styles.coinSymbol, { color: colors.mutedForeground }]}>{coin.symbol} · #{coin.rank}</Text>
        </View>
        <View style={styles.coinPerformance}>
          <MiniSparkline values={coin.sparkline} positive={coin.change24h >= 0} />
          <Text style={[styles.coinPrice, { color: colors.foreground }]}>{formatMoney(coin.price, currency, locale)}</Text>
          <PriceChange value={coin.change24h} />
        </View>
      </Pressable>
      {onFavorite ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={favorite ? t('removeFromWatchlist') : t('addToWatchlist')}
          onPress={onFavorite}
          hitSlop={8}
          style={styles.favoriteButton}
        >
          <Ionicons name={favorite ? 'star' : 'star-outline'} size={18} color={favorite ? colors.primary : colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  const colors = useColors();
  return (
    <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
        <Feather name="inbox" size={21} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>{detail}</Text>
    </View>
  );
}

export function ContentScroll({ children, onRefresh }: { children: ReactNode; onRefresh?: () => void }) {
  const colors = useColors();
  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'web' ? 96 : 30 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: colors.background }}
    >
      {children}
    </ScrollView>
  );
}

export function localeLabel(locale: Locale) {
  return { az: 'Azərbaycan dili', tr: 'Türkçe', ru: 'Русский', en: 'English' }[locale];
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  adSlot: {
    minHeight: 46,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 6,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
  },
  adSlotText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  content: { paddingHorizontal: 20, paddingTop: 12, gap: 22 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 2 },
  pageTitle: { fontSize: 27, fontWeight: '800', letterSpacing: -0.7 },
  subtitle: { fontSize: 13, marginTop: 5, lineHeight: 19 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionHeading: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  actionText: { fontSize: 13, fontWeight: '700' },
  iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  pill: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  stateBox: { minHeight: 150, gap: 12, alignItems: 'center', justifyContent: 'center' },
  errorBox: { alignItems: 'center', gap: 10, borderRadius: 18, borderWidth: 1, padding: 20 },
  errorText: { textAlign: 'center', lineHeight: 20, fontSize: 13 },
  retryButton: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginTop: 2 },
  changeWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  avatar: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  coinRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  coinRowContent: { flex: 1, minWidth: 0, minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 11 },
  coinIdentity: { flex: 1, minWidth: 0, justifyContent: 'center', gap: 4 },
  coinName: { fontSize: 14, fontWeight: '700' },
  coinSymbol: { fontSize: 11, letterSpacing: 0.2 },
  coinPerformance: { minWidth: 95, alignItems: 'flex-end', gap: 3 },
  coinPrice: { fontSize: 13, fontWeight: '700' },
  favoriteButton: { width: 30, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', gap: 8, paddingVertical: 28, paddingHorizontal: 20, borderWidth: 1, borderRadius: 20 },
  emptyIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  emptyHint: { fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 260 },
});