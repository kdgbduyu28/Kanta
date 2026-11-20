import { Check, Eye, Layers, Smartphone } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Media from '../../modules/kanta-media';
import type { StreamingSource } from '../../modules/kanta-media';
import { t } from '../i18n';
import { requestAudioPermission } from '../lib/permissions';
import { playStoreUrl, sourceCardState, sourceName, STREAMING } from '../lib/sources';
import { useLibrary } from '../store/library';
import { usePlayer } from '../store/player';
import { toast } from '../store/toast';
import { colors, fonts, icon, radius, type } from '../theme';
import { SourceBadge } from './SourceBadge';

const ABOUT: Record<StreamingSource, string> = {
  spotify: 'Kanta controls the Spotify app on this phone. Premium is needed to pick exact songs.',
  ytmusic: 'Kanta controls the YouTube Music app on this phone.',
  applemusic: 'Kanta controls the Apple Music app on this phone.',
};

/** The PDF's "Connect Sources" cards, honest about what each one does. */
export function SourcesList({ compact }: { compact?: boolean }) {
  const { access, overlay, installed, spotifyConnected, audioPermission, refreshStatus } = usePlayer();
  const { prefs, setPref, syncLocal, tracks } = useLibrary();
  const [clientId, setClientId] = useState(prefs.spotifyClientId ?? '');
  const [connecting, setConnecting] = useState(false);
  const localCount = tracks.filter((x) => x.source === 'local').length;

  const connectSpotify = async () => {
    setConnecting(true);
    await setPref('spotifyClientId', clientId.trim());
    const ok = await Media.spotifyConnect(clientId.trim());
    setConnecting(false);
    refreshStatus();
    toast(ok ? t('Spotify kit connected') : t("Couldn't connect. Check the Client ID and that Spotify is signed in."));
  };

  return (
    <View style={{ gap: 12 }}>
      <Card
        icon={<Eye size={icon.size} color={colors.primary} strokeWidth={icon.stroke} />}
        title={t('See and control what is playing')}
        body={t('Android notification access lets Kanta read the song playing in your music apps and control it. Nothing leaves your phone.')}
        action={access ? undefined : { label: t('Turn on'), onPress: () => Media.openNotificationAccessSettings() }}
        done={access}
      />

      {STREAMING.map((s) => {
        const state = sourceCardState(s, installed, access, spotifyConnected);
        return (
          <View key={s}>
            <Card
              icon={<SourceBadge source={s} size="md" />}
              title={sourceName(s)}
              body={
                state === 'not-installed'
                  ? t('Not installed on this phone.')
                  : state === 'needs-access'
                    ? t('Installed. Turn on notification access above.')
                    : t(ABOUT[s])
              }
              action={state === 'not-installed' ? { label: t('Install'), onPress: () => void Linking.openURL(playStoreUrl(s)) } : undefined}
              done={state === 'ready' || state === 'ready-remote'}
            />
            {s === 'spotify' && !compact && state !== 'not-installed' ? (
              <View style={styles.kit}>
                <Text style={type.bodyStrong}>{t('Spotify kit (optional)')}</Text>
                <Text style={type.caption}>
                  {spotifyConnected
                    ? t('Connected. Spotify songs start and queue without switching apps.')
                    : t('Smoother Spotify control. Needs your own Spotify developer app: developer.spotify.com → Create app → redirect URI kanta://spotify-callback, package com.kanta.app.')}
                </Text>
                {spotifyConnected ? (
                  <Pressable onPress={() => (Media.spotifyDisconnect(), refreshStatus())}>
                    <Text style={styles.link}>{t('Disconnect')}</Text>
                  </Pressable>
                ) : (
                  <View style={styles.kitRow}>
                    <TextInput
                      value={clientId}
                      onChangeText={setClientId}
                      placeholder={t('Client ID')}
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={styles.input}
                    />
                    <Pressable style={styles.connect} disabled={!clientId.trim() || connecting} onPress={connectSpotify}>
                      <Text style={styles.connectText}>{connecting ? t('Connecting…') : t('Connect')}</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ) : null}
          </View>
        );
      })}

      <Card
        icon={
          <View style={[styles.round, { backgroundColor: colors.source.local }]}>
            <Smartphone size={16} color={colors.text} strokeWidth={2} />
          </View>
        }
        title={t('On this phone')}
        body={
          audioPermission
            ? t('{n} songs from your music files. Equalizer and audio quality work for these.', { n: localCount })
            : t('Play music files saved on this phone, with equalizer, crossfade and lossless playback.')
        }
        action={
          audioPermission
            ? { label: t('Rescan'), onPress: () => void syncLocal().then(() => toast(t('Music files updated'))) }
            : {
                label: t('Allow'),
                onPress: async () => {
                  if (await requestAudioPermission()) {
                    refreshStatus();
                    await syncLocal();
                  }
                },
              }
        }
        done={audioPermission}
      />

      {!compact ? (
        <Card
          icon={<Layers size={icon.size} color={colors.primary} strokeWidth={icon.stroke} />}
          title={t('Play the next song while the phone is locked')}
          body={t('"Display over other apps" lets Kanta open the next song in a different app from the background. Without it, Kanta shows an "Up next" notification you tap.')}
          action={overlay ? undefined : { label: t('Allow'), onPress: () => Media.openOverlaySettings() }}
          done={overlay}
        />
      ) : null}

      <Text style={[type.caption, { marginTop: 8 }]}>{t('Your accounts stay separate. Kanta never signs in to your music services.')}</Text>
      <Text style={type.caption}>{t('Features depend on each app. Audio settings only apply to music on this phone.')}</Text>
    </View>
  );
}

function Card(p: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: { label: string; onPress: () => void };
  done?: boolean;
}) {
  return (
    <View style={styles.card}>
      {p.icon}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={type.bodyStrong}>{p.title}</Text>
        <Text style={type.caption}>{p.body}</Text>
      </View>
      {p.action ? (
        <Pressable style={styles.connect} onPress={p.action.onPress}>
          <Text style={styles.connectText}>{p.action.label}</Text>
        </Pressable>
      ) : p.done ? (
        <Check size={20} color={colors.primary} strokeWidth={2.2} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 16 },
  kit: { backgroundColor: colors.surfaceSunken, borderRadius: radius.sm, padding: 14, marginTop: 6, gap: 6 },
  kitRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  input: { flex: 1, height: 40, borderRadius: 10, backgroundColor: colors.surface, color: colors.text, paddingHorizontal: 10, fontFamily: fonts.regular, fontSize: 13 },
  connect: { backgroundColor: colors.primary, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8 },
  connectText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.text },
  link: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primary, marginTop: 4 },
  round: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
