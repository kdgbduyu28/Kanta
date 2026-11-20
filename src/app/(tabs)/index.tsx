import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Play, Share2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { Source } from '../../../modules/kanta-media';
import { Artwork } from '../../components/Artwork';
import { EmptyState } from '../../components/EmptyState';
import { Screen } from '../../components/Screen';
import { SearchField } from '../../components/SearchField';
import { SourceBadge } from '../../components/SourceBadge';
import type { Play as PlayRow } from '../../db/history';
import { t } from '../../i18n';
import { greetingKey, playTracks } from '../../lib/playback';
import { homeSections } from '../../lib/sections';
import { sourceName } from '../../lib/sources';
import { useLibrary } from '../../store/library';
import { usePlayer } from '../../store/player';
import { colors, fonts, gradient, radius, type } from '../../theme';

export default function Home() {
  const { recent, sources, tracks, prefs } = useLibrary();
  const access = usePlayer((s) => s.access);
  const sections = homeSections({
    recent,
    sourcesWithSongs: sources.filter((s) => s !== 'local'),
    hasLocalFiles: sources.includes('local'),
  });

  const openPlay = (p: PlayRow) => {
    const track = tracks.find((x) => x.id === p.trackId);
    if (track) void playTracks([track]);
    else router.push({ pathname: '/search', params: { q: p.title } });
  };

  return (
    <Screen tab>
      <Text style={type.heading}>{t(greetingKey(new Date().getHours()))}</Text>
      {prefs.name ? <Text style={[type.caption, { fontSize: 13, marginTop: 2 }]}>{prefs.name} 👋</Text> : null}

      <View style={{ marginTop: 16 }}>
        <SearchField placeholder={t('Search songs, artists, playlists...')} onPress={() => router.push('/search')} />
      </View>

      {!access ? (
        <Pressable style={styles.banner} onPress={() => router.push('/sources')}>
          <Text style={[type.bodyStrong, { flex: 1 }]}>{t('Let Kanta see what is playing')}</Text>
          <Text style={[type.caption, { color: colors.primary }]}>{t('Turn on')}</Text>
        </Pressable>
      ) : null}

      <Animated.View entering={FadeInDown.duration(300)}>
        <LinearGradient colors={gradient.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Text style={styles.kicker}>{t('GOOD VIBES ONLY')}</Text>
          <Text style={styles.heroTitle}>{t('Find your\nnext favorite.')}</Text>
          <Pressable style={styles.heroBtn} onPress={() => router.push('/library')}>
            <Play size={12} color={colors.text} fill={colors.text} />
            <Text style={styles.heroBtnText}>{t('Explore music')}</Text>
          </Pressable>
        </LinearGradient>
      </Animated.View>

      {sections.map((sec) => {
        if (sec.kind === 'getStarted') {
          return (
            <EmptyState
              key="start"
              icon={Share2}
              title={t('Start your Kanta library')}
              body={t('Share a song from Spotify, YouTube Music or Apple Music to Kanta, or paste a link in Search.')}
              action={{ label: t('Sources'), onPress: () => router.push('/sources') }}
            />
          );
        }
        if (sec.kind === 'recent') {
          return (
            <View key="recent" style={styles.section}>
              <View style={styles.sectionHead}>
                <Text style={type.title}>{t('Recently Played')}</Text>
                <Pressable onPress={() => router.push('/library')}>
                  <Text style={[type.caption, { fontSize: 12 }]}>{t('See all')}</Text>
                </Pressable>
              </View>
              <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {sec.plays.map((p, i) => {
                  const art = tracks.find((x) => x.id === p.trackId)?.artworkUrl;
                  return (
                    <Animated.View key={p.id} entering={FadeInDown.delay(i * 30).duration(250)}>
                      <Pressable style={styles.tile} onPress={() => openPlay(p)}>
                        <Artwork uri={art} size={100} radius={radius.sm} />
                        <Text style={[type.bodyStrong, { fontSize: 13 }]} numberOfLines={1}>
                          {p.title}
                        </Text>
                        <View style={styles.tileSub}>
                          <SourceBadge source={p.source} />
                          <Text style={type.caption} numberOfLines={1}>
                            {p.artist}
                          </Text>
                        </View>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </Animated.ScrollView>
            </View>
          );
        }
        return (
          <View key="browse" style={styles.section}>
            <Text style={[type.title, { marginBottom: 12 }]}>{t('Browse by source')}</Text>
            <View style={styles.grid}>
              {sec.sources.map((s) => (
                <SourceCard key={s} source={s} />
              ))}
            </View>
          </View>
        );
      })}
    </Screen>
  );
}

function SourceCard({ source }: { source: Source }) {
  const bg: Record<Source, string> = { spotify: '#0F5B33', ytmusic: '#7A1020', applemusic: '#7A1530', local: '#4C1D95' };
  return (
    <Pressable
      style={[styles.sourceCard, { backgroundColor: bg[source] }]}
      onPress={() => router.push({ pathname: '/library', params: { source } })}
    >
      <SourceBadge source={source} size="md" />
      <Text style={type.bodyStrong}>{source === 'local' ? t('On this phone') : sourceName(source)}</Text>
      <Text style={type.caption}>{t('Browse')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 14,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(168,85,247,0.12)',
    borderColor: colors.border,
    borderWidth: 1,
  },
  hero: { marginTop: 16, borderRadius: radius.md, padding: 20, minHeight: 140, justifyContent: 'center' },
  kicker: { fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 1, color: colors.textMuted },
  heroTitle: { ...type.heading, fontFamily: fonts.bold, marginTop: 6 },
  heroBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  heroBtnText: { fontFamily: fonts.medium, fontSize: 12, color: colors.text },
  section: { marginTop: 24 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tile: { width: 100, gap: 4 },
  tileSub: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  sourceCard: { flexBasis: '47%', flexGrow: 1, borderRadius: radius.sm, padding: 14, gap: 6, alignItems: 'center' },
});
