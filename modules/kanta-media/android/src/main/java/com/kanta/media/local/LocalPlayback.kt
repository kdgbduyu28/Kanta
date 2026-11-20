package com.kanta.media.local

import android.content.ComponentName
import android.content.ContentUris
import android.content.Context
import android.net.Uri
import android.provider.MediaStore
import androidx.annotation.OptIn
import androidx.core.content.ContextCompat
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.common.Tracks
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.kanta.media.KantaCore
import com.kanta.media.PS
import com.kanta.media.QueueItemK
import com.kanta.media.SessionSnapshot

/**
 * Kanta-side handle on LocalPlayerService: sends commands through a Media3 MediaController and
 * reports the local player's state to SessionWatcher and the queue engine.
 */
@OptIn(UnstableApi::class)
class LocalPlayback(private val context: Context) {
    private var controller: MediaController? = null
    private var connecting = false
    private val pending = mutableListOf<(MediaController) -> Unit>()
    private var runItems: List<QueueItemK> = emptyList()
    private var artCache = mutableMapOf<String, String?>()

    val isActive: Boolean get() = controller?.let { it.mediaItemCount > 0 && it.playWhenReady } == true

    private fun withController(block: (MediaController) -> Unit) {
        controller?.let { return block(it) }
        pending += block
        if (connecting) return
        connecting = true
        val token = SessionToken(context, ComponentName(context, LocalPlayerService::class.java))
        val future = MediaController.Builder(context, token).buildAsync()
        future.addListener({
            connecting = false
            val c = try {
                future.get()
            } catch (e: Exception) {
                pending.clear()
                return@addListener
            }
            controller = c
            c.addListener(listener)
            pending.toList().forEach { it(c) }
            pending.clear()
        }, ContextCompat.getMainExecutor(context))
    }

    fun play(items: List<QueueItemK>, startAt: Int, repeatOne: Boolean) {
        runItems = items
        val media = items.map { toMediaItem(it) }
        withController { c ->
            LocalPlayerService.instance?.resetRun()
            c.repeatMode = if (repeatOne) Player.REPEAT_MODE_ONE else Player.REPEAT_MODE_OFF
            c.setMediaItems(media, startAt, 0)
            c.prepare()
            c.play()
        }
    }

    fun resume() = withController { it.play() }
    fun pause() = controller?.pause() ?: Unit
    fun seekTo(ms: Long) = controller?.seekTo(ms) ?: Unit
    fun next() = controller?.seekToNextMediaItem() ?: Unit
    fun previous() = controller?.seekToPrevious() ?: Unit
    fun setRepeatOne(on: Boolean) {
        controller?.repeatMode = if (on) Player.REPEAT_MODE_ONE else Player.REPEAT_MODE_OFF
    }

    fun applySettings(s: AudioSettingsK) {
        LocalPlayerService.instance?.applySettings(s)
    }

    /** LocalPlayerService swapped players after a crossfade: indices restart at the incoming song. */
    fun onPlayerSwapped() = report()

    private fun runIndex(c: MediaController): Int = (LocalPlayerService.instance?.runOffset ?: 0) + c.currentMediaItemIndex

    private val listener = object : Player.Listener {
        override fun onEvents(player: Player, events: Player.Events) {
            if (events.contains(Player.EVENT_MEDIA_ITEM_TRANSITION)) {
                controller?.let { KantaCore.engine.onLocalItem(runIndex(it)) }
            }
            if (events.contains(Player.EVENT_PLAYBACK_STATE_CHANGED) && player.playbackState == Player.STATE_ENDED) {
                KantaCore.engine.onLocalRunEnded()
            }
            report()
        }
    }

    private fun report() {
        val c = controller ?: return KantaCore.watcher.onLocal(null, null, null)
        val item = c.currentMediaItem
        if (item == null || c.playbackState == Player.STATE_IDLE) return KantaCore.watcher.onLocal(null, null, null)
        val m = item.mediaMetadata
        val state = when {
            c.playbackState == Player.STATE_BUFFERING -> PS.BUFFERING
            c.isPlaying -> PS.PLAYING
            c.playbackState == Player.STATE_ENDED -> PS.STOPPED
            else -> PS.PAUSED
        }
        val snap = SessionSnapshot(
            pkg = context.packageName,
            state = state,
            title = m.title?.toString(),
            artist = m.artist?.toString(),
            album = m.albumTitle?.toString(),
            durationMs = c.duration.takeIf { it != C.TIME_UNSET } ?: 0,
            positionMs = c.currentPosition,
            updatedAt = System.currentTimeMillis(),
            mediaId = item.localConfiguration?.uri?.toString() ?: item.mediaId,
        )
        KantaCore.watcher.onLocal(snap, artworkFor(item), formatOf(c.currentTracks))
    }

    private fun toMediaItem(q: QueueItemK): MediaItem = MediaItem.Builder()
        .setUri(q.link)
        .setMediaId(q.trackId)
        .setMediaMetadata(
            MediaMetadata.Builder().setTitle(q.title).setArtist(q.artist).build(),
        )
        .build()

    /** Album art from MediaStore (the file's own embedded art shows on the lock screen via Media3). */
    private fun artworkFor(item: MediaItem): String? {
        val uri = item.localConfiguration?.uri ?: return null
        val key = uri.toString()
        return artCache.getOrPut(key) {
            try {
                context.contentResolver.query(uri, arrayOf(MediaStore.Audio.Media.ALBUM_ID), null, null, null)?.use {
                    if (it.moveToFirst()) {
                        ContentUris.withAppendedId(Uri.parse("content://media/external/audio/albumart"), it.getLong(0)).toString()
                    } else null
                }
            } catch (_: Exception) {
                null
            }
        }
    }

    private fun formatOf(tracks: Tracks): String? {
        for (g in tracks.groups) {
            if (g.type != C.TRACK_TYPE_AUDIO || !g.isSelected) continue
            for (i in 0 until g.length) {
                if (!g.isTrackSelected(i)) continue
                val f = g.getTrackFormat(i)
                val bits = when (f.pcmEncoding) {
                    C.ENCODING_PCM_16BIT -> 16
                    C.ENCODING_PCM_24BIT -> 24
                    C.ENCODING_PCM_32BIT, C.ENCODING_PCM_FLOAT -> 32
                    else -> null
                }
                return AudioMath.formatLabel(f.sampleMimeType, bits, f.sampleRate.takeIf { it > 0 })
            }
        }
        return null
    }
}
