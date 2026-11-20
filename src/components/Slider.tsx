import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-worklets';
import { colors } from '../theme';

type Props = {
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Called while dragging. */
  onChange?: (v: number) => void;
  /** Called when the finger lifts (seek happens here). */
  onCommit?: (v: number) => void;
  label?: string;
  /** Fill from the middle (balance) instead of from the left. */
  centered?: boolean;
};

export function snap(v: number, min: number, max: number, step?: number) {
  const c = Math.min(max, Math.max(min, v));
  return step ? Math.round((c - min) / step) * step + min : c;
}

/** Horizontal slider: purple fill, white thumb (progress bar, crossfade, balance). */
export function Slider({ value, min, max, step, onChange, onCommit, label, centered }: Props) {
  const [width, setWidth] = useState(0);
  const [drag, setDrag] = useState<number | null>(null);
  const shown = drag ?? value;
  const frac = max > min ? (Math.min(max, Math.max(min, shown)) - min) / (max - min) : 0;

  const fromX = (x: number) => snap(min + (x / Math.max(1, width)) * (max - min), min, max, step);
  const move = (x: number) => {
    const v = fromX(x);
    setDrag(v);
    onChange?.(v);
  };
  const end = (x: number) => {
    const v = fromX(x);
    setDrag(null);
    onCommit?.(v);
  };

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => runOnJS(move)(e.x))
    .onUpdate((e) => runOnJS(move)(e.x))
    .onFinalize((e) => runOnJS(end)(e.x));

  const fillLeft = centered ? Math.min(frac, 0.5) : 0;
  const fillWidth = centered ? Math.abs(frac - 0.5) : frac;

  return (
    <GestureDetector gesture={pan}>
      <View
        style={styles.hit}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: Math.round(shown) }}
      >
        <View style={styles.track}>
          <View style={[styles.fill, { left: `${fillLeft * 100}%`, width: `${fillWidth * 100}%` }]} />
        </View>
        <View style={[styles.thumb, { left: frac * width - 7 }]} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  hit: { height: 28, justifyContent: 'center' },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.surfaceRaised, overflow: 'hidden' },
  fill: { position: 'absolute', top: 0, bottom: 0, backgroundColor: colors.primary },
  thumb: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: colors.text },
});
