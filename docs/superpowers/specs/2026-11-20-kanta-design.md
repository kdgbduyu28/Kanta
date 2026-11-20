# Kanta — design

Date: 2026-11-20 · Status: draft, awaiting approval
Visual reference: [`docs/design/MixPlay-reference.pdf`](../../design/MixPlay-reference.pdf) (the "MixPlay" UI kit, renamed Kanta)

## 1. Intent

Kanta ("song") is one music hub for the apps you already pay for. You keep one
library, one set of playlists and one queue that can mix Spotify, YouTube Music
and Apple Music songs, and Kanta drives the music apps installed on the phone.
**Kanta draws the screens; the installed apps play the audio.** You get full
songs, background playback and lock-screen controls, all through official
mechanisms, with no tricks.

It is a personal app first and a public showcase second: shared as an APK on
GitHub Releases like Bayarin and Pabili, with a page on the portfolio site.

## 2. Goals, non-goals, anti-goals

**Goals (v1)**
- Look and feel of the reference PDF: dark/purple design system, the same tabs
  and screens, smooth animated Now Playing.
- See and control whatever is playing in Spotify, YouTube Music or Apple Music
  (song, artist, cover, progress, play/pause/skip/seek).
- Save songs into Kanta (share from the music app, paste a link, or tap "Save"
  on what is playing) and build playlists that mix sources.
- One Kanta queue that plays across sources, moving on to the next song when
  one ends.
- Listening history across all three apps (everything Kanta sees playing),
  powering Recently Played, Most Played and Profile stats.
- Synced lyrics on Now Playing.
- **On this phone**: music files on the device as a fourth source, played by
  Kanta itself, where the PDF's Audio Quality, Equalizer, Crossfade, Gapless,
  Volume Normalization and Audio Balance settings work for real.
- English and Filipino, like the other apps.

**Non-goals (v1)**
- iPhone. iOS does not let apps control other music apps. Revisit later with
  Apple MusicKit + Spotify iOS SDK only.
- Web version. (A laptop version built on embed players is a possible later
  project.)
- Searching the services' catalogs, or importing a Spotify/YouTube playlist's
  full track list. Both need per-service developer access; v1 search covers
  the Kanta library.
- Kanta accounts, sign-in or cloud sync. Everything is local to the phone.
- Play Store release.

**Anti-goals (a failure even if it works)**
- Anything that breaks a service's terms: unofficial APIs (ytmusicapi,
  InnerTube), user-agent spoofing, pulling audio streams, bypassing DRM.
- "Connect" buttons that pretend to sign in to a service when they don't.
  Every source screen says plainly what Kanta can and can't do with it.
- Settings that do nothing. If a toggle can't affect the source app's audio,
  it isn't shown (see §6.3).

## 3. Constraints (found during research, 2026-11-20)

- **Spotify Web API**: new personal apps are capped at 5 users, the owner needs
  Premium, and wider access is only for registered companies with 250k MAU.
  The developer policy forbids mixing Spotify content with other services'
  streams in one product. → Kanta's core does not use Spotify's developer
  platform. The optional Spotify remote kit (§5.4) is for the owner's own use.
- **YouTube Music**: no official API for playback; YouTube embeds must stay
  visible and can't play in the background. → Kanta controls the installed
  YouTube Music app instead.
- **Embeds on phones** play 30-second previews. → Not used.
- **Android media controls**: an app with notification access can list the
  active media sessions of every app and send transport commands
  (`MediaSessionManager.getActiveSessions` + `MediaController`). This is the
  same system the lock screen and smartwatches use, and needs no service's
  permission.
- **Android background launch limits** (Android 10+): an app in the background
  can't freely bring another app's screen to the front. This affects starting
  a song in a *different* app when the queue moves on while the phone is
  locked. See §5.3 and the Phase 0 test.
- User's stack and habits: Expo SDK 57 / React Native 0.86, expo-router,
  zustand, vitest, TypeScript; Kotlin + Media3 experience from Sine; APKs built
  by GitHub Actions on `v*` tags via `scripts/release.sh`.

## 4. Approaches considered

| | How it plays music | Trade-off |
|---|---|---|
| A. Embed players (iframes) | Spotify/YouTube/Apple embeds inside Kanta | Phones get 30-sec previews; no background play. Dropped for v1. |
| B. Desktop-mode web view | Web view pretending to be a desktop browser | Breaks Spotify's terms, fragile, impossible on iPhone. Rejected. |
| C. Spotify remote kit only | Kanta tells the Spotify app what to play | Smooth, but Spotify-only and 5-user cap. |
| **D. Android media controls + links (chosen)** | Kanta opens a song's link in its app, then controls it through Android's media controls | Works with every music app, no developer access needed. Catch: brief app switch when starting a song in another app, and Kanta must catch the end of each song. |

