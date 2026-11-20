import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Music } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, gradient } from '../theme';

type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

type Props = {
  uri?: string | null;
  size: number;
  radius?: number;
  fallbackIcon?: IconType;
  /** Up to four covers make a 2×2 playlist mosaic. */
  mosaic?: string[];
  colors?: [string, string];
};

/** Cover art; without one it is the PDF's purple gradient tile with a note icon. */
export function Artwork({ uri, size, radius = 12, fallbackIcon: Icon = Music, mosaic, colors: tint }: Props) {
  const box = { width: size, height: size, borderRadius: radius };
  if (mosaic && mosaic.length >= 4) {
    const half = size / 2;
    return (
      <View style={[box, styles.mosaic]}>
        {mosaic.slice(0, 4).map((m, i) => (
          <Image key={i} source={{ uri: m }} style={{ width: half, height: half }} contentFit="cover" />
        ))}
      </View>
    );
  }
  const cover = uri ?? mosaic?.[0];
  if (cover) return <Image source={{ uri: cover }} style={box} contentFit="cover" transition={150} />;
  return (
    <LinearGradient colors={tint ?? gradient.art} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[box, styles.center]}>
      <Icon size={size * 0.38} color={colors.text} strokeWidth={1.6} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  mosaic: { flexDirection: 'row', flexWrap: 'wrap', overflow: 'hidden' },
});
