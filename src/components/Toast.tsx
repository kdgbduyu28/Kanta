import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '../store/toast';
import { colors, radius, type } from '../theme';

export function Toast() {
  const { message, id } = useToast();
  const insets = useSafeAreaInsets();
  if (!message) return null;
  return (
    <Animated.View
      key={id}
      entering={FadeInDown.duration(180)}
      exiting={FadeOutDown.duration(180)}
      style={[styles.toast, { bottom: insets.bottom + 140 }]}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
    >
      <Text style={type.bodyStrong}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '88%',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
