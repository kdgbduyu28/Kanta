// Filipino translations, keyed by the English text shown in the app.
// Music terms people already say in Taglish (Playlist, Shuffle, Equalizer, Lyrics, Crossfade, Queue)
// stay as they are, the way local music apps write them. {name} placeholders are filled in by t().

export const fil: Record<string, string> = {
  // Tabs and navigation
  Home: 'Home',
  Search: 'Hanapin',
  Library: 'Library',
  Profile: 'Profile',
  Settings: 'Settings',
  Back: 'Bumalik',
  Close: 'Isara',
  Cancel: 'Kanselahin',
  Save: 'I-save',
  Delete: 'Burahin',
  Edit: 'I-edit',
  Create: 'Gumawa',
  Continue: 'Magpatuloy',
  Clear: 'Burahin',
  Allow: 'Payagan',
  Install: 'I-install',
  Connect: 'Ikonekta',
  'Connecting…': 'Kumokonekta…',
  Disconnect: 'Idiskonekta',
  'Turn on': 'I-on',
  Off: 'Naka-off',
  Browse: 'Tingnan',
  'See all': 'Tingnan lahat',

  // Welcome and setup
  'Your Music. All in One.': 'Lahat ng Musika Mo. Nasa Isa.',
  'Discover. Play. Enjoy.': 'Tumuklas. Tumugtog. Mag-enjoy.',
  'Get Started': 'Magsimula',
  'No account needed. Your music apps stay signed in as they are.':
    'Walang account na kailangan. Naka-sign in pa rin ang mga music app mo gaya ng dati.',
  'Step {n} of 2': 'Hakbang {n} sa 2',
  'Connect your music apps': 'Ikonekta ang mga music app mo',
  'Kanta draws one library and one queue. Your music apps play the songs, so you keep full songs, background play and lock-screen controls.':
    'Isang library at isang queue ang Kanta. Ang mga music app mo ang tumutugtog, kaya buo pa rin ang kanta, tuloy sa background, at may controls sa lock screen.',
  'Skip for now': 'Laktawan muna',
  'What should we call you?': 'Ano ang itatawag namin sa iyo?',
  'Your name (optional)': 'Pangalan mo (opsyonal)',
  'Start listening': 'Simulan ang pakikinig',

  // Home
  'Good morning!': 'Magandang umaga!',
  'Good afternoon!': 'Magandang hapon!',
  'Good evening!': 'Magandang gabi!',
  'Search songs, artists, playlists...': 'Hanapin ang kanta, artist, playlist...',
  'Let Kanta see what is playing': 'Hayaang makita ng Kanta ang tumutugtog',
  'GOOD VIBES ONLY': 'GOOD VIBES LANG',
  'Find your\nnext favorite.': 'Hanapin ang\nsusunod mong paborito.',
  'Explore music': 'Tumuklas ng musika',
  'Recently Played': 'Kamakailang Pinakinggan',
  'Browse by source': 'Tingnan ayon sa app',
  'Start your Kanta library': 'Simulan ang Kanta library mo',
  'Share a song from Spotify, YouTube Music or Apple Music to Kanta, or paste a link in Search.':
    'I-share sa Kanta ang kanta mula sa Spotify, YouTube Music o Apple Music, o mag-paste ng link sa Hanapin.',

  // Search
  'Find songs, artists, albums and playlists': 'Hanapin ang kanta, artist, album at playlist',
  'What do you want to play?': 'Ano ang gusto mong patugtugin?',
  All: 'Lahat',
  Songs: 'Mga Kanta',
  Artists: 'Mga Artist',
  Albums: 'Mga Album',
  Playlists: 'Mga Playlist',
  'Add to Kanta': 'Idagdag sa Kanta',
  'Saving…': 'Sine-save…',
  '{app} {kind} link': 'Link ng {kind} sa {app}',
  track: 'kanta',
  song: 'kanta',
  album: 'album',
  playlist: 'playlist',
  'Your most played': 'Pinakamadalas mong patugtugin',
  'Search your Kanta library': 'Hanapin sa Kanta library mo',
  'Paste a Spotify, YouTube Music or Apple Music link here to add it.':
    'Mag-paste dito ng link mula sa Spotify, YouTube Music o Apple Music para idagdag.',
  'No matches': 'Walang tugma',
  'Only songs saved in Kanta are searched.': 'Ang mga kantang naka-save lang sa Kanta ang hinahanap.',
  'Artist · {n} songs': 'Artist · {n} kanta',
  'Album · {artist}': 'Album · {artist}',

  // Library
  'Your Library': 'Iyong Library',
  'Your saved music in one place': 'Ang naka-save mong musika, nasa isang lugar',
  'New playlist': 'Bagong playlist',
  'New playlist name': 'Pangalan ng bagong playlist',
  'Playlist name': 'Pangalan ng playlist',
  'Liked Songs': 'Mga Gustong Kanta',
  '{n} songs': '{n} kanta',
  'No playlists yet': 'Wala pang playlist',
  'Make one and mix songs from any app.': 'Gumawa at paghaluin ang kanta mula sa kahit anong app.',
  'No songs yet': 'Wala pang kanta',
  'Share a song from Spotify, YouTube Music or Apple Music to Kanta, or paste a link.':
    'I-share sa Kanta ang kanta mula sa Spotify, YouTube Music o Apple Music, o mag-paste ng link.',
  'No artists yet': 'Wala pang artist',
  'Artists appear here as you save songs.': 'Lalabas dito ang mga artist habang nagse-save ka ng kanta.',
  'No albums yet': 'Wala pang album',
  'Albums appear here as you save songs.': 'Lalabas dito ang mga album habang nagse-save ka ng kanta.',

  // Playlist
  'Playlist • {n} songs • {time}': 'Playlist • {n} kanta • {time}',
  Play: 'I-play',
  Shuffle: 'Shuffle',
  'Delete playlist?': 'Burahin ang playlist?',
  '"{name}" will be removed. Songs stay in your library.': 'Mabubura ang "{name}". Mananatili ang mga kanta sa library mo.',
  'Edit playlist': 'I-edit ang playlist',
  Description: 'Paglalarawan',
  'No liked songs yet': 'Wala pang gustong kanta',
  'Tap the heart on Now Playing to save a song here.': 'I-tap ang puso sa Now Playing para i-save dito ang kanta.',
  'This playlist is empty': 'Walang laman ang playlist na ito',
  'Add songs with the ⋯ button on any song.': 'Magdagdag ng kanta gamit ang ⋯ sa kahit anong kanta.',

  // Song menu
  'Play next': 'Susunod na patugtugin',
  'Add to playlist': 'Idagdag sa playlist',
  'Remove from this playlist': 'Alisin sa playlist na ito',
  'Add to Liked Songs': 'Idagdag sa Mga Gustong Kanta',
  'Remove from Liked Songs': 'Alisin sa Mga Gustong Kanta',
  'Open in {app}': 'Buksan sa {app}',
  'Remove from Kanta': 'Alisin sa Kanta',
  'Added to {name}': 'Naidagdag sa {name}',
  'Playing next: {title}': 'Susunod: {title}',

  // Now playing and lyrics
  'NOW PLAYING': 'TUMUTUGTOG',
  'Nothing is playing': 'Walang tumutugtog',
  'Play something in Spotify, YouTube Music or Apple Music, or pick a song in Kanta.':
    'Magpatugtog sa Spotify, YouTube Music o Apple Music, o pumili ng kanta sa Kanta.',
  'Added to Liked Songs': 'Naidagdag sa Mga Gustong Kanta',
  'Saved. Share this song to Kanta once to play it from here.':
    'Na-save. I-share minsan ang kantang ito sa Kanta para mapatugtog dito.',
  'Share this song to Kanta once to play it from here': 'I-share minsan ang kantang ito sa Kanta para mapatugtog dito',
  Position: 'Posisyon',
  Previous: 'Nakaraan',
  Next: 'Susunod',
  Pause: 'I-pause',
  Repeat: 'Ulitin',
  Lyrics: 'Lyrics',
  'Up next': 'Susunod',
  'Open in app': 'Buksan sa app',
  'No lyrics found': 'Walang nahanap na lyrics',
  'Lyrics from LRCLIB': 'Lyrics mula sa LRCLIB',

  // Saving
  'Saved to Kanta: {title}': 'Na-save sa Kanta: {title}',
  "That link isn't a Spotify, YouTube Music or Apple Music song": 'Hindi kanta mula sa Spotify, YouTube Music o Apple Music ang link na iyan',
  'Playback works in the Android app': 'Sa Android app gumagana ang pagtugtog',
  'Opens in {app} on Android': 'Bubukas sa {app} sa Android',

  // Profile
  'Music lover': 'Mahilig sa musika',
  'Everything stays on this phone': 'Lahat ay nasa phone na ito lang',
  Listening: 'Pakikinig',
  'Edit Profile': 'I-edit ang Profile',
  'Connected Accounts': 'Mga Nakakonektang App',
  'Spotify, YouTube Music, Apple Music, this phone': 'Spotify, YouTube Music, Apple Music, phone na ito',
  'Playback & Audio': 'Pagtugtog at Audio',
  Notifications: 'Mga Abiso',
  Privacy: 'Privacy',
  'Help & Support': 'Tulong at Suporta',
  Name: 'Pangalan',
  'Your name': 'Pangalan mo',
  'Your initials are your picture. Everything stays on this phone.':
    'Ang initials mo ang larawan mo. Lahat ay nasa phone na ito lang.',

  // Sources
  Sources: 'Mga App',
  'The music apps Kanta works with': 'Ang mga music app na gumagana sa Kanta',
  'See and control what is playing': 'Tingnan at kontrolin ang tumutugtog',
  'Android notification access lets Kanta read the song playing in your music apps and control it. Nothing leaves your phone.':
    'Sa notification access ng Android, nababasa ng Kanta ang kantang tumutugtog sa mga music app mo at nakokontrol ito. Walang lumalabas sa phone mo.',
  'Not installed on this phone.': 'Hindi naka-install sa phone na ito.',
  'Installed. Turn on notification access above.': 'Naka-install. I-on ang notification access sa itaas.',
  'Kanta controls the Spotify app on this phone. Premium is needed to pick exact songs.':
    'Kinokontrol ng Kanta ang Spotify app sa phone na ito. Kailangan ng Premium para pumili ng eksaktong kanta.',
  'Kanta controls the YouTube Music app on this phone.': 'Kinokontrol ng Kanta ang YouTube Music app sa phone na ito.',
  'Kanta controls the Apple Music app on this phone.': 'Kinokontrol ng Kanta ang Apple Music app sa phone na ito.',
  'Spotify kit (optional)': 'Spotify kit (opsyonal)',
  'Connected. Spotify songs start and queue without switching apps.':
    'Nakakonekta. Nagsisimula at napipila ang mga kanta sa Spotify nang hindi lumilipat ng app.',
  'Smoother Spotify control. Needs your own Spotify developer app: developer.spotify.com → Create app → redirect URI kanta://spotify-callback, package com.kanta.app.':
    'Mas maayos na kontrol sa Spotify. Kailangan ng sarili mong Spotify developer app: developer.spotify.com → Create app → redirect URI kanta://spotify-callback, package com.kanta.app.',
  'Client ID': 'Client ID',
  'Spotify kit connected': 'Nakakonekta ang Spotify kit',
  "Couldn't connect. Check the Client ID and that Spotify is signed in.":
    'Hindi makakonekta. Tingnan ang Client ID at kung naka-sign in ang Spotify.',
  'On this phone': 'Nasa phone na ito',
  '{n} songs from your music files. Equalizer and audio quality work for these.':
    '{n} kanta mula sa mga music file mo. Gumagana dito ang equalizer at audio quality.',
  'Play music files saved on this phone, with equalizer, crossfade and lossless playback.':
    'Patugtugin ang mga music file sa phone na ito, may equalizer, crossfade at lossless.',
  Rescan: 'I-scan ulit',
  'Music files updated': 'Na-update ang mga music file',
  'Play the next song while the phone is locked': 'Patugtugin ang susunod na kanta kahit naka-lock ang phone',
  '"Display over other apps" lets Kanta open the next song in a different app from the background. Without it, Kanta shows an "Up next" notification you tap.':
    'Sa "Display over other apps", nabubuksan ng Kanta ang susunod na kanta sa ibang app kahit nasa background. Kung wala, magpapakita ang Kanta ng abisong "Susunod" na ita-tap mo.',
  'Your accounts stay separate. Kanta never signs in to your music services.':
    'Hiwalay pa rin ang mga account mo. Hindi kailanman nagsa-sign in ang Kanta sa mga music service mo.',
  'Features depend on each app. Audio settings only apply to music on this phone.':
    'Nakadepende sa bawat app ang features. Sa musikang nasa phone lang gumagana ang audio settings.',

  // Settings
  'Personalize your Kanta experience': 'I-personalize ang Kanta mo',
  'Quality, equalizer, crossfade, auto-advance': 'Quality, equalizer, crossfade, tuloy-tuloy na pagtugtog',
  'Manage alerts': 'Ayusin ang mga abiso',
  Appearance: 'Itsura',
  'Dark theme': 'Madilim na tema',
  Language: 'Wika',
  'What Kanta reads and keeps': 'Ang binabasa at itinatago ng Kanta',
  PLAYBACK: 'PAGTUGTOG',
  'These apply to music on this phone. Streaming apps use their own settings.':
    'Para sa musikang nasa phone na ito. May sariling settings ang mga streaming app.',
  'Audio Quality': 'Audio Quality',
  'Choose your preferred sound quality': 'Piliin ang gusto mong kalidad ng tunog',
  Equalizer: 'Equalizer',
  'Customize your sound profile': 'I-customize ang tunog mo',
  '{name} EQ enabled': 'Naka-on ang {name} EQ',
  'MORE AUDIO OPTIONS': 'IBA PANG AUDIO OPTIONS',
  Crossfade: 'Crossfade',
  '{n} sec': '{n} seg',
  'Gapless Playback': 'Gapless Playback',
  'Volume Normalization': 'Pantay na Lakas ng Tunog',
  'Audio Balance': 'Audio Balance',
  Center: 'Gitna',
  'Left {n}%': 'Kaliwa {n}%',
  'Right {n}%': 'Kanan {n}%',
  'STREAMING APPS': 'MGA STREAMING APP',
  'Sound settings in {app}': 'Sound settings sa {app}',
  'Quality and equalizer for these songs are set in that app': 'Sa app na iyon itinatakda ang quality at equalizer ng mga kantang ito',
  'KANTA QUEUE': 'KANTA QUEUE',
  'Auto-advance across apps': 'Tuloy-tuloy kahit ibang app',
  'When a song ends, start the next one in Kanta’s queue, in whichever app it lives.':
    'Pagkatapos ng kanta, simulan ang susunod sa queue ng Kanta, kahit saang app ito naroon.',
  'Display over other apps': 'Display over other apps',
  'Allowed: the next song starts even when the phone is locked': 'Pinayagan: nagsisimula ang susunod na kanta kahit naka-lock ang phone',
  'Not allowed: you get an "Up next" notification to tap instead': 'Hindi pinayagan: may abisong "Susunod" na ita-tap mo',
  'Listening history': 'Kasaysayan ng pakikinig',
  'Powers Recently Played and your stats. Kept only on this phone.':
    'Para sa Kamakailang Pinakinggan at sa stats mo. Nasa phone na ito lang.',
  'Clear listening history': 'Burahin ang kasaysayan ng pakikinig',
  'Clear listening history?': 'Burahin ang kasaysayan ng pakikinig?',
  'Recently Played and your listening stats start over. This cannot be undone.':
    'Magsisimula ulit ang Kamakailang Pinakinggan at ang stats mo. Hindi na ito maibabalik.',

  // Audio quality
  'Select the best quality supported by your source.': 'Piliin ang pinakamagandang quality na kaya ng source mo.',
  Auto: 'Auto',
  'Adjust quality automatically': 'Kusang inaayos ang quality',
  'High Quality': 'High Quality',
  '16-bit / 48 kHz • safe for Bluetooth': '16-bit / 48 kHz • ligtas sa Bluetooth',
  'FLAC Lossless': 'FLAC Lossless',
  'FLAC • Lossless': 'FLAC • Lossless',
  'Plays each file at its own rate • compatible files': 'Bawat file sa sarili nitong rate • compatible na file',
  'Hi-Res FLAC': 'Hi-Res FLAC',
  'Up to 24-bit / 192 kHz*': 'Hanggang 24-bit / 192 kHz*',
  SELECTED: 'NAPILI',
  '*Only when the audio file, device and output path support this resolution. Bit-perfect output needs a USB DAC on Android 14 or newer. Streaming apps set their own quality.':
    '*Kapag kaya lang ng audio file, device at output ang resolution na ito. Kailangan ng USB DAC sa Android 14 pataas para sa bit-perfect. May sariling quality ang mga streaming app.',
  'Apply Quality': 'Gamitin ang Quality',
  'Quality applied': 'Nagamit na ang quality',
  'Changes apply to music on this phone.': 'Sa musikang nasa phone na ito ang mga pagbabago.',

  // Equalizer
  'Shape your sound to match your taste.': 'Hubugin ang tunog ayon sa gusto mo.',
  'Enable Equalizer': 'I-on ang Equalizer',
  PRESETS: 'PRESETS',
  Custom: 'Custom',
  Flat: 'Flat',
  Pop: 'Pop',
  Rock: 'Rock',
  Jazz: 'Jazz',
  Classical: 'Classical',
  'Hip-Hop': 'Hip-Hop',
  EDM: 'EDM',
  Reset: 'I-reset',
  'Save Preset': 'I-save ang Preset',
  'Preset name': 'Pangalan ng preset',
  'Saved "{name}"': 'Na-save ang "{name}"',
  'Adjust each band, then save your custom profile.': 'Ayusin ang bawat band, saka i-save ang custom profile mo.',
  'The equalizer works on music on this phone. Spotify, YouTube Music and Apple Music have their own.':
    'Gumagana ang equalizer sa musikang nasa phone na ito. May sarili ang Spotify, YouTube Music at Apple Music.',

  // Notifications
  'When Android won’t let Kanta open the next song from the background, show a notification you tap to play it.':
    'Kapag hindi pinayagan ng Android na buksan ng Kanta ang susunod na kanta mula sa background, magpakita ng abisong ita-tap mo para patugtugin ito.',

  // Privacy
  'Kanta reads only media info from your music apps: song, artist, album, cover and position. It does not read your other notifications.':
    'Media info lang ang binabasa ng Kanta sa mga music app mo: kanta, artist, album, cover at posisyon. Hindi nito binabasa ang iba mong abiso.',
  'Your library, playlists and listening history are stored only on this phone. Kanta has no account and no server.':
    'Nasa phone na ito lang ang library, mga playlist at kasaysayan ng pakikinig mo. Walang account at walang server ang Kanta.',
  'Kanta never signs in to Spotify, YouTube Music or Apple Music. It opens songs in those apps and presses play, pause and skip for you.':
    'Hindi kailanman nagsa-sign in ang Kanta sa Spotify, YouTube Music o Apple Music. Binubuksan nito ang kanta sa mga app na iyon at pinipindot ang play, pause at skip para sa iyo.',
  'Song details and lyrics are looked up from public pages (Spotify, YouTube, Apple Music) and LRCLIB when you save or open a song.':
    'Kinukuha ang detalye ng kanta at lyrics mula sa mga pampublikong pahina (Spotify, YouTube, Apple Music) at LRCLIB kapag nag-save o nagbukas ka ng kanta.',
  'Turn off notification access': 'I-off ang notification access',

  // Contact
  CONTACT: 'MAKIPAG-UGNAYAN',
  'A bug, a missing feature or an idea? Email us.': 'May bug, kulang na feature o ideya? I-email kami.',
};
