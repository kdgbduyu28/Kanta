package com.kanta.media.local

import android.media.audiofx.DynamicsProcessing
import android.util.Log
import com.kanta.media.TAG

/**
 * The PDF's equalizer, balance and volume normalization for local playback, on one
 * DynamicsProcessing effect per audio session (9 real bands, unlike the old 5-band Equalizer).
 */
class AudioFx(audioSessionId: Int) {
    private val dp: DynamicsProcessing? = try {
        val config = DynamicsProcessing.Config.Builder(
            DynamicsProcessing.VARIANT_FAVOR_FREQUENCY_RESOLUTION,
            /* channelCount */ 2,
            /* preEqInUse */ false, 0,
            /* mbcInUse */ false, 0,
            /* postEqInUse */ true, AudioMath.EQ_FREQS_HZ.size,
            /* limiterInUse */ true,
        ).build()
        DynamicsProcessing(0, audioSessionId, config).apply { enabled = true }
    } catch (e: Exception) {
        Log.w(TAG, "DynamicsProcessing unavailable", e)
        null
    }

    fun apply(s: AudioSettingsK) {
        val d = dp ?: return
        try {
            val eq = DynamicsProcessing.Eq(true, s.eqEnabled, AudioMath.EQ_FREQS_HZ.size)
            AudioMath.EQ_FREQS_HZ.forEachIndexed { i, f ->
                // A band's cutoff is its upper edge; halfway to the next centre keeps each band on its label.
                val next = AudioMath.EQ_FREQS_HZ.getOrNull(i + 1) ?: 20000f
                val cutoff = (f + next) / 2f
                eq.setBand(i, DynamicsProcessing.EqBand(s.eqEnabled, cutoff, if (s.eqEnabled) AudioMath.clampDb(s.eqGainsDb[i]) else 0f))
            }
            d.setPostEqAllChannelsTo(eq)

            // Normalization: a gentle limiter so loud tracks don't jump out (ReplayGain is applied as volume).
            d.setLimiterAllChannelsTo(
                DynamicsProcessing.Limiter(true, s.normalize, 0, 1f, 60f, 10f, -3f, 0f),
            )

            val (l, r) = AudioMath.balanceGains(s.balance)
            d.setInputGainbyChannel(0, l)
            d.setInputGainbyChannel(1, r)
        } catch (e: Exception) {
            Log.w(TAG, "AudioFx apply failed", e)
        }
    }

    fun release() {
        try {
            dp?.release()
        } catch (_: Exception) {
        }
    }
}
