import { Tabs } from 'expo-router';
import { Home, Library, Search, User } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MiniPlayer } from '../../components/MiniPlayer';
import { t } from '../../i18n';
import { colors, fonts, icon } from '../../theme';

export const TAB_BAR_HEIGHT = 64;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: 'rgba(255,255,255,0.06)',
            height: TAB_BAR_HEIGHT + insets.bottom,
            paddingTop: 6,
          },
          tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: t('Home'), tabBarIcon: ({ color }) => <Home size={icon.size} color={color} strokeWidth={icon.stroke} /> }}
        />
        <Tabs.Screen
          name="search"
          options={{ title: t('Search'), tabBarIcon: ({ color }) => <Search size={icon.size} color={color} strokeWidth={icon.stroke} /> }}
        />
        <Tabs.Screen
          name="library"
          options={{ title: t('Library'), tabBarIcon: ({ color }) => <Library size={icon.size} color={color} strokeWidth={icon.stroke} /> }}
        />
        <Tabs.Screen
          name="profile"
          options={{ title: t('Profile'), tabBarIcon: ({ color }) => <User size={icon.size} color={color} strokeWidth={icon.stroke} /> }}
        />
      </Tabs>
      {/* Floats right above the tab bar on every tab; screens leave room with <Screen>. */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: TAB_BAR_HEIGHT + insets.bottom }} pointerEvents="box-none">
        <MiniPlayer />
      </View>
    </View>
  );
}