**Chosen: D as the base, with C added for Spotify** (optional, when the user
has registered a Spotify developer app) because it can start Spotify songs and
queue the next one without switching apps.

## 5. How it works

### 5.1 Stack
- Expo SDK 57, expo-router, TypeScript, zustand, vitest — same as Pabili and
  Gawain. Package `com.kanta.app`, scheme `kanta`.
- A local Expo native module, `modules/kanta-media` (Kotlin), owns everything
  that must keep running with the screen off.
- Local database: `expo-sqlite`. Images cached with `expo-image`.
- Icons: stroke icons at 20px / 1.8 stroke to match the PDF (builder's call:
  `lucide-react-native` on top of `react-native-svg`).
- Font: Inter (the PDF's typeface), via `expo-font`.

### 5.2 Native module `kanta-media`
1. **`KantaListenerService`** (`NotificationListenerService`). Enabled by the
   user in Android settings; it is Kanta's key to other apps' media sessions.
   It stays alive in the background on its own, so the queue engine lives here.
2. **Session watcher**: tracks active sessions of the supported packages
   (`com.spotify.music`, `com.google.android.apps.youtube.music`,
   `com.apple.android.music`), picks the one playing, and emits to JS:
   source, title, artist, album, duration, position, state, artwork (saved to
   a cache file) and the media ID if the app provides one.
3. **Controls**: play, pause, next, previous, seek, shuffle/repeat where the
   session supports them.
4. **Starter**: start a saved song from its link: open an `ACTION_VIEW` intent
   restricted to the source package, wait for that app's session to show the
   expected song, send `play()` if needed, then bring Kanta back to the front
   when Kanta started it from the foreground.
5. **History log**: every song seen playing for 30+ seconds is written to the
   database, with source and listened time, even when Kanta's screens are closed.
6. **Installed apps**: reports which of the three apps are installed.

### 5.3 Queue engine (native, in the listener service)
- Kanta's queue is a list of saved songs; it lives in the database so JS and
  the service share it.
- **End of song**: when the playing song's position reaches its end, or its
  session switches to a song that isn't the queued one, the engine pauses that
  app and starts the next queued song.
- **Same source next**: if the next song is in the same app, send it there
  without switching screens (Spotify remote kit `queue`/`play`; for the
  others, the same link intent).
- **Different source next, phone locked/Kanta in background**: blocked by
  Android's background launch limits unless Kanta has an exemption. Plan:
  ask for the "Display over other apps" permission, which lifts the limit;
  if the user declines, Kanta posts a "Next: <song> — tap to play" notification
  instead. Phase 0 confirms which works.
- Shuffle and repeat are Kanta's own; the music apps' own shuffle is left alone.
- Kanta does not create its own lock-screen player; the source app's player
  stays on the lock screen. Pressing "next" there skips inside that app;
  the engine notices the unexpected song and follows Kanta's queue
  (builder confirms this feels right in Phase 4).

### 5.4 Spotify remote kit (optional)
- Spotify App Remote SDK for Android, set up from the Sources screen. Needs a
  Spotify developer app (Client ID, redirect `kanta://spotify-callback`),
  Spotify installed and Premium. Kanta's owner registers this; others can use
  Kanta without it.
- When connected, Spotify songs start and queue without switching screens.
- Spotify's branding rules apply to anything shown from the kit: Spotify logo
  next to Spotify songs, artwork unaltered.

### 5.5 Saving songs
- **Share to Kanta**: Kanta appears in Android's share sheet; sharing a song
  from Spotify, YouTube Music or Apple Music saves it.
- **Paste a link**: in Search and on the Library screen.
- **Save what's playing**: heart on Now Playing.
- **Details from links**: song name, artist and cover come from public page
  info: Spotify's oEmbed/page tags, YouTube's oEmbed, Apple Music page tags
  (builder's call on exact parsing). Album and playlist links are saved as one
  item that plays the whole album/playlist in its app.
- **Gap to confirm in Phase 0**: "Save what's playing" needs a link to play the
  song again. If an app's media session doesn't expose its song ID, Kanta
  saves the song and fills the link by asking the user to share it once, or by
  a search link in that app (`spotify:search:…`).

### 5.6 Lyrics
LRCLIB (`lrclib.net`, free, no key): synced lyrics looked up by title, artist
and duration, cached in the database. Shown on the Lyrics sheet from Now Playing.

### 5.7 Data model (SQLite)
- `tracks`: id, source (`spotify` | `ytmusic` | `applemusic` | `local`), kind (`track` |
  `album` | `playlist`), link, source_id, title, artist, album, artwork_url,
  duration_ms, liked, added_at
- `playlists`: id, name, description, cover (generated from first four covers
  or an icon), created_at
- `playlist_tracks`: playlist_id, track_id, position
- `queue`: position, track_id; plus `queue_state`: current index, shuffle, repeat
- `plays`: id, track_id (nullable), source, title, artist, started_at,
  listened_ms
- `lyrics`: track key, synced text, fetched_at
- `settings`: key/value (language, notifications, display name, avatar)

## 6. Screens (mapped from the PDF)

Tabs: Home · Search · Library · Profile, with a mini player above the tabs
whenever something is playing (not in the PDF; needed to reach Now Playing).

### 6.1 Main screens
| PDF screen | In Kanta |
|---|---|
| Welcome ("MixPlay, Your Music. All in One.") | Kanta logo + tagline; source chips; **Get Started** leads to setup (notification access → which apps are installed → optional Spotify kit). "Already have an account? Sign in" is removed (no accounts in v1). |
| Home | Greeting with your name; search field (opens Search); hero card "Find your next favorite" → Library; **Recently Played** from history; **Browse by source**: Spotify / YouTube Music / Apple Music cards that open the library filtered to that source. |
| Search | Searches the Kanta library and history. Chips: All, Songs, Artists, Albums. **"Trending now" becomes "Your most played"** (no catalog access). Pasting a link offers "Add to Kanta". |
| Now Playing | Big artwork with a slow animated purple glow, title, artist, source badge, heart, progress bar, shuffle / previous / play-pause / next / repeat, **Lyrics** button. Works for anything playing in the three apps, saved or not. |
| Your Library | Chips: Playlists, Songs, Artists, Albums. Liked Songs first, then Kanta playlists. "Discover Weekly"-style service playlists appear when saved by link. |
| Playlist (Chill Vibes) | Cover, name, "Playlist • N songs • duration", description, **Play** / **Shuffle**, song rows with source badge and a ⋯ menu (play next, add to playlist, remove, open in app). |
| Connect Sources | Renamed **Sources**. One card per app: installed / not installed (→ Play Store link), "Kanta can control it" status, and for Spotify an optional "Connect Spotify kit". The PDF's notes stay: "Your accounts stay separate" and "Features depend on each app". |
| Profile | Avatar + name (local, editable), stats: Playlists, Songs, Listening (hours from history). Rows: Sources, Playback, Notifications, Privacy, Help & Support. Email is not shown (no account). |
| Settings | Rows: Playback, Notifications, Appearance (dark — the PDF is dark-only; light theme is later), Language (English / Filipino). "Account & Security" removed. |
| Design System | Becomes the theme tokens in code (§7). |

### 6.2 Settings sub-screens
- **Playback**: Auto-advance across apps (on/off), "Display over other apps"
  permission status, history on/off, clear history.
- **Notifications**: "Up next" notification on/off.
- **Privacy**: what Kanta reads (media info only, stored only on the phone),
  link to turn off notification access.

### 6.3 Audio screens (PDF's "Audio Experience") — local files
The source apps play their own audio, so these settings apply **only to songs
from "On this phone"**. Each screen says so in one line (the PDF already has
"Changes apply to compatible playback sources" and "EQ availability depends on
the playback source"). Streaming songs show a row "Set in Spotify / YouTube
Music / Apple Music" that opens that app.

| PDF screen / row | For local files |
|---|---|
| Settings → Playback | The PDF's layout: Audio Quality row (shows current mode), Equalizer row with toggle ("Custom EQ enabled"), then Crossfade (0–12 sec, PDF shows 5 sec), Gapless Playback, Volume Normalization, Audio Balance slider. |
| Audio Quality | Auto (device default output) · High Quality (decode to 16-bit/48 kHz, the safe default for Bluetooth) · Lossless (play FLAC/ALAC at the file's own rate) · Hi-Res (24-bit up to the file's rate; bit-perfect over a USB DAC on Android 14+ where the device allows it). Each file's format is shown in Now Playing (e.g. "FLAC · 24-bit/96 kHz"). Keeps the PDF's "*only when the file, device and output support it" note. *My call.* |
| Equalizer | Enable toggle, presets (Custom, Flat, Pop, Rock, Jazz, Classical, Hip-Hop, EDM), the PDF's 9 bands (60, 150, 400, 1k, 2.4k, 6k, 10k, 14k, 16k Hz) at ±12 dB, Reset, Save Preset (named custom presets). Built on Android `DynamicsProcessing` (API 28+) so all 9 bands are real; the older `Equalizer` effect often has only 5 bands. |
| Crossfade | Two Media3 players fading out/in over the chosen seconds. Off when Gapless is on for albums (builder's call on the exact rule). |
| Gapless Playback | Media3's built-in gapless playback. |
| Volume Normalization | ReplayGain tags when present; otherwise a gentle limiter (`DynamicsProcessing`). |
| Audio Balance | Left/right gain through `DynamicsProcessing` per-channel gain. |

### 6.4 "On this phone" source
- Permission: `READ_MEDIA_AUDIO`; Kanta scans the device's music through
  MediaStore and keeps it in sync on app open.
- Shows up in Library (Songs/Artists/Albums), Search, Home ("Browse by source"
  gets an "On this phone" card) and Kanta playlists, mixed with streaming songs.
- Kanta plays these itself with Media3 inside a `MediaSessionService` in
  `kanta-media`, so they get Kanta's own lock-screen and notification player,
  background play and headset buttons.
- Formats: whatever Media3 decodes on the device (MP3, AAC, FLAC, ALAC, OGG,
  Opus, WAV).
- Artwork from the file's embedded cover, or from the folder.
- In a mixed queue, a local song is the smoothest case: no app switching.
  Moving from a local song to a streaming one pauses Kanta's player first.

## 7. Design system (from the PDF)

- Colors: Primary `#A855F7`, Accent `#6826F5`, Background `#08090E`,
  Surface `#24222E`, Text `#F8F6FC`; muted text ≈ 60% text; primary buttons
  use a Primary→Accent gradient; source colors: Spotify green, YouTube Music
  red, Apple Music pink-red.
- Type (Inter): Display Bold 28, Heading Semibold 22, Body Regular 14,
  Caption Regular 11.
- Spacing 4 / 8 / 12 / 16 / 24 / 32. Radius 12 / 16 / 24 / 32.
- Icons 20px, stroke 1.8.
- Components from the PDF: chips (active filled purple / default dark),
  search field, primary gradient button, secondary dark button, list row with
  chevron, toggle, source card.
- Motion (Reanimated): artwork scale/glow on play/pause, shared-element feel
  from mini player to Now Playing, progress bar easing, chip transitions.

## 8. Phases

0. **Feasibility test (throwaway)** on the user's Android phone. Prove or
   disprove: reading and controlling sessions of all three apps; which apps
   expose a song ID; starting a song by link in each app (does it auto-play?);
   cross-app start while locked, with and without "Display over other apps";
   catching song end before the app autoplays its own next song; Spotify kit
   connect; what a free (non-Premium) Spotify account does when opening a
   song link (it may shuffle instead of playing that song). Outcome updates §5 before the real build.
1. **Foundation**: Expo project, theme tokens, fonts, tabs, all screens built
   from the PDF with sample data, English/Filipino strings.
2. **Native bridge**: `kanta-media` module, setup flow and Sources screen,
   live Now Playing and mini player, controls.
3. **Library**: SQLite, share-to-Kanta, paste link, link details, liked songs,
   playlists, history logging, Recently/Most Played, Search.
4. **Queue engine**: native queue, cross-app auto-advance, shuffle/repeat,
   Spotify kit.
5. **Polish**: lyrics, Profile stats, notifications, privacy screen, motion
   pass, empty states.
6. **Release**: icon/splash, `release.sh` + GitHub Actions APK workflow, README,
   repo `kdgbduyu28/Kanta`, portfolio page.
7. **On this phone**: MediaStore scan, Media3 player service, local songs in
   library/search/queue, then the PDF's Audio Quality, Equalizer, Crossfade,
   Gapless, Volume Normalization and Audio Balance screens. Can start after
   Phase 3 (it needs the library, not the cross-app queue); if built before
   Phase 6, it ships in the first release.

Testing: vitest for link parsing, queue rules and history math; Kotlin unit
tests for the queue engine. Per the user's standing preference, no builds or
test runs mid-development; verify when asked. Installing on the user's phone
is the user's step.

## 9. Left to the builder
- Exact library choices inside the stack (icon set, SQLite wrapper, share
  intent handling).
- Link-detail parsing per service.
- Animation details within the PDF's look.
- How the mini player expands into Now Playing.

## 10. Decisions log
- 2026-11-20: name **Kanta** (over Tono).
- 2026-11-20: approach D (Android media controls + links) with optional
  Spotify remote kit.
- 2026-11-20: add **On this phone** (local files) so the PDF's audio screens
  are real; streaming sources keep their own audio settings.
