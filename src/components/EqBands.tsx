import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-worklets';
import { EQ_LABELS } from '../lib/eqPresets';
import { colors, fonts, radius } from '../theme';

type Props = { gainsDb: number[]; onChange: (i: number, db: number) => void; disabled?: boolean };

const MAX = 12;

/** The PDF's 9 vertical EQ sliders, ±12 dB, with a 0 dB line. */
export function EqBands({ gainsDb, onChange, disabled }: Props) {
  return (
    <View style={[styles.card, disabled && { opacity: 0.4 }]} pointerEvents={disabled ? 'none' : 'auto'}>
      <View style={styles.scale}>
        <Text style={styles.scaleText}>+12 dB</Text>
        <Text style={styles.scaleText}>0 dB</Text>
        <Text style={styles.scaleText}>-12 dB</Text>
      </View>
      <View style={styles.bands}>
        {gainsDb.map((g, i) => (
          <Band key={i} db={g} label={EQ_LABELS[i] ?? ''} onChange={(db) => onChange(i, db)} />
        ))}
      </View>
    </View>
  );
}

function Band({ db, label, onChange }: { db: number; label: string; onChange: (db: number) => void }) {
  const [h, setH] = useState(0);
  const fromY = (y: number) => {
    const frac = 1 - Math.min(1, Math.max(0, y / Math.max(1, h)));
    return Math.round((frac * 2 - 1) * MAX * 2) / 2; // 0.5 dB steps
  };
  const set = (y: number) => onChange(fromY(y));
  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => runOnJS(set)(e.y))
    .onUpdate((e) => runOnJS(set)(e.y));
  const top = ((MAX - db) / (2 * MAX)) * h;
  const mid = h / 2;
  return (
    <View style={styles.band}>
      <GestureDetector gesture={pan}>
        <View
          style={styles.trackHit}
          onLayout={(e: LayoutChangeEvent) => setH(e.nativeEvent.layout.height)}
          accessibilityRole="adjustable"
          accessibilityLabel={`${label} Hz`}
          accessibilityValue={{ min: -MAX, max: MAX, now: db }}
        >
          <View style={styles.track} />
          <View style={[styles.fill, { top: Math.min(top, mid), height: Math.abs(mid - top) }]} />
          <View style={[styles.thumb, { top: top - 8 }]} />
        </View>
      </GestureDetector>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 12, flexDirection: 'row', gap: 6 },
  scale: { justifyContent: 'space-between', paddingBottom: 22 },
  scaleText: { fontFamily: fonts.regular, fontSize: 9, color: colors.textMuted },
  bands: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  band: { alignItems: 'center', gap: 6 },
  trackHit: { width: 24, height: 170, alignItems: 'center' },
  track: { position: 'absolute', top: 0, bottom: 0, width: 4, borderRadius: 2, backgroundColor: colors.surfaceRaised },
  fill: { position: 'absolute', width: 4, borderRadius: 2, backgroundColor: colors.primary },
  thumb: { position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.text },
  label: { fontFamily: fonts.regular, fontSize: 9, color: colors.textMuted },
});
