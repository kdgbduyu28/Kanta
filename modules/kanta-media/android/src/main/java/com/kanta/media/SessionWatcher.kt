package com.kanta.media

import android.content.ComponentName
import android.content.Context
import android.graphics.Bitmap
import android.media.MediaMetadata
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.os.SystemClock
import android.util.Log

/**
 * Follows the media sessions of Spotify, YouTube Music and Apple Music (needs notification access),
 * plus Kanta's own local player, and tells JS, the queue engine and the history logger.
 */
class SessionWatcher(private val context: Context) {
    private val msm = context.getSystemService(MediaSessionManager::class.java)
    private val ownPkg = context.packageName
    private val artwork = ArtworkCache(context)
    private val callbacks = mutableMapOf<MediaController, MediaController.Callback>()
    private val last = mutableMapOf<String, SessionSnapshot>()
    private val artUris = mutableMapOf<String, String?>()
    private var component: ComponentName? = null
    private var localSnap: SessionSnapshot? = null
    private var localFormat: String? = null
    private var lastEmit = 0L
    private var pendingEmit = false

    var controllers: List<MediaController> = emptyList()
        private set

    private val sessionsListener = MediaSessionManager.OnActiveSessionsChangedListener { list -> attach(list ?: emptyList()) }

    fun start(listener: ComponentName) {
        component = listener
        try {
            msm.addOnActiveSessionsChangedListener(sessionsListener, listener, KantaCore.main)
            attach(msm.getActiveSessions(listener))
        } catch (e: SecurityException) {
            Log.w(TAG, "no notification access", e)
        }
    }

    fun stop() {
        try {
            msm.removeOnActiveSessionsChangedListener(sessionsListener)
        } catch (_: Exception) {
        }
        callbacks.forEach { (c, cb) -> c.unregisterCallback(cb) }
        callbacks.clear()
        controllers = emptyList()
        component = null
        emitNow()
    }

    val hasAccess: Boolean get() = component != null

    private fun attach(list: List<MediaController>) {
        callbacks.forEach { (c, cb) -> c.unregisterCallback(cb) }
        callbacks.clear()
        // Kanta's own local player reports itself directly (see onLocal), so skip its session here.
        controllers = list.filter { SessionPick.sourceFor(it.packageName) != null }
        for (c in controllers) {
            val cb = object : MediaController.Callback() {
                override fun onPlaybackStateChanged(state: PlaybackState?) = changed(c)
                override fun onMetadataChanged(metadata: MediaMetadata?) = changed(c)
                override fun onSessionDestroyed() {
                    last.remove(c.packageName)
                    scheduleEmit()
                }
            }
            c.registerCallback(cb, KantaCore.main)
            callbacks[c] = cb
            changed(c)
        }
        scheduleEmit()
    }

    fun controllerFor(pkg: String): MediaController? = controllers.firstOrNull { it.packageName == pkg }

    private fun snapshotOf(c: MediaController): SessionSnapshot {
        val m = c.metadata
        val p = c.playbackState
        // PlaybackState positions are relative to the elapsed-realtime clock; convert to wall time.
        val updatedAt = if (p != null) System.currentTimeMillis() - (SystemClock.elapsedRealtime() - p.lastPositionUpdateTime) else System.currentTimeMillis()
        return SessionSnapshot(
            pkg = c.packageName,
            state = p?.state ?: PS.NONE,
            title = m?.getString(MediaMetadata.METADATA_KEY_TITLE),
            artist = m?.getString(MediaMetadata.METADATA_KEY_ARTIST) ?: m?.getString(MediaMetadata.METADATA_KEY_ALBUM_ARTIST),
            album = m?.getString(MediaMetadata.METADATA_KEY_ALBUM),
            durationMs = m?.getLong(MediaMetadata.METADATA_KEY_DURATION)?.coerceAtLeast(0) ?: 0,
            positionMs = p?.position?.coerceAtLeast(0) ?: 0,
            updatedAt = updatedAt,
            mediaId = m?.getString(MediaMetadata.METADATA_KEY_MEDIA_ID),
            speed = p?.playbackSpeed?.takeIf { it > 0f } ?: 1f,
        )
    }

