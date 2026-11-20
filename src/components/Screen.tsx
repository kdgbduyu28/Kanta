import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayer } from '../store/player';
import { colors } from '../theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  /** Tab screens leave room for the floating mini player. */
  tab?: boolean;
  scrollProps?: ScrollViewProps;
};

export const MINI_PLAYER_SPACE = 72;

export function useBottomSpace(tab?: boolean) {
  const insets = useSafeAreaInsets();
  const hasMini = usePlayer((s) => s.nowPlaying != null);
  return tab ? (hasMini ? MINI_PLAYER_SPACE : 0) + 16 : insets.bottom + 24;
}

/** Page wrapper: dark background, safe-area top, 16px side gutters. */
export function Screen({ children, scroll = true, tab, scrollProps }: Props) {
  const insets = useSafeAreaInsets();
  const bottom = useBottomSpace(tab);
  if (!scroll) {
    return <View style={[styles.base, { paddingTop: insets.top + 8, paddingBottom: bottom }]}>{children}</View>;
  }
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: bottom }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      {...scrollProps}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },
  content: { paddingHorizontal: 16 },
});
