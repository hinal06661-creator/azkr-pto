import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Platform } from 'react-native';

export type Locale = 'az' | 'tr' | 'ru' | 'en';
export type Currency = 'AZN' | 'USD' | 'EUR';
export type ThemeMode = 'system' | 'light' | 'dark';
export type AlertCondition = 'above' | 'below';

export interface PriceAlert {
  id: string;
  coinId: string;
  coinName: string;
  symbol: string;
  price: number;
  condition: AlertCondition;
  enabled: boolean;
  triggeredAt?: number;
}

type TranslationKey = keyof typeof english;

const english = {
  home: 'Home',
  markets: 'Markets',
  alerts: 'Alerts',
  settings: 'Settings',
  search: 'Search coins',
  overview: 'Market overview',
  liveMarket: 'Live market',
  adPlaceholder: 'Advertisement space',
  education: 'Education',
  educationSubtitle: 'Short guides to understanding crypto and reading the market.',
  eduBitcoinTitle: 'Bitcoin basics',
  eduBitcoinBody: 'Bitcoin is a decentralized digital asset. Its price can move sharply, so understand the risks before making a decision.',
  eduBlockchainTitle: 'How blockchain works',
  eduBlockchainBody: 'A blockchain is a shared ledger of transactions. Network participants confirm transactions and help protect its records.',
  eduMarketTitle: 'Reading market data',
  eduMarketBody: 'Market cap is price multiplied by circulating supply; 24-hour volume shows trading activity. A chart shows past prices, not guaranteed future moves.',
  eduSafetyTitle: 'Protect your assets',
  eduSafetyBody: 'Never share your recovery phrase or private keys. Beware guaranteed-profit promises, verify addresses, and start with small test amounts.',
  dailyChange: '24h change',
  volume: '24h volume',
  marketCap: 'Market cap',
  dayRange: '24h range',
  topMovers: 'Biggest moves',
  gainers: 'Top gainers',
  losers: 'Top losers',
  latestNews: 'Latest news',
  allNews: 'All news',
  allCoins: 'All coins',
  favorites: 'Favorites',
  noFavorites: 'Your watchlist is empty',
  noFavoritesHint: 'Tap the star next to a coin to keep it close.',
  noResults: 'No coins match your search.',
  dataUnavailable: 'Market data is temporarily unavailable.',
  newsUnavailable: 'News is temporarily unavailable.',
  tryAgain: 'Try again',
  updated: 'Updated',
  chart: 'Price chart',
  interval1: '1D',
  interval7: '1W',
  interval30: '1M',
  interval90: '3M',
  interval365: '1Y',
  rank: 'Rank',
  notificationTitle: 'Price alert',
  notifications: 'Price notifications',
  notificationsHint: 'Get a local alert when a saved price level is reached while AZ Crypto is open.',
  enableNotifications: 'Enable notifications',
  phoneRequired: 'Enable local notifications from AZ Crypto on your phone.',
  notificationPermission: 'Allow notifications to receive price alerts.',
  createAlert: 'Create price alert',
  chooseCoin: 'Choose a coin',
  targetPrice: 'Target price',
  priceAbove: 'Rises above',
  priceBelow: 'Falls below',
  alertAdded: 'Price alert added',
  alertActive: 'Active',
  alertTriggered: 'Triggered',
  alertPaused: 'Paused',
  noAlerts: 'No price alerts yet',
  noAlertsHint: 'Create an alert to follow a price level.',
  invalidPrice: 'Enter a price greater than zero.',
  removeAlert: 'Remove alert',
  currency: 'Display currency',
  language: 'Language',
  appearance: 'Appearance',
  light: 'Light',
  dark: 'Dark',
  system: 'System',
  dataSources: 'Data sources',
  marketSource: 'Prices and market data',
  newsSource: 'News',
  aboutData: 'Prices refresh every 30 seconds while the app is active. Provider limits may affect update frequency.',
  retrying: 'Refreshing…',
  openStory: 'Read story',
  marketTab: 'Markets',
  watchlist: 'Watchlist',
  addToWatchlist: 'Add to favorites',
  removeFromWatchlist: 'Remove from favorites',
  bitcoin: 'Bitcoin',
  ethereum: 'Ethereum',
  live: 'LIVE',
  noChart: 'Chart data is unavailable.',
} as const;

const copy: Record<Locale, Record<TranslationKey, string>> = {
  en: english,
  az: {
    home: 'Ana səhifə', markets: 'Bazar', alerts: 'Siqnallar', settings: 'Parametrlər',
    search: 'Coin axtar', overview: 'Bazar icmalı', liveMarket: 'Canlı bazar', adPlaceholder: 'Reklam yeri',
    education: 'Təhsil', educationSubtitle: 'Kripto və bazarları anlamaq üçün qısa bələdçilər.',
    eduBitcoinTitle: 'Bitcoin əsasları',
    eduBitcoinBody: 'Bitcoin mərkəzsiz rəqəmsal aktivdir. Qiyməti kəskin dəyişə bilər; qərar verməzdən əvvəl riskləri öyrənin.',
    eduBlockchainTitle: 'Blokçeyn necə işləyir',
    eduBlockchainBody: 'Blokçeyn əməliyyatları paylaşılmış reyestrdə saxlayır. Şəbəkə iştirakçıları əməliyyatları təsdiqləyir və qeydləri qoruyur.',
    eduMarketTitle: 'Bazar məlumatlarını oxumaq',
    eduMarketBody: 'Bazar dəyəri qiymətin dövriyyədəki sayına vurulmasıdır; 24 saatlıq həcm ticarət aktivliyini göstərir. Qrafik keçmişi göstərir, gələcək qiymətə zəmanət vermir.',
    eduSafetyTitle: 'Aktivlərinizi qoruyun',
    eduSafetyBody: 'Bərpa sözlərini və şəxsi açarları heç kimlə paylaşmayın. “Zəmanətli qazanc” vədlərindən çəkinin, ünvanları yoxlayın və əvvəlcə kiçik məbləğlə sınayın.',
    dailyChange: '24 saatlıq dəyişiklik', volume: '24 saatlıq həcm', marketCap: 'Bazar dəyəri',
    dayRange: '24 saatlıq aralıq', topMovers: 'Ən çox dəyişənlər', gainers: 'Ən çox artanlar',
    losers: 'Ən çox azalanlar', latestNews: 'Son xəbərlər', allNews: 'Bütün xəbərlər',
    allCoins: 'Bütün coinlər', favorites: 'Seçilmişlər', noFavorites: 'İzləmə siyahınız boşdur',
    noFavoritesHint: 'Coini siyahıya əlavə etmək üçün ulduza toxunun.',
    noResults: 'Axtarışa uyğun coin tapılmadı.', dataUnavailable: 'Bazar məlumatları müvəqqəti əlçatan deyil.',
    newsUnavailable: 'Xəbərlər müvəqqəti əlçatan deyil.', tryAgain: 'Yenidən cəhd et',
    updated: 'Yeniləndi', chart: 'Qiymət qrafiki', interval1: '1G', interval7: '1H',
    interval30: '1A', interval90: '3A', interval365: '1İ', rank: 'Reytinq',
    notificationTitle: 'Qiymət siqnalı', notifications: 'Qiymət bildirişləri',
    notificationsHint: 'AZ Crypto açıq olarkən qiymət səviyyəsinə çatanda yerli bildiriş alın.',
    enableNotifications: 'Bildirişləri aktiv et', phoneRequired: 'Yerli bildirişləri telefonunuzda AZ Crypto üçün aktiv edin.',
    notificationPermission: 'Qiymət siqnallarını almaq üçün bildirişlərə icazə verin.',
    createAlert: 'Qiymət siqnalı yarat', chooseCoin: 'Coin seçin', targetPrice: 'Hədəf qiymət',
    priceAbove: 'Yuxarı qalxanda', priceBelow: 'Aşağı düşəndə', alertAdded: 'Qiymət siqnalı əlavə edildi',
    alertActive: 'Aktiv', alertTriggered: 'İşə düşdü', alertPaused: 'Dayandırılıb',
    noAlerts: 'Hələ qiymət siqnalı yoxdur', noAlertsHint: 'Qiymət səviyyəsini izləmək üçün siqnal yaradın.',
    invalidPrice: 'Sıfırdan böyük qiymət daxil edin.', removeAlert: 'Siqnalı sil',
    currency: 'Göstərilən valyuta', language: 'Dil', appearance: 'Görünüş',
    light: 'Açıq', dark: 'Tünd', system: 'Sistem', dataSources: 'Məlumat mənbələri',
    marketSource: 'Qiymətlər və bazar məlumatları', newsSource: 'Xəbərlər',
    aboutData: 'Tətbiq aktiv olduqda qiymətlər hər 30 saniyədə yenilənir. Provayder limitləri yenilənmə tezliyinə təsir edə bilər.',
    retrying: 'Yenilənir…', openStory: 'Xəbəri oxu', marketTab: 'Bazar',
    watchlist: 'İzləmə siyahısı', addToWatchlist: 'Seçilmişlərə əlavə et',
    removeFromWatchlist: 'Seçilmişlərdən çıxar', bitcoin: 'Bitcoin', ethereum: 'Ethereum',
    live: 'CANLI', noChart: 'Qrafik məlumatı əlçatan deyil.',
  },
  tr: {
    home: 'Ana sayfa', markets: 'Piyasalar', alerts: 'Alarmlar', settings: 'Ayarlar',
    search: 'Coin ara', overview: 'Piyasa özeti', liveMarket: 'Canlı piyasa', adPlaceholder: 'Reklam alanı',
    education: 'Eğitim', educationSubtitle: 'Kriptoyu ve piyasayı anlamak için kısa rehberler.',
    eduBitcoinTitle: 'Bitcoin temelleri',
    eduBitcoinBody: 'Bitcoin, merkeziyetsiz bir dijital varlıktır. Fiyatı sert değişebilir; karar vermeden önce riskleri öğrenin.',
    eduBlockchainTitle: 'Blokzincir nasıl çalışır?',
    eduBlockchainBody: 'Blokzincir, işlemleri ortak bir kayıt defterinde tutar. Ağ katılımcıları işlemleri doğrular ve kayıtların korunmasına yardımcı olur.',
    eduMarketTitle: 'Piyasa verilerini okumak',
    eduMarketBody: 'Piyasa değeri, fiyat ile dolaşımdaki arzın çarpımıdır; 24 saatlik hacim işlem etkinliğini gösterir. Grafik geçmişi gösterir, gelecekteki fiyatı garanti etmez.',
    eduSafetyTitle: 'Varlıklarınızı koruyun',
    eduSafetyBody: 'Kurtarma kelimelerinizi ve özel anahtarlarınızı kimseyle paylaşmayın. “Garantili kazanç” vaatlerine dikkat edin, adresleri doğrulayın ve önce küçük bir miktarla deneyin.',
    dailyChange: '24 saatlık değişim', volume: '24 saatlik hacim', marketCap: 'Piyasa değeri',
    dayRange: '24 saatlik aralık', topMovers: 'En çok değişenler', gainers: 'En çok yükselenler',
    losers: 'En çok düşenler', latestNews: 'Son haberler', allNews: 'Tüm haberler',
    allCoins: 'Tüm coinler', favorites: 'Favoriler', noFavorites: 'İzleme listeniz boş',
    noFavoritesHint: 'Bir coini listenize eklemek için yıldız simgesine dokunun.',
    noResults: 'Aramanızla eşleşen coin yok.', dataUnavailable: 'Piyasa verileri şu anda kullanılamıyor.',
    newsUnavailable: 'Haberler şu anda kullanılamıyor.', tryAgain: 'Tekrar dene',
    updated: 'Güncellendi', chart: 'Fiyat grafiği', interval1: '1G', interval7: '1H',
    interval30: '1A', interval90: '3A', interval365: '1Y', rank: 'Sıra',
    notificationTitle: 'Fiyat alarmı', notifications: 'Fiyat bildirimleri',
    notificationsHint: 'AZ Crypto açıkken belirlediğiniz fiyat seviyesine ulaşıldığında bildirim alın.',
    enableNotifications: 'Bildirimleri etkinleştir', phoneRequired: 'Yerel bildirimleri telefonunuzda AZ Crypto için etkinleştirin.',
    notificationPermission: 'Fiyat alarmı almak için bildirim izni verin.',
    createAlert: 'Fiyat alarmı oluştur', chooseCoin: 'Coin seçin', targetPrice: 'Hedef fiyat',
    priceAbove: 'Üzerine çıkarsa', priceBelow: 'Altına düşerse', alertAdded: 'Fiyat alarmı eklendi',
    alertActive: 'Aktif', alertTriggered: 'Tetiklendi', alertPaused: 'Duraklatıldı',
    noAlerts: 'Henüz fiyat alarmı yok', noAlertsHint: 'Bir fiyat seviyesini takip etmek için alarm oluşturun.',
    invalidPrice: 'Sıfırdan büyük bir fiyat girin.', removeAlert: 'Alarmı sil',
    currency: 'Görüntüleme para birimi', language: 'Dil', appearance: 'Görünüm',
    light: 'Açık', dark: 'Koyu', system: 'Sistem', dataSources: 'Veri kaynakları',
    marketSource: 'Fiyatlar ve piyasa verileri', newsSource: 'Haberler',
    aboutData: 'Uygulama açıkken fiyatlar 30 saniyede bir yenilenir. Sağlayıcı limitleri güncelleme sıklığını etkileyebilir.',
    retrying: 'Yenileniyor…', openStory: 'Haberi oku', marketTab: 'Piyasalar',
    watchlist: 'İzleme listesi', addToWatchlist: 'Favorilere ekle',
    removeFromWatchlist: 'Favorilerden çıkar', bitcoin: 'Bitcoin', ethereum: 'Ethereum',
    live: 'CANLI', noChart: 'Grafik verisi kullanılamıyor.',
  },
  ru: {
    home: 'Главная', markets: 'Рынки', alerts: 'Оповещения', settings: 'Настройки',
    search: 'Поиск монет', overview: 'Обзор рынка', liveMarket: 'Рынок в реальном времени', adPlaceholder: 'Место для рекламы',
    education: 'Обучение', educationSubtitle: 'Краткие материалы о криптовалютах и чтении рынка.',
    eduBitcoinTitle: 'Основы Bitcoin',
    eduBitcoinBody: 'Bitcoin — децентрализованный цифровой актив. Его цена может резко меняться, поэтому изучите риски перед принятием решения.',
    eduBlockchainTitle: 'Как работает блокчейн',
    eduBlockchainBody: 'Блокчейн — общий реестр транзакций. Участники сети подтверждают операции и помогают защищать записи.',
    eduMarketTitle: 'Как читать данные рынка',
    eduMarketBody: 'Капитализация — цена, умноженная на количество монет в обращении; объём за 24 часа показывает торговую активность. График отражает прошлые цены, но не гарантирует будущие.',
    eduSafetyTitle: 'Защита ваших активов',
    eduSafetyBody: 'Никому не сообщайте фразу восстановления и приватные ключи. Остерегайтесь обещаний гарантированной прибыли, проверяйте адреса и сначала тестируйте небольшую сумму.',
    dailyChange: 'Изменение за 24 ч', volume: 'Объём за 24 ч', marketCap: 'Капитализация',
    dayRange: 'Диапазон за 24 ч', topMovers: 'Лидеры изменений', gainers: 'Лидеры роста',
    losers: 'Лидеры падения', latestNews: 'Последние новости', allNews: 'Все новости',
    allCoins: 'Все монеты', favorites: 'Избранное', noFavorites: 'Список наблюдения пуст',
    noFavoritesHint: 'Нажмите на звёздочку рядом с монетой, чтобы добавить её.',
    noResults: 'Совпадений не найдено.', dataUnavailable: 'Данные рынка временно недоступны.',
    newsUnavailable: 'Новости временно недоступны.', tryAgain: 'Повторить',
    updated: 'Обновлено', chart: 'График цены', interval1: '1Д', interval7: '1Н',
    interval30: '1М', interval90: '3М', interval365: '1Г', rank: 'Ранг',
    notificationTitle: 'Ценовое оповещение', notifications: 'Уведомления о цене',
    notificationsHint: 'Получайте уведомление при достижении цены, пока AZ Crypto открыто.',
    enableNotifications: 'Включить уведомления', phoneRequired: 'Включите локальные уведомления AZ Crypto на телефоне.',
    notificationPermission: 'Разрешите уведомления, чтобы получать ценовые оповещения.',
    createAlert: 'Создать ценовое оповещение', chooseCoin: 'Выберите монету', targetPrice: 'Целевая цена',
    priceAbove: 'Выше', priceBelow: 'Ниже', alertAdded: 'Ценовое оповещение добавлено',
    alertActive: 'Активно', alertTriggered: 'Сработало', alertPaused: 'Приостановлено',
    noAlerts: 'Ценовых оповещений пока нет', noAlertsHint: 'Создайте оповещение для контроля цены.',
    invalidPrice: 'Введите цену больше нуля.', removeAlert: 'Удалить оповещение',
    currency: 'Валюта отображения', language: 'Язык', appearance: 'Оформление',
    light: 'Светлая', dark: 'Тёмная', system: 'Системная', dataSources: 'Источники данных',
    marketSource: 'Цены и данные рынка', newsSource: 'Новости',
    aboutData: 'Цены обновляются каждые 30 секунд, пока приложение открыто. Ограничения провайдера могут повлиять на частоту.',
    retrying: 'Обновление…', openStory: 'Читать новость', marketTab: 'Рынки',
    watchlist: 'Список наблюдения', addToWatchlist: 'Добавить в избранное',
    removeFromWatchlist: 'Убрать из избранного', bitcoin: 'Bitcoin', ethereum: 'Ethereum',
    live: 'LIVE', noChart: 'Данные графика недоступны.',
  },
};

