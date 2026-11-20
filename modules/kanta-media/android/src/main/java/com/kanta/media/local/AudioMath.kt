package com.kanta.media.local

import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.log10
import kotlin.math.pow
import kotlin.math.sin

/** Pure audio helpers (unit-tested). */
object AudioMath {
    val EQ_FREQS_HZ = floatArrayOf(60f, 150f, 400f, 1000f, 2400f, 6000f, 10000f, 14000f, 16000f)

    fun clampDb(db: Float): Float = db.coerceIn(-12f, 12f)

    /** ReplayGain dB → linear volume, never louder than the track's peak allows. */
    fun replayGainToLinear(gainDb: Float, peak: Float): Float {
        val linear = 10f.pow(gainDb / 20f)
        val maxByPeak = if (peak > 0f) 1f / peak else Float.MAX_VALUE
        return minOf(linear, maxByPeak)
    }

    /** Balance -1 (left) .. 1 (right) → (left dB, right dB); the far side is turned down, -60 = muted. */
    fun balanceGains(balance: Float): Pair<Float, Float> {
        val b = balance.coerceIn(-1f, 1f)
        fun atten(x: Float): Float = if (x >= 1f) -60f else (20f * log10(1f - x)).coerceAtLeast(-60f)
        return when {
            b > 0f -> atten(b) to 0f
            b < 0f -> 0f to atten(-b)
            else -> 0f to 0f
        }
    }

    /** Equal-power crossfade: (outgoing volume, incoming volume). */
    fun crossfadeVolumes(elapsedMs: Long, fadeMs: Long): Pair<Float, Float> {
        if (fadeMs <= 0) return 0f to 1f
        val x = (elapsedMs.toFloat() / fadeMs).coerceIn(0f, 1f)
        return cos(x * PI / 2).toFloat() to sin(x * PI / 2).toFloat()
    }

    /** "FLAC · 24-bit/96 kHz", "MP3 · 44.1 kHz", or null when nothing is known. */
    fun formatLabel(mime: String?, bitsPerSample: Int?, sampleRateHz: Int?): String? {
        val name = when (mime?.lowercase()) {
            null -> null
            "audio/flac", "audio/x-flac" -> "FLAC"
            "audio/mpeg", "audio/mp3" -> "MP3"
            "audio/mp4a-latm", "audio/aac", "audio/mp4" -> "AAC"
            "audio/alac" -> "ALAC"
            "audio/opus" -> "Opus"
            "audio/ogg", "audio/vorbis" -> "OGG"
            "audio/wav", "audio/x-wav", "audio/raw" -> "WAV"
            else -> mime.substringAfter('/').uppercase()
        }
        val rate = sampleRateHz?.takeIf { it > 0 }?.let {
            val k = it / 1000.0
            (if (k % 1.0 == 0.0) k.toInt().toString() else "%.1f".format(java.util.Locale.US, k)) + " kHz"
        }
        val quality = when {
            bitsPerSample != null && bitsPerSample > 0 && rate != null -> "$bitsPerSample-bit/$rate"
            rate != null -> rate
            else -> null
        }
        return listOfNotNull(name, quality).joinToString(" · ").ifEmpty { null }
    }
}
