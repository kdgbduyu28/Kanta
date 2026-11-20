import { Music2, Smartphone } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import type { Source } from '../../modules/kanta-media/src/types';
import { sourceName } from '../lib/sources';
import { colors, fonts } from '../theme';

type Props = { source: Source; size?: 'sm' | 'md'; showName?: boolean };

const letter: Record<Source, string> = { spotify: 'S', ytmusic: '▶', applemusic: '♪', local: '' };

/** Small coloured mark that tells which app a song lives in. */
export function SourceBadge({ source, size = 'sm', showName }: Props) {
  const d = size === 'sm' ? 16 : 28;
  return (
    <View style={styles.row} accessibilityLabel={sourceName(source)}>
      <View style={[styles.dot, { width: d, height: d, borderRadius: d / 2, backgroundColor: colors.source[source] }]}>
        {source === 'local' ? (
          <Smartphone size={d * 0.6} color={colors.text} strokeWidth={2} />
        ) : source === 'applemusic' ? (
          <Music2 size={d * 0.6} color={colors.text} strokeWidth={2} />
        ) : (
          <Text style={[styles.letter, { fontSize: d * 0.55 }]}>{letter[source]}</Text>
        )}
      </View>
      {showName ? <Text style={styles.name}>{sourceName(source)}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { alignItems: 'center', justifyContent: 'center' },
  letter: { color: colors.text, fontFamily: fonts.bold },
  name: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
});
