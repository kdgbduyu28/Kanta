import { Search, X } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, icon, radius } from '../theme';

type Props = {
  value?: string;
  placeholder: string;
  onChangeText?: (s: string) => void;
  /** When set, the field is a button (Home's search opens the Search tab). */
  onPress?: () => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
};

export function SearchField({ value, placeholder, onChangeText, onPress, onSubmit, autoFocus }: Props) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.box} accessibilityRole="search">
        <Search size={18} color={colors.textMuted} strokeWidth={icon.stroke} />
        <Text style={[styles.input, { color: colors.textMuted }]} numberOfLines={1}>
          {placeholder}
        </Text>
      </Pressable>
    );
  }
  return (
    <View style={styles.box}>
      <Search size={18} color={colors.textMuted} strokeWidth={icon.stroke} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoFocus={autoFocus}
        autoCorrect={false}
        returnKeyType="search"
      />
      {value ? (
        <Pressable onPress={() => onChangeText?.('')} hitSlop={10} accessibilityLabel="Clear">
          <X size={18} color={colors.textMuted} strokeWidth={icon.stroke} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.text, paddingVertical: 0 },
});
