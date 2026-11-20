package com.kanta.media.local

import android.content.Intent
import android.os.Handler
import android.os.Looper
import androidx.annotation.OptIn
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.Metadata
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.extractor.metadata.id3.TextInformationFrame
import androidx.media3.extractor.metadata.vorbis.VorbisComment
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import com.kanta.media.KantaCore

/**
 * Plays music files on this phone. Owns the ExoPlayer(s), the audio effects and the crossfade;
 * LocalPlayback talks to it through a Media3 MediaController (so Android keeps it in the foreground).
 */
@OptIn(UnstableApi::class)
class LocalPlayerService : MediaSessionService() {

    companion object {
        @Volatile var instance: LocalPlayerService? = null
            private set
    }

    private val main = Handler(Looper.getMainLooper())
    private var session: MediaSession? = null
    private lateinit var player: ExoPlayer
    private var fx: AudioFx? = null
    private var settings = AudioSettingsK()
    private var crossfader: Crossfader? = null

    /** The current player's playlist starts this many songs into LocalPlayback's run (after crossfades). */
    var runOffset = 0
        private set

    override fun onCreate() {
        super.onCreate()
        KantaCore.init(applicationContext)
        settings = AudioSettingsK.load(KantaCore.prefs)
        player = buildPlayer()
        session = MediaSession.Builder(this, player).setId("kanta-local").build()
        instance = this
        QualityMode.applyMixer(this, settings.quality)
        main.post(tick)
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = session

    override fun onTaskRemoved(rootIntent: Intent?) {
        if (!player.playWhenReady || player.mediaItemCount == 0) stopSelf()
    }

    override fun onDestroy() {
        main.removeCallbacksAndMessages(null)
        crossfader?.cancel()
        fx?.release()
        session?.release()
        player.release()
        session = null
        instance = null
        super.onDestroy()
    }

    private fun buildPlayer(): ExoPlayer {
        val p = ExoPlayer.Builder(this, QualityMode.renderersFactory(this, settings.quality))
            .setAudioAttributes(
                AudioAttributes.Builder().setUsage(C.USAGE_MEDIA).setContentType(C.AUDIO_CONTENT_TYPE_MUSIC).build(),
                /* handleAudioFocus */ true,
            )
            .setHandleAudioBecomingNoisy(true)
            .setWakeMode(C.WAKE_MODE_LOCAL)
            .build()
        fx?.release()
        fx = AudioFx(p.audioSessionId).also { it.apply(settings) }
        p.addListener(object : Player.Listener {
            override fun onMetadata(metadata: Metadata) = applyReplayGain(p, metadata)
            override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
                p.volume = 1f // ReplayGain of the new song arrives with its metadata.
            }
        })
        return p
    }

    /** A new run of songs is starting: forget the crossfade offset. */
    fun resetRun() {
        crossfader?.cancel()
        crossfader = null
        runOffset = 0
    }

    // ---- Settings ----

    fun applySettings(s: AudioSettingsK) {
        val qualityChanged = s.quality != settings.quality
        settings = s
        if (qualityChanged) {
            QualityMode.applyMixer(this, s.quality)
            rebuildPlayer()
        } else {
            fx?.apply(s)
        }
    }

    /** New renderers are needed for a new quality: rebuild and carry on where we were. */
    private fun rebuildPlayer() {
        crossfader?.cancel()
        val items = (0 until player.mediaItemCount).map { player.getMediaItemAt(it) }
        val index = player.currentMediaItemIndex
        val pos = player.currentPosition
        val playing = player.playWhenReady
        val repeat = player.repeatMode
        val old = player
        player = buildPlayer()
        player.repeatMode = repeat
        if (items.isNotEmpty()) {
            player.setMediaItems(items, index, pos)
            player.prepare()
            player.playWhenReady = playing
        }
        session?.player = player
        old.release()
    }

    // ---- Crossfade ----

    private val tick = object : Runnable {
        override fun run() {
            maybeStartCrossfade()
            main.postDelayed(this, 200)
        }
    }

    private fun maybeStartCrossfade() {
        val fadeMs = settings.crossfadeSec * 1000L
        if (fadeMs <= 0 || crossfader != null || !player.isPlaying) return
        val next = player.nextMediaItemIndex
        if (next == C.INDEX_UNSET || player.repeatMode == Player.REPEAT_MODE_ONE) return
        val dur = player.duration
        if (dur == C.TIME_UNSET || dur < fadeMs * 2) return
        if (dur - player.currentPosition > fadeMs) return
        // Gapless wins between songs of the same album.
        val a = player.currentMediaItem?.mediaMetadata?.albumTitle
        val b = player.getMediaItemAt(next).mediaMetadata.albumTitle
        if (settings.gapless && a != null && a == b) return

        val rest = (next until player.mediaItemCount).map { player.getMediaItemAt(it) }
        val incoming = buildPlayer().apply {
            repeatMode = player.repeatMode
            setMediaItems(rest, 0, 0)
            prepare()
            volume = 0f
            play()
        }
        val outgoing = player
        crossfader = Crossfader(main, fadeMs, outgoing, incoming) {
            // Swap: the session now drives the incoming player; indices shift by `next`.
            runOffset += next
            player = incoming
            session?.player = incoming
            outgoing.release()
            crossfader = null
            KantaCore.local.onPlayerSwapped()
        }.also { it.start() }
    }

    // ---- ReplayGain ----

    private fun applyReplayGain(p: ExoPlayer, metadata: Metadata) {
        if (!settings.normalize) return
        var gain: Float? = null
        var peak = 1f
        for (i in 0 until metadata.length()) {
            when (val e = metadata[i]) {
                is VorbisComment -> when (e.key.uppercase()) {
                    "REPLAYGAIN_TRACK_GAIN" -> gain = parseDb(e.value)
                    "REPLAYGAIN_TRACK_PEAK" -> peak = e.value.trim().toFloatOrNull() ?: 1f
                }
                is TextInformationFrame -> when (e.description?.uppercase()) {
                    "REPLAYGAIN_TRACK_GAIN" -> gain = parseDb(e.values.firstOrNull())
                    "REPLAYGAIN_TRACK_PEAK" -> peak = e.values.firstOrNull()?.trim()?.toFloatOrNull() ?: 1f
                }
            }
        }
        gain?.let { p.volume = AudioMath.replayGainToLinear(it, peak).coerceAtMost(1f) }
    }

    private fun parseDb(s: String?): Float? = s?.lowercase()?.replace("db", "")?.trim()?.toFloatOrNull()
}
