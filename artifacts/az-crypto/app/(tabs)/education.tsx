import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { ContentScroll, Header, Screen } from '@/components/ui';
import { useT } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

export default function EducationScreen() {
  const colors = useColors();
  const t = useT();
  const lessons = [
    { icon: 'book-open' as const, title: t('eduBitcoinTitle'), body: t('eduBitcoinBody') },
    { icon: 'layers' as const, title: t('eduBlockchainTitle'), body: t('eduBlockchainBody') },
    { icon: 'bar-chart-2' as const, title: t('eduMarketTitle'), body: t('eduMarketBody') },
    { icon: 'shield' as const, title: t('eduSafetyTitle'), body: t('eduSafetyBody') },
  ];

  return (
    <Screen>
      <ContentScroll>
        <Header title={t('education')} subtitle={t('educationSubtitle')} />
        <View style={{ gap: 12 }}>
          {lessons.map((lesson, index) => (
            <View
              key={lesson.title}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 13,
                padding: 16,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.accent,
                }}
              >
                <Feather name={lesson.icon} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 10, fontWeight: '700', letterSpacing: 0.7 }}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
                <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '700' }}>
                  {lesson.title}
                </Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 19 }}>
                  {lesson.body}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ContentScroll>
    </Screen>
  );
}