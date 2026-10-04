import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useApp, useT } from '@/context/AppContext';
import { useMarkets } from '@/hooks/useLiveData';
import { formatMoney } from '@/components/ui';

export function NotificationMonitor() {
  const { alerts, currency, locale, notificationsEnabled, markAlertTriggered } = useApp();
  const t = useT();
  const active = alerts.some((alert) => alert.enabled);
  const { data } = useMarkets();

  useEffect(() => {
    if (!notificationsEnabled || !active || !data) return;
    for (const alert of alerts) {
      if (!alert.enabled) continue;
      const coin = data.find((item) => item.id === alert.coinId);
      if (!coin) continue;
      const reached = alert.condition === 'above' ? coin.price >= alert.price : coin.price <= alert.price;
      if (!reached) continue;

      const condition = alert.condition === 'above' ? t('priceAbove') : t('priceBelow');
      void Notifications.scheduleNotificationAsync({
        content: {
          title: t('notificationTitle'),
          body: `${alert.coinName} ${condition} ${formatMoney(alert.price, currency, locale)} · ${formatMoney(coin.price, currency, locale)}`,
          data: { coinId: alert.coinId, alertId: alert.id },
          sound: true,
        },
        trigger: null,
      }).then(() => markAlertTriggered(alert.id)).catch(() => undefined);
    }
  }, [active, alerts, currency, data, locale, markAlertTriggered, notificationsEnabled, t]);

  return null;
}