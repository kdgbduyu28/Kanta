import { router, useLocalSearchParams } from 'expo-router';
import { Link2, Search as SearchIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Artwork } from '../../components/Artwork';
import { Chip } from '../../components/Chip';
import { EmptyState } from '../../components/EmptyState';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SearchField } from '../../components/SearchField';
import { openTrackMenu } from '../../components/TrackMenu';
import { TrackRow } from '../../components/TrackRow';
import { t } from '../../i18n';
import { parseMusicLink } from '../../lib/links';
import { playTracks } from '../../lib/playback';
import type { SearchFilter, SearchResult } from '../../lib/search';
import { sourceName } from '../../lib/sources';
import { useLibrary } from '../../store/library';
import { toast } from '../../store/toast';
import { colors, icon, radius, type } from '../../theme';

const FILTERS: { id: SearchFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'songs', label: 'Songs' },
  { id: 'artists', label: 'Artists' },
  { id: 'albums', label: 'Albums' },
];

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const [q, setQ] = useState(params.q ?? '');
  // A new ?q= (from Home's Recently Played) replaces the query, without an effect.
  const [lastParam, setLastParam] = useState(params.q);
  if (params.q !== lastParam) {
    setLastParam(params.q);
    if (params.q) setQ(params.q);
  }
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [saving, setSaving] = useState(false);
  const { search, mostPlayed, tracks, saveText, version } = useLibrary();
  const link = parseMusicLink(q);

  useEffect(() => {
    let live = true;
    const id = setTimeout(() => {
      void search(q, filter).then((r) => live && setResults(r));
    }, 120);
    return () => {
      live = false;
      clearTimeout(id);
    };
  }, [q, filter, search, version]);

  const add = async () => {
    setSaving(true);
    const tr = await saveText(q);
    setSaving(false);
    if (tr) {
      toast(t('Saved to Kanta: {title}', { title: tr.title }));
      setQ('');
    }
  };

  return (
    <Screen tab>
      <ScreenHeader title={t('Search')} subtitle={t('Find songs, artists, albums and playlists')} />
      <SearchField value={q} onChangeText={setQ} placeholder={t('What do you want to play?')} />
      <View style={styles.chips}>
        {FILTERS.map((f) => (
          <Chip key={f.id} label={t(f.label)} active={filter === f.id} onPress={() => setFilter(f.id)} />
        ))}
      </View>

      {link ? (
        <Pressable style={styles.addLink} onPress={add} disabled={saving}>
          <Link2 size={icon.size} color={colors.primary} strokeWidth={icon.stroke} />
          <View style={{ flex: 1 }}>
            <Text style={type.bodyStrong}>{saving ? t('Saving…') : t('Add to Kanta')}</Text>
            <Text style={type.caption}>{t('{app} {kind} link', { app: sourceName(link.source), kind: t(link.kind) })}</Text>
          </View>
        </Pressable>
      ) : null}

      {!q.trim() ? (
        mostPlayed.length ? (
          <View>
            <Text style={[type.title, styles.sectionTitle]}>{t('Your most played')}</Text>
            {mostPlayed.map((p) => {
              const track = tracks.find((x) => x.id === p.trackId);
              return (
                <TrackRow
                  key={p.id}
                  title={p.title}
                  artist={p.artist}
                  source={p.source}
                  artworkUri={track?.artworkUrl}
                  trailingPlay
                  onPress={() => (track ? void playTracks([track]) : setQ(p.title))}
                />
              );
            })}
          </View>
        ) : (
          <EmptyState
            icon={SearchIcon}
            title={t('Search your Kanta library')}
            body={t('Paste a Spotify, YouTube Music or Apple Music link here to add it.')}
          />
        )
      ) : !results.length && !link ? (
        <EmptyState icon={SearchIcon} title={t('No matches')} body={t('Only songs saved in Kanta are searched.')} />
      ) : (
        <View style={{ marginTop: 8 }}>
          {results.map((r, i) => {
            if (r.kind === 'song') {
              const list = results.flatMap((x) => (x.kind === 'song' ? [x.track] : []));
              return (
                <TrackRow
                  key={r.track.id}
                  title={r.track.title}
                  artist={r.track.artist}
                  source={r.track.source}
                  artworkUri={r.track.artworkUrl}
                  onPress={() => void playTracks(list, list.indexOf(r.track))}
                  onMore={() => openTrackMenu(r.track)}
                />
              );
            }
            const isArtist = r.kind === 'artist';
            return (
              <Pressable
                key={`${r.kind}${i}`}
                style={styles.row}
                onPress={() =>
                  router.push({ pathname: '/library', params: isArtist ? { artist: r.artist } : { album: r.album } })
                }
              >
                <Artwork uri={r.artworkUrl} size={44} radius={isArtist ? 22 : 8} />
                <View style={{ flex: 1 }}>
                  <Text style={type.bodyStrong}>{isArtist ? r.artist : r.album}</Text>
                  <Text style={type.caption}>
                    {isArtist ? t('Artist · {n} songs', { n: r.count }) : t('Album · {artist}', { artist: r.artist })}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 8, flexWrap: 'wrap' },
  sectionTitle: { marginTop: 16, marginBottom: 8 },
  addLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(168,85,247,0.1)',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
});
