package com.kanta.media

import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class QueueRulesTest {
    private val yellow = QueueItemK("t1", "spotify", "https://open.spotify.com/track/x", "Yellow", "Coldplay", 266_000)

    private fun snap(title: String, pos: Long, state: Int = PS.PLAYING, at: Long = 0, dur: Long = 266_000, artist: String = "Coldplay") =
        SessionSnapshot(SessionPick.SPOTIFY, state, title, artist, null, dur, pos, at, null)

    @Test fun sameSongVariants() {
        for (t in listOf("Yellow", "Yellow - Remastered 2021", "Yellow (Official Audio)", "YELLOW")) {
            assertTrue(t, QueueRules.isSameSong(yellow, t, "Coldplay"))
        }
        for (a in listOf("Coldplay - Topic", "Coldplay, Someone", "ColdplayVEVO")) {
            assertTrue(a, QueueRules.isSameSong(yellow, "Yellow", a))
        }
        assertFalse(QueueRules.isSameSong(yellow, "Fix You", "Coldplay"))
        assertFalse(QueueRules.isSameSong(yellow, null, "Coldplay"))
    }

    @Test fun shuffleStartsWithChosenSong() {
        val o = QueueRules.shuffleOrder(5, 2, 42)
        assertEquals(2, o[0])
        assertEquals((0..4).toList(), o.sorted())
        assertArrayEquals(o, QueueRules.shuffleOrder(5, 2, 42))
    }

    @Test fun nextIndexRepeatModes() {
        val order = intArrayOf(0, 1, 2)
        assertNull(QueueRules.nextIndex(order, 2, Repeat.OFF))
        assertEquals(0, QueueRules.nextIndex(order, 2, Repeat.ALL))
        assertEquals(2, QueueRules.nextIndex(order, 2, Repeat.ONE))
        assertEquals(1, QueueRules.nextIndex(order, 0, Repeat.OFF))
        assertEquals(2, QueueRules.prevIndex(order, 0, Repeat.ALL))
        assertEquals(0, QueueRules.prevIndex(order, 0, Repeat.OFF))
    }

    @Test fun classifyTransitions() {
        // Song switched within 3 s of the end → ended.
        val prevNearEnd = snap("Yellow", 264_000, at = 1_000)
        assertEquals(Transition.SongEnded, QueueRules.classify(prevNearEnd, snap("Fix You", 0, at = 1_500), yellow, 3000))
        // Switched early → user skipped in the app.
        val prevEarly = snap("Yellow", 60_000, at = 1_000)
        assertEquals(Transition.UserSkippedInApp, QueueRules.classify(prevEarly, snap("Fix You", 0, at = 1_500), yellow, 3000))
        // Same song, stopped.
        assertEquals(Transition.Stopped, QueueRules.classify(prevEarly, snap("Yellow", 60_000, PS.STOPPED), yellow, 3000))
        // Same song, title varies → still the same.
        assertEquals(Transition.SameSong, QueueRules.classify(prevEarly, snap("Yellow - Remastered 2021", 61_000), yellow, 3000))
        // Paused at the very end → ended.
        assertEquals(Transition.SongEnded, QueueRules.classify(prevEarly, snap("Yellow", 265_500, PS.PAUSED), yellow, 3000))
        // Extrapolated position counts: last report at 250 s while playing, switch 15 s later.
        assertEquals(Transition.SongEnded, QueueRules.classify(snap("Yellow", 250_000, at = 0), snap("Fix You", 0, at = 15_000), yellow, 3000))
    }

    @Test fun pickActiveSession() {
        val paused = SessionSnapshot(SessionPick.YTMUSIC, PS.PAUSED, "A", "x", null, 1, 0, 50, null)
        val playing = SessionSnapshot(SessionPick.SPOTIFY, PS.PLAYING, "B", "x", null, 1, 0, 10, null)
        val other = SessionSnapshot("com.other.app", PS.PLAYING, "C", "x", null, 1, 0, 99, null)
        val untitled = SessionSnapshot(SessionPick.APPLEMUSIC, PS.PLAYING, null, null, null, 1, 0, 99, null)
        assertEquals(playing, SessionPick.pickActiveSession(listOf(paused, playing, other, untitled)))
        val paused2 = paused.copy(pkg = SessionPick.APPLEMUSIC, updatedAt = 60)
        assertEquals(paused2, SessionPick.pickActiveSession(listOf(paused, paused2)))
        assertNull(SessionPick.pickActiveSession(emptyList()))
    }

    @Test fun mediaIds() {
        assertEquals("abc", SessionPick.sourceIdFromMediaId("spotify", "spotify:track:abc"))
        assertEquals("dQw4w9WgXcQ", SessionPick.sourceIdFromMediaId("ytmusic", "dQw4w9WgXcQ"))
        assertNull(SessionPick.sourceIdFromMediaId("applemusic", "123"))
    }
}
