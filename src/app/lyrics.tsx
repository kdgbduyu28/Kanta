import { router } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Media from '../../modules/kanta-media';
import { t } from '../i18n';
import { activeLineIndex } from '../lib/lrc';
import type { Lyrics } from '../lib/lrclib';
import { positionNow } from '../lib/position';
import { useNow } from '../lib/useNow';
import { useLibrary } from '../store/library';
import { usePlayer } from '../store/player';
import { colors, fonts, icon, type } from '../theme';

export default function LyricsScreen() {
  const insets = useSafeAreaInsets();
  const np = usePlayer((s) => s.nowPlaying);
  const fetchLyrics = useLibrary((s) => s.lyrics);
  const [result, setResult] = useState<{ key: string; lyrics: Lyrics | null } | null>(null);
  const scroll = useRef<ScrollView>(null);
  const offsets = useRef<number[]>([]);
  const [height, setHeight] = useState(0);
  const key = np ? `${np.title}|${np.artist}` : '';

  useEffect(() => {
    if (!np) return;
    let live = true;
    void fetchLyrics({ title: np.title, artist: np.artist, durationMs: np.durationMs }).then((l) => {
      if (live) setResult({ key, lyrics: l });
    });
    return () => {
      live = false;
    };
    // Only refetch when the song changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const now = useNow(np?.state === 'playing', 250);
  // Loading until the result for this song arrives.
  const loading = result?.key !== key;
  const lyrics = loading ? null : result!.lyrics;
  const active = lyrics?.synced && np ? activeLineIndex(lyrics.lines, positionNow(np, now)) : -1;

  // Keep the line being sung in the middle.
  useEffect(() => {
    if (active < 0) return;
    const y = offsets.current[active];
    if (y != null) scroll.current?.scrollTo({ y: Math.max(0, y - height / 2 + 20), animated: true });
  }, [active, height]);

  return (
    <View style={[styles.page, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel={t('Close')}>
          <ChevronDown size={26} color={colors.text} strokeWidth={icon.stroke} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={type.bodyStrong} numberOfLines={1}>
            {np?.title ?? ''}
          </Text>
          <Text style={type.caption} numberOfLines={1}>
            {np?.artist ?? ''}
          </Text>
        </View>
        <View style={{ width: 26 }} />
      </View>

      {!np ? (
        <Text style={[type.body, styles.msg]}>{t('Nothing is playing')}</Text>
      ) : loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 48 }} />
      ) : !lyrics ? (
        <Text style={[type.body, styles.msg]}>{t('No lyrics found')}</Text>
      ) : (
        <ScrollView
          ref={scroll}
          onLayout={(e: LayoutChangeEvent) => setHeight(e.nativeEvent.layout.height)}
          contentContainerStyle={{ paddingVertical: 24, paddingBottom: insets.bottom + 120 }}
          showsVerticalScrollIndicator={false}
        >
          {lyrics.synced
            ? lyrics.lines.map((l, i) => (
                <Pressable
                  key={i}
                  onLayout={(e) => (offsets.current[i] = e.nativeEvent.layout.y)}
                  onPress={() => Media.seekTo(l.timeMs)}
                >
                  <Text style={[styles.line, i === active ? styles.lineActive : i < active ? styles.linePast : null]}>
                    {l.line || '♪'}
                  </Text>
                </Pressable>
              ))
            : lyrics.lines.map((l, i) => (
                <Text key={i} style={styles.line}>
                  {l}
                </Text>
              ))}
          <Text style={[type.caption, { marginTop: 24 }]}>{t('Lyrics from LRCLIB')}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#1A0F2E', paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  msg: { textAlign: 'center', marginTop: 48, color: colors.textMuted },
  line: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 32, color: 'rgba(248,246,252,0.45)', marginVertical: 6 },
  lineActive: { color: colors.text },
  linePast: { color: 'rgba(248,246,252,0.7)' },
});
