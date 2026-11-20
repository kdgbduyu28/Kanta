import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { router, Stack, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Media from '../../modules/kanta-media';
import { Toast } from '../components/Toast';
import { TrackMenuHost } from '../components/TrackMenu';
import { t } from '../i18n';
import { useLibrary } from '../store/library';
import { usePlayer } from '../store/player';
import { toast } from '../store/toast';
import { colors } from '../theme';

void SplashScreen.preventAutoHideAsync();

// The share sheet only exists on Android; keep the package out of the web preview.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const shareIntent: typeof import('expo-share-intent') | null = Platform.OS === 'android' ? require('expo-share-intent') : null;

export default function RootLayout() {
  const content = (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <App />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
  return shareIntent ? <shareIntent.ShareIntentProvider>{content}</shareIntent.ShareIntentProvider> : content;
}

function App() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });
  const ready = useLibrary((s) => s.ready);
  const setupDone = useLibrary((s) => s.prefs.setupDone);
  const lang = useLibrary((s) => s.prefs.lang);
  const segments = useSegments();

  useEffect(() => {
    void useLibrary.getState().init();
    const stop = usePlayer.getState().start();
    const history = Media.addListener('historyChanged', () => void useLibrary.getState().reload());
    return () => {
      stop();
      history.remove();
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded && ready) void SplashScreen.hideAsync();
  }, [fontsLoaded, ready]);

  // First run goes through Welcome → Setup.
  useEffect(() => {
    if (!ready) return;
    const inSetup = segments[0] === 'welcome' || segments[0] === 'setup';
    if (!setupDone && !inSetup) router.replace('/welcome');
  }, [ready, setupDone, segments]);

  if (!fontsLoaded || !ready) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  return (
    // Keyed on the language so every screen re-renders with it (Pabili pattern).
    <View key={lang} style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />
      {shareIntent ? <ShareHandler /> : null}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen name="setup" />
        <Stack.Screen name="now-playing" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="lyrics" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
      <TrackMenuHost />
      <Toast />
    </View>
  );
}

/** Songs shared to Kanta from Spotify / YouTube Music / Apple Music. */
function ShareHandler() {
  const { hasShareIntent, shareIntent: incoming, resetShareIntent } = shareIntent!.useShareIntentContext();
  const saveText = useLibrary((s) => s.saveText);
  useEffect(() => {
    if (!hasShareIntent) return;
    const text = [incoming.text, incoming.webUrl].filter(Boolean).join(' ');
    resetShareIntent();
    void saveText(text).then((tr) =>
      toast(tr ? t('Saved to Kanta: {title}', { title: tr.title }) : t("That link isn't a Spotify, YouTube Music or Apple Music song")),
    );
  }, [hasShareIntent, incoming, resetShareIntent, saveText]);
  return null;
}
