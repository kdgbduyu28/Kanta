package com.kanta.media

import java.text.Normalizer
import java.util.Random

/** One song in Kanta's queue (mirror of the JS QueueItem). */
data class QueueItemK(
    val trackId: String,
    val source: String,
    val link: String,
    val title: String,
    val artist: String,
    val durationMs: Long,
)

enum class Repeat {
    OFF, ALL, ONE;

    val js: String get() = name.lowercase()

    companion object {
        fun from(s: String?): Repeat = when (s) {
            "all" -> ALL
            "one" -> ONE
            else -> OFF
        }
    }
}

/** Android PlaybackState values used here (kept as ints so these rules test without Android). */
object PS {
    const val NONE = 0
    const val STOPPED = 1
    const val PAUSED = 2
    const val PLAYING = 3
    const val BUFFERING = 6
}

/** A media session at one moment. Pure data: built by SessionWatcher, read by rules and tests. */
data class SessionSnapshot(
    val pkg: String,
    val state: Int,
    val title: String?,
    val artist: String?,
    val album: String?,
    val durationMs: Long,
    val positionMs: Long,
    val updatedAt: Long,
    val mediaId: String?,
    val speed: Float = 1f,
) {
    val playing: Boolean get() = state == PS.PLAYING || state == PS.BUFFERING

    /** Position extrapolated to `now` while playing. */
    fun positionAt(now: Long): Long {
        val p = if (state == PS.PLAYING) positionMs + ((now - updatedAt).coerceAtLeast(0) * speed).toLong() else positionMs
        return if (durationMs > 0) p.coerceAtMost(durationMs) else p
    }
}

sealed class Transition {
    /** The queued song finished and the app moved on (or stopped at the end). */
    object SongEnded : Transition()
    /** The app switched songs early: someone pressed next/previous in the app or on the lock screen. */
    object UserSkippedInApp : Transition()
    /** Still the queued song. */
    object SameSong : Transition()
    /** The queued song was stopped. */
    object Stopped : Transition()
}

object QueueRules {
    private val NOISE = Regex(
        "\\s*[(\\[]\\s*(official|lyric|lyrics|audio|video|visualizer|music video|hd|hq|explicit|clean)[^)\\]]*[)\\]]",
        RegexOption.IGNORE_CASE,
    )
    private val SUFFIX = Regex(
        "\\s+-\\s+(remaster(ed)?|\\d{4} remaster(ed)?|remaster(ed)? \\d{4}|single version|radio edit|mono|stereo)( version)?$",
        RegexOption.IGNORE_CASE,
    )
    private val NON_WORD = Regex("[^\\p{L}\\p{N}]+")
    private val ARTIST_SPLIT = Regex(",|&| feat\\.? | ft\\.? | x ", RegexOption.IGNORE_CASE)

    fun stripAccents(s: String): String =
        Normalizer.normalize(s, Normalizer.Form.NFD).replace(Regex("\\p{Mn}+"), "")

    /** Same rules as src/lib/normalize.ts. */
    fun normalizeTitle(s: String): String =
        stripAccents(s).replace(NOISE, "").replace(SUFFIX, "").lowercase().replace(NON_WORD, " ").trim()

    fun normalizeArtist(s: String): String {
        val main = stripAccents(s)
            .replace(Regex("\\s+-\\s+topic$", RegexOption.IGNORE_CASE), "")
            .replace(Regex("vevo$", RegexOption.IGNORE_CASE), "")
            .split(ARTIST_SPLIT)[0]
        return main.lowercase().replace(NON_WORD, " ").trim()
    }

    fun isSameSong(expected: QueueItemK, seenTitle: String?, seenArtist: String?): Boolean {
        if (seenTitle.isNullOrBlank()) return false
        val et = normalizeTitle(expected.title)
        val st = normalizeTitle(seenTitle)
        if (et.isEmpty() || st.isEmpty()) return false
        val titleOk = et == st || st.startsWith("$et ") || et.startsWith("$st ")
        if (!titleOk) return false
        val ea = normalizeArtist(expected.artist)
        val sa = normalizeArtist(seenArtist ?: "")
        // Placeholder titles saved offline have no artist; trust the title then.
        return ea.isEmpty() || sa.isEmpty() || ea == sa || ea.contains(sa) || sa.contains(ea)
    }

    /** Play order for shuffle: the chosen song first, the rest shuffled with `seed`. */
    fun shuffleOrder(size: Int, startIndex: Int, seed: Long): IntArray {
        if (size <= 0) return IntArray(0)
        val start = startIndex.coerceIn(0, size - 1)
        val rest = (0 until size).filter { it != start }.toMutableList()
        val rnd = Random(seed)
        for (i in rest.size - 1 downTo 1) {
            val j = rnd.nextInt(i + 1)
            val t = rest[i]; rest[i] = rest[j]; rest[j] = t
        }
        return (listOf(start) + rest).toIntArray()
    }

    /** Next cursor position in `order`, or null when the queue is finished. */
    fun nextIndex(order: IntArray, cursor: Int, repeat: Repeat): Int? = when {
        order.isEmpty() -> null
        repeat == Repeat.ONE -> cursor
        cursor + 1 < order.size -> cursor + 1
        repeat == Repeat.ALL -> 0
        else -> null
    }

    fun prevIndex(order: IntArray, cursor: Int, repeat: Repeat): Int = when {
        order.isEmpty() -> 0
        repeat == Repeat.ONE -> cursor
        cursor - 1 >= 0 -> cursor - 1
        repeat == Repeat.ALL -> order.size - 1
        else -> 0
    }

    /**
     * What happened to the queued song between two snapshots of its app's session.
     * `endWindowMs`: how close to the end a song must be to count as finished (Phase 0 check 6).
     */
    fun classify(prev: SessionSnapshot?, cur: SessionSnapshot, expected: QueueItemK, endWindowMs: Long): Transition {
        if (isSameSong(expected, cur.title, cur.artist)) {
            if (cur.state == PS.STOPPED) return Transition.Stopped
            val nearEnd = cur.durationMs > 0 && cur.positionMs >= cur.durationMs - 1500
            return if (cur.state == PS.PAUSED && nearEnd) Transition.SongEnded else Transition.SameSong
        }
        if (prev == null || !isSameSong(expected, prev.title, prev.artist)) return Transition.UserSkippedInApp
        val duration = if (prev.durationMs > 0) prev.durationMs else expected.durationMs
        val lastPos = prev.positionAt(cur.updatedAt)
        return if (duration > 0 && lastPos >= duration - endWindowMs) Transition.SongEnded else Transition.UserSkippedInApp
    }
}
