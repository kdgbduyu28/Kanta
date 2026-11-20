package com.kanta.media

/**
 * Writes a `plays` row for every song heard for 30 s or more, in any of the apps,
 * even while Kanta's screens are closed.
 */
class HistoryLogger {
    private data class Current(
        val source: String,
        val title: String,
        val artist: String,
        val mediaId: String?,
        val startedAt: Long,
        var listenedMs: Long = 0,
        var playingSince: Long? = null,
    )

    private val current = mutableMapOf<String, Current>()

    companion object {
        const val MIN_LISTEN_MS = 30_000L
        fun shouldLog(listenedMs: Long) = listenedMs >= MIN_LISTEN_MS
    }

    fun onSnapshot(s: SessionSnapshot, now: Long = System.currentTimeMillis()) {
        val source = SessionPick.sourceFor(s.pkg, KantaCore.app.packageName) ?: return
        val title = s.title ?: return
        val artist = s.artist ?: ""
        var c = current[s.pkg]
        if (c != null && (c.title != title || c.artist != artist)) {
            finish(s.pkg, now)
            c = null
        }
        if (c == null) {
            c = Current(source, title, artist, s.mediaId, now)
            current[s.pkg] = c
        }
        if (s.playing) {
            if (c.playingSince == null) c.playingSince = now
        } else {
            c.playingSince?.let { c.listenedMs += now - it }
            c.playingSince = null
            if (s.state == PS.STOPPED || s.state == PS.NONE) finish(s.pkg, now)
        }
    }

    private fun finish(pkg: String, now: Long) {
        val c = current.remove(pkg) ?: return
        c.playingSince?.let { c.listenedMs += now - it }
        if (!shouldLog(c.listenedMs) || !KantaCore.historyEnabled) return
        val db = KantaCore.db
        val trackId = db.findTrackId(c.source, SessionPick.sourceIdFromMediaId(c.source, c.mediaId), c.title, c.artist)
        db.insertPlay(trackId, c.source, c.title, c.artist, c.startedAt, c.listenedMs)
        KantaCore.emit("historyChanged", null)
    }

    /** Flush everything (service shutting down). */
    fun flush() {
        val now = System.currentTimeMillis()
        current.keys.toList().forEach { finish(it, now) }
    }
}