    private fun changed(c: MediaController) {
        val s = snapshotOf(c)
        val prev = last[s.pkg]
        last[s.pkg] = s
        val key = "${s.pkg}|${s.title}|${s.artist}"
        if (!artUris.containsKey(key)) {
            val bmp: Bitmap? = c.metadata?.let {
                it.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART) ?: it.getBitmap(MediaMetadata.METADATA_KEY_ART)
            }
            if (bmp != null) artUris[key] = artwork.save(bmp, key)
            else c.metadata?.getString(MediaMetadata.METADATA_KEY_ALBUM_ART_URI)?.let { artUris[key] = it }
        }
        KantaCore.engine.onSnapshot(prev, s)
        KantaCore.history.onSnapshot(s)
        scheduleEmit()
    }

    /** Called by LocalPlayback whenever the local player changes. */
    fun onLocal(s: SessionSnapshot?, artworkUri: String?, format: String?) {
        val prev = localSnap
        localSnap = s
        localFormat = format
        if (s != null) {
            artUris["$ownPkg|${s.title}|${s.artist}"] = artworkUri
            KantaCore.engine.onSnapshot(prev, s)
            KantaCore.history.onSnapshot(s)
        }
        scheduleEmit()
    }

    fun snapshots(): List<SessionSnapshot> = last.values.toList() + listOfNotNull(localSnap)

    fun picked(): SessionSnapshot? = SessionPick.pickActiveSession(snapshots(), ownPkg)

    /** The NowPlaying object sent to JS, or null. */
    fun nowPlaying(): Map<String, Any?>? {
        val s = picked() ?: return null
        val source = SessionPick.sourceFor(s.pkg, ownPkg) ?: return null
        val state = when (s.state) {
            PS.PLAYING -> "playing"
            PS.BUFFERING -> "buffering"
            PS.PAUSED -> "paused"
            else -> "stopped"
        }
        val now = System.currentTimeMillis()
        return mapOf(
            "source" to source,
            "title" to (s.title ?: ""),
            "artist" to (s.artist ?: ""),
            "album" to s.album,
            "durationMs" to s.durationMs.toDouble(),
            "positionMs" to s.positionAt(now).toDouble(),
            "positionAt" to now.toDouble(),
            "state" to state,
            "artworkUri" to artUris["${s.pkg}|${s.title}|${s.artist}"],
            "mediaId" to s.mediaId,
            "format" to if (source == "local") localFormat else null,
        )
    }

    /** At most ~4 events per second; JS extrapolates position in between. */
    private fun scheduleEmit() {
        val wait = 250 - (SystemClock.uptimeMillis() - lastEmit)
        if (wait <= 0) return emitNow()
        if (pendingEmit) return
        pendingEmit = true
        KantaCore.main.postDelayed({ pendingEmit = false; emitNow() }, wait)
    }

    private fun emitNow() {
        lastEmit = SystemClock.uptimeMillis()
        KantaCore.emit("nowPlaying", nowPlaying())
    }

    // Controls go to the session Now Playing shows.
    private fun target(): MediaController? = picked()?.let { controllerFor(it.pkg) }

    fun play() = target()?.transportControls?.play()
    fun pause() = target()?.transportControls?.pause()
    fun next() = target()?.transportControls?.skipToNext()
    fun previous() = target()?.transportControls?.skipToPrevious()
    fun seekTo(ms: Long) = target()?.transportControls?.seekTo(ms)

    fun pausePkg(pkg: String) = controllerFor(pkg)?.transportControls?.pause()
    fun playPkg(pkg: String) = controllerFor(pkg)?.transportControls?.play()
    fun snapshotFor(pkg: String): SessionSnapshot? = if (pkg == ownPkg) localSnap else last[pkg]
}