export function translate(locale: Locale, key: TranslationKey): string {
  return copy[locale][key] ?? english[key];
}

const STORAGE_KEY = 'az-crypto-settings-v1';

const initialFavorites = ['bitcoin', 'ethereum', 'solana'];

const AppContext = createContext<{
  locale: Locale;
  currency: Currency;
  theme: ThemeMode;
  favorites: string[];
  alerts: PriceAlert[];
  notificationsEnabled: boolean;
  hydrated: boolean;
  setLocale: (locale: Locale) => void;
  setCurrency: (currency: Currency) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleFavorite: (coinId: string) => void;
  addAlert: (alert: Omit<PriceAlert, 'id' | 'enabled'>) => void;
  toggleAlert: (alertId: string) => void;
  removeAlert: (alertId: string) => void;
  markAlertTriggered: (alertId: string) => void;
  setNotificationsEnabled: (enabled: boolean) => Promise<boolean>;
} | null>(null);

interface StoredState {
  locale: Locale;
  currency: Currency;
  theme: ThemeMode;
  favorites: string[];
  alerts: PriceAlert[];
  notificationsEnabled: boolean;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('az');
  const [currency, setCurrency] = useState<Currency>('AZN');
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [favorites, setFavorites] = useState<string[]>(initialFavorites);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [notificationsEnabled, setNotifications] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!alive) return;
        if (raw) {
          const saved = JSON.parse(raw) as Partial<StoredState>;
          if (saved.locale && saved.locale in copy) setLocale(saved.locale);
          if (saved.currency && ['AZN', 'USD', 'EUR'].includes(saved.currency)) setCurrency(saved.currency);
          if (saved.theme && ['system', 'light', 'dark'].includes(saved.theme)) setTheme(saved.theme);
          if (Array.isArray(saved.favorites)) setFavorites(saved.favorites.filter((id) => typeof id === 'string'));
          if (Array.isArray(saved.alerts)) setAlerts(saved.alerts);
          if (typeof saved.notificationsEnabled === 'boolean') setNotifications(saved.notificationsEnabled);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setHydrated(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const state: StoredState = { locale, currency, theme, favorites, alerts, notificationsEnabled };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [locale, currency, theme, favorites, alerts, notificationsEnabled, hydrated]);

  const toggleFavorite = useCallback((coinId: string) => {
    setFavorites((current) =>
      current.includes(coinId) ? current.filter((id) => id !== coinId) : [...current, coinId],
    );
  }, []);

  const addAlert = useCallback((alert: Omit<PriceAlert, 'id' | 'enabled'>) => {
    setAlerts((current) => [
      { ...alert, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, enabled: true },
      ...current,
    ]);
  }, []);

  const toggleAlert = useCallback((alertId: string) => {
    setAlerts((current) =>
      current.map((alert) =>
        alert.id === alertId
          ? { ...alert, enabled: !alert.enabled, ...(alert.triggeredAt ? { triggeredAt: undefined } : {}) }
          : alert,
      ),
    );
  }, []);

  const removeAlert = useCallback((alertId: string) => {
    setAlerts((current) => current.filter((alert) => alert.id !== alertId));
  }, []);

  const markAlertTriggered = useCallback((alertId: string) => {
    setAlerts((current) =>
      current.map((alert) =>
        alert.id === alertId ? { ...alert, enabled: false, triggeredAt: Date.now() } : alert,
      ),
    );
  }, []);

  const setNotificationsEnabled = useCallback(async (enabled: boolean) => {
    if (!enabled) {
      setNotifications(false);
      return true;
    }
    if (Platform.OS === 'web') return false;
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('price-alerts', {
          name: 'Price alerts',
          importance: Notifications.AndroidImportance.HIGH,
        });
      }
      let permission = await Notifications.getPermissionsAsync();
      if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
      if (!permission.granted) return false;
      setNotifications(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({
      locale,
      currency,
      theme,
      favorites,
      alerts,
      notificationsEnabled,
      hydrated,
      setLocale,
      setCurrency,
      setTheme,
      toggleFavorite,
      addAlert,
      toggleAlert,
      removeAlert,
      markAlertTriggered,
      setNotificationsEnabled,
    }),
    [
      locale,
      currency,
      theme,
      favorites,
      alerts,
      notificationsEnabled,
      hydrated,
      toggleFavorite,
      addAlert,
      toggleAlert,
      removeAlert,
      markAlertTriggered,
      setNotificationsEnabled,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

export function useT() {
  const { locale } = useApp();
  return useCallback((key: TranslationKey) => translate(locale, key), [locale]);
}