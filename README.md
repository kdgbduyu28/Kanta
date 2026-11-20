# Kanta

**Your music. All in one.** One library, one set of playlists and one queue for the music apps you
already use — Spotify, YouTube Music, Apple Music — plus the music files on your phone.

Kanta draws the screens; your installed music apps play the songs. You keep full songs, background
playback and lock-screen controls, and Kanta never signs in to your music services.

Android only. Design based on the "MixPlay" UI kit (kept locally in `docs/design/`, not in this repo).

## What it does

- **Now Playing for every app** — sees and controls whatever plays in Spotify, YouTube Music or
  Apple Music (Android notification access, the same system the lock screen uses).
- **Save songs** — share a song from any of the apps to Kanta, paste a link, or tap the heart on Now Playing.
- **Mixed playlists and one queue** — a playlist can go Spotify → YouTube Music → Apple Music →
  a FLAC on your phone; Kanta starts each song in its app when the previous one ends.
- **On this phone** — your music files, played by Kanta itself with a 9-band equalizer, presets,
  crossfade, gapless playback, volume normalization, balance and lossless / hi-res output.
- **Listening history and stats** across all apps, synced **lyrics** (LRCLIB), English and Filipino.

## What it doesn't do

- No catalog search of the services, and no importing a service playlist's track list — search
  covers your Kanta library.
- Audio settings only apply to music on your phone; streaming apps keep their own.
- No accounts or servers: everything stays on the phone.
- No unofficial APIs, embeds or tricks.

## Setup

1. Install the APK from [Releases](https://github.com/kdgbduyu28/Kanta/releases).
2. Open Kanta → **Get Started** → turn on **notification access** for Kanta.
3. Optional: allow **music files** (On this phone) and **Display over other apps** (lets the next song
   start in another app while the phone is locked; otherwise you get an "Up next" notification).

### Optional Spotify kit

Smoother Spotify control (start and queue songs without switching apps):

1. Download `spotify-app-remote-release-0.8.0.aar` from
   [spotify/android-sdk releases](https://github.com/spotify/android-sdk/releases) into
   `modules/kanta-media/android/libs/` and rebuild.
2. Create an app at [developer.spotify.com](https://developer.spotify.com/dashboard): redirect URI
   `kanta://spotify-callback`, Android package `com.kanta.app` + your signing SHA-1.
3. In Kanta: **Sources → Spotify kit** → paste the Client ID → Connect. Spotify Premium required.

## Development

```bash
npm install
npx expo prebuild --platform android
npx expo run:android
```

- `npm test` — vitest (library, links, queue helpers, lyrics; SQLite tests use Node 22's `node:sqlite`)
- `cd android && ./gradlew :kanta-media:testDebugUnitTest` — Kotlin queue/audio rules
- `npm run web` — screens with sample data in a browser (no playback)
- `./scripts/release.sh --apk` — tag and let GitHub Actions build the APK

Structure: `src/app` (screens, expo-router), `src/lib` (pure logic), `src/db` (SQLite), `src/store`
(zustand), `modules/kanta-media` (Kotlin: media sessions, queue engine, Media3 local player, EQ).
Design and plan: `docs/superpowers/`.
