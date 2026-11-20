import { Switch } from 'react-native';
import { colors } from '../theme';

type Props = { value: boolean; onChange: (v: boolean) => void; label?: string };

export function Toggle({ value, onChange, label }: Props) {
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      accessibilityLabel={label}
      trackColor={{ false: colors.surfaceRaised, true: colors.primary }}
      thumbColor={colors.text}
      ios_backgroundColor={colors.surfaceRaised}
    />
  );
}
