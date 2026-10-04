import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useT } from '@/context/AppContext';
import { ErrorState, Header, Screen } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { useLatestNews } from '@/hooks/useLiveData';

export default function NewsScreen() {
  const colors = useColors();
  const t = useT();
  const news = useLatestNews();

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 32 }}>
        <Header
          title={t('allNews')}
          subtitle="CoinDesk · Cointelegraph"
          right={
            <Pressable onPress={() => router.back()} accessibilityLabel={t('home')} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="x" size={21} color={colors.foreground} />
            </Pressable>
          }
        />
        {news.isLoading ? (
          <View style={{ minHeight: 220, justifyContent: 'center', alignItems: 'center', gap: 10 }}>
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>{t('latestNews')}</Text>
          </View>
        ) : news.isError ? (
          <View style={{ marginTop: 20 }}><ErrorState message={t('newsUnavailable')} retry={() => void news.refetch()} /></View>
        ) : (
          <View style={{ marginTop: 15 }}>
            {(news.data ?? []).map((story, index) => {
              const date = Date.parse(story.publishedAt);
              return (
                <Pressable
                  key={story.id}
                  accessibilityRole="link"
                  onPress={() => void Linking.openURL(story.url)}
                  style={({ pressed }) => ({
                    paddingVertical: 17,
                    borderBottomWidth: index === (news.data?.length ?? 0) - 1 ? 0 : 1,
                    borderBottomColor: colors.border,
                    opacity: pressed ? 0.68 : 1,
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
                    <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>{story.source.toUpperCase()}</Text>
                    {Number.isFinite(date) ? (
                      <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>· {new Date(date).toLocaleDateString()}</Text>
                    ) : null}
                  </View>
                  <Text style={{ color: colors.foreground, fontSize: 15, lineHeight: 22, fontWeight: '700' }}>{story.title}</Text>
                  {story.summary ? (
                    <Text numberOfLines={3} style={{ color: colors.mutedForeground, fontSize: 12, lineHeight: 19, marginTop: 7 }}>{story.summary}</Text>
                  ) : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 }}>
                    <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>{t('openStory')}</Text>
                    <Feather name="arrow-up-right" size={13} color={colors.primary} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}