package com.kanta.media

import android.content.Context
import android.widget.Toast

/**
 * Kanta's own queue across apps. Lives in the process (driven by the listener service's session
 * events), so it keeps going with Kanta's screens closed. See spec §5.3.
 */
class QueueEngine(private val context: Context) {
    private val starter = Starter(context)
    private val notifier = UpNextNotifier(context)

    private var items = mutableListOf<QueueItemK>()
    private var order = IntArray(0)
    private var cursor = -1
    private var shuffle = false
    private var repeat = Repeat.OFF

    /** True while Kanta's queue is driving playback; false once the user plays something else. */
    private var active = false
    private var startedAt = 0L
    private var startedPkg: String? = null
    private var awaitingTap: QueueItemK? = null
    private var localRunStart = -1
    private var localRunLen = 0

    /** How close to the end a song must be to count as finished (tune from Phase 0 check 6). */
    private val endWindowMs: Long get() = KantaCore.prefs.getLong("endWindowMs", 3000)

    private fun now() = System.currentTimeMillis()

    fun current(): QueueItemK? = order.getOrNull(cursor)?.let { items.getOrNull(it) }

    fun restore() {
        val q = KantaCore.db.loadQueue() ?: return
        items = q.items.toMutableList()
        order = q.order
        cursor = q.cursor.coerceIn(-1, order.size - 1)
        shuffle = q.shuffle
        repeat = q.repeat
        active = false
        emitState()
    }

    // ---- Commands from JS ----

    fun setQueue(newItems: List<QueueItemK>, startIndex: Int) {
        if (newItems.isEmpty()) return
        items = newItems.toMutableList()
        val start = startIndex.coerceIn(0, items.size - 1)
        order = if (shuffle) QueueRules.shuffleOrder(items.size, start, now()) else IntArray(items.size) { it }
        cursor = order.indexOf(start)
        active = true
        persist()
        startCurrent(fromForeground = true)
    }

    fun insertNext(item: QueueItemK) {
        if (items.isEmpty() || cursor < 0) return setQueue(listOf(item), 0)
        items.add(item)
        val idx = items.size - 1
        order = order.toMutableList().apply { add(cursor + 1, idx) }.toIntArray()
        persist()
        emitState()
        // Spotify kit: line it up inside Spotify too when it's the very next song.
        if (item.source == "spotify" && current()?.source == "spotify" && SpotifyRemote.isConnected) {
            SpotifyRemote.queue(spotifyUri(item.link))
        }
    }

    fun jumpTo(position: Int) {
        if (position !in order.indices) return
        cursor = position
        active = true
        persist()
        startCurrent(fromForeground = true)
    }

    fun setShuffle(on: Boolean) {
        if (on == shuffle) return
        shuffle = on
        val cur = order.getOrNull(cursor)
        if (cur != null) {
            order = if (on) QueueRules.shuffleOrder(items.size, cur, now()) else IntArray(items.size) { it }
            cursor = order.indexOf(cur)
        }
        persist()
        emitState()
    }

    fun setRepeat(r: Repeat) {
        repeat = r
        KantaCore.local.setRepeatOne(r == Repeat.ONE)
        persist()
        emitState()
    }

    fun next() {
        if (!active) return routeOrLocal({ KantaCore.local.next() }) { KantaCore.watcher.next() }
        // A tap on "next" always moves on, even with repeat-one.
        val n = QueueRules.nextIndex(order, cursor, if (repeat == Repeat.ONE) Repeat.ALL else repeat) ?: return
        cursor = n
        persist()
        startCurrent(fromForeground = KantaCore.appVisible)
    }

    fun previous() {
        if (!active) return routeOrLocal({ KantaCore.local.previous() }) { KantaCore.watcher.previous() }
        val s = currentSnapshot()
        if (s != null && s.positionAt(now()) > 3000) return seekTo(0)
        cursor = QueueRules.prevIndex(order, cursor, if (repeat == Repeat.ONE) Repeat.ALL else repeat)
        persist()
        startCurrent(fromForeground = KantaCore.appVisible)
    }

    fun play() {
        val item = current()
        if (active && awaitingTap != null && item != null) {
            // The "Up next" song hasn't started yet: start it now (we're in the foreground).
            return startCurrent(fromForeground = true)
        }
        routeOrLocal({ KantaCore.local.resume() }) { KantaCore.watcher.play() }
    }

    fun pause() = routeOrLocal({ KantaCore.local.pause() }) { KantaCore.watcher.pause() }

    fun seekTo(ms: Long) = routeOrLocal({ KantaCore.local.seekTo(ms) }) { KantaCore.watcher.seekTo(ms) }

    /** Sends a control to the local player when it is what Now Playing shows, else to the app's session. */
    private inline fun routeOrLocal(local: () -> Unit, other: () -> Unit) {
        val picked = KantaCore.watcher.picked()
        if (picked?.pkg == context.packageName) local() else other()
    }

    private fun currentSnapshot(): SessionSnapshot? {
        val item = current() ?: return null
        val pkg = if (item.source == "local") context.packageName else SessionPick.PACKAGES[item.source] ?: return null
        return KantaCore.watcher.snapshotFor(pkg)
    }

    // ---- Playing the current item ----

    private fun startCurrent(fromForeground: Boolean) {
        val item = current() ?: return
        startedAt = now()
        awaitingTap = null
        notifier.cancel()
        emitState()

        val pkg = if (item.source == "local") context.packageName else SessionPick.PACKAGES[item.source]
        // Stop whatever the queue was playing in another app.
        startedPkg?.takeIf { it != pkg && it != context.packageName }?.let { KantaCore.watcher.pausePkg(it) }
        if (item.source != "local" && KantaCore.local.isActive) KantaCore.local.pause()
        startedPkg = pkg

        if (item.source == "local") return startLocalRun()

        if (item.source == "spotify" && SpotifyRemote.isConnected) {
            SpotifyRemote.play(spotifyUri(item.link))
            queueAheadInSpotify()
            return
        }
        when (starter.start(item, fromForeground)) {
            Starter.Result.Started -> Unit
            Starter.Result.NeedsTap -> {
                awaitingTap = item
                notifier.post(item, starter)
            }
            Starter.Result.AppMissing -> {
                Toast.makeText(context, "Skipped ${item.title}: app isn't installed", Toast.LENGTH_SHORT).show()
                advanceAfterEnd(fromForeground)
            }
        }
    }

    /** Hands consecutive local songs to the Media3 player as one playlist (gapless, crossfade). */
    private fun startLocalRun() {
        val run = mutableListOf<QueueItemK>()
        var i = cursor
        while (i < order.size && run.size < 500) {
            val it = items[order[i]]
            if (it.source != "local") break
            run += it
            i++
        }
        localRunStart = cursor
        localRunLen = run.size
        KantaCore.local.play(run, 0, repeatOne = repeat == Repeat.ONE)
    }

    /** LocalPlayback: the player moved to song `index` of the current run. */
    fun onLocalItem(index: Int) {
        if (!active || localRunStart < 0) return
        val pos = localRunStart + index
        if (pos != cursor && pos in order.indices) {
            cursor = pos
            startedAt = now()
            persist()
            emitState()
        }
    }

    /** LocalPlayback: the run of local songs finished. */
    fun onLocalRunEnded() {
        if (!active || localRunStart < 0) return
        cursor = (localRunStart + localRunLen - 1).coerceIn(0, order.size - 1)
        localRunStart = -1
        advanceAfterEnd(fromForeground = KantaCore.appVisible)
    }

    private fun advanceAfterEnd(fromForeground: Boolean) {
        val n = QueueRules.nextIndex(order, cursor, repeat)
        if (n == null) {
            active = false
            emitState()
            return
        }
        cursor = n
        persist()
        startCurrent(fromForeground)
    }

    private fun queueAheadInSpotify() {
        val n = QueueRules.nextIndex(order, cursor, repeat) ?: return
        val next = items[order[n]]
        if (next.source == "spotify" && n != cursor) SpotifyRemote.queue(spotifyUri(next.link))
    }

    // ---- Following the apps ----

    fun onSnapshot(prev: SessionSnapshot?, cur: SessionSnapshot) {
        if (!active) return
        val item = current() ?: return
        if (item.source == "local") return // LocalPlayback reports its own transitions.
        val pkg = SessionPick.PACKAGES[item.source] ?: return

        if (cur.pkg != pkg) {
            // The user started something else in another app: Kanta's queue steps aside.
            if (cur.playing && cur.pkg != context.packageName && now() - startedAt > 8000) {
                active = false
                emitState()
            }
            return
        }
        if (awaitingTap != null && QueueRules.isSameSong(item, cur.title, cur.artist)) {
            awaitingTap = null
            notifier.cancel()
            startedAt = now()
        }
        if (awaitingTap != null) return
        // Give the app a moment to load the song before judging what it shows.
        if (now() - startedAt < 4000) return

        // Already on our next song (queued ahead in Spotify, or the app's autoplay happened to match).
        val n = QueueRules.nextIndex(order, cursor, repeat)
        if (n != null && n != cursor && QueueRules.isSameSong(items[order[n]], cur.title, cur.artist)) {
            cursor = n
            startedAt = now()
            persist()
            emitState()
            if (item.source == "spotify" && SpotifyRemote.isConnected) queueAheadInSpotify()
            return
        }

        when (QueueRules.classify(prev, cur, item, endWindowMs)) {
            Transition.SongEnded ->
                if (KantaCore.autoAdvance) advanceAfterEnd(KantaCore.appVisible) else {
                    active = false
                    emitState()
                }
            // Next/previous pressed in the app or on the lock screen: follow Kanta's queue (spec §5.3).
            Transition.UserSkippedInApp -> advanceAfterEnd(KantaCore.appVisible)
            Transition.Stopped, Transition.SameSong -> Unit
        }
    }

    // ---- State ----

    private fun persist() = KantaCore.db.saveQueue(items, order, cursor, shuffle, repeat)

    fun state(): Map<String, Any?> = mapOf(
        "index" to if (active || cursor >= 0) cursor else -1,
        "shuffle" to shuffle,
        "repeat" to repeat.js,
        "active" to active,
        "items" to order.map { items[it].toMap() },
    )

    private fun emitState() = KantaCore.emit("queueState", state())

    companion object {
        fun spotifyUri(link: String): String =
            Regex("open\\.spotify\\.com/(?:intl-[a-z-]+/)?(track|album|playlist)/([A-Za-z0-9]+)").find(link)
                ?.let { "spotify:${it.groupValues[1]}:${it.groupValues[2]}" } ?: link
    }
}

fun QueueItemK.toMap(): Map<String, Any?> = mapOf(
    "trackId" to trackId,
    "source" to source,
    "link" to link,
    "title" to title,
    "artist" to artist,
    "durationMs" to durationMs.toDouble(),
)
