package com.kanta.media

import com.kanta.media.local.AudioMath
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class AudioMathTest {
    @Test fun clampAndReplayGain() {
        assertEquals(12f, AudioMath.clampDb(15f))
        assertEquals(-12f, AudioMath.clampDb(-20f))
        assertEquals(0.501f, AudioMath.replayGainToLinear(-6f, 1f), 0.001f)
        assertTrue(AudioMath.replayGainToLinear(6f, 0.9f) <= 1f / 0.9f + 1e-6f)
    }

    @Test fun balance() {
        assertEquals(0f to 0f, AudioMath.balanceGains(0f))
        assertEquals(-60f to 0f, AudioMath.balanceGains(1f))
        assertEquals(0f to -60f, AudioMath.balanceGains(-1f))
    }

    @Test fun crossfade() {
        assertEquals(1f to 0f, AudioMath.crossfadeVolumes(0, 5000))
        val end = AudioMath.crossfadeVolumes(5000, 5000)
        assertEquals(0f, end.first, 1e-6f)
        assertEquals(1f, end.second, 1e-6f)
        val mid = AudioMath.crossfadeVolumes(2500, 5000)
        assertEquals(0.707f, mid.first, 0.01f)
        assertEquals(0.707f, mid.second, 0.01f)
        assertEquals(0f to 1f, AudioMath.crossfadeVolumes(100, 0))
    }

    @Test fun formatLabels() {
        assertEquals("FLAC · 24-bit/96 kHz", AudioMath.formatLabel("audio/flac", 24, 96000))
        assertEquals("MP3 · 44.1 kHz", AudioMath.formatLabel("audio/mpeg", null, 44100))
        assertEquals("AAC · 16-bit/48 kHz", AudioMath.formatLabel("audio/mp4a-latm", 16, 48000))
        assertNull(AudioMath.formatLabel(null, null, null))
    }
}
