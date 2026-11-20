package com.kanta.media.local

import android.content.Context
import android.media.AudioAttributes as PlatformAudioAttributes
import android.media.AudioDeviceInfo
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioMixerAttributes
import android.os.Build
import android.util.Log
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.audio.AudioSink
import androidx.media3.exoplayer.audio.DefaultAudioSink
import androidx.media3.common.audio.SonicAudioProcessor
import com.kanta.media.TAG

/**
 * The four Audio Quality choices (plan Task 7.3):
 *  auto      Media3 defaults
 *  high      resampled to 48 kHz, 16-bit (safe for Bluetooth)
 *  lossless  each file at its own rate, 16-bit PCM
 *  hires     float output (keeps 24-bit) + bit-perfect USB output on Android 14+ where offered
 */
@OptIn(UnstableApi::class)
object QualityMode {

    fun renderersFactory(context: Context, quality: String): DefaultRenderersFactory =
        object : DefaultRenderersFactory(context) {
            override fun buildAudioSink(context: Context, enableFloatOutput: Boolean, enableAudioTrackPlaybackParams: Boolean): AudioSink {
                val b = DefaultAudioSink.Builder(context)
                    .setEnableFloatOutput(quality == "hires")
                    .setEnableAudioTrackPlaybackParams(enableAudioTrackPlaybackParams)
                if (quality == "high") {
                    b.setAudioProcessors(arrayOf(SonicAudioProcessor().apply { setOutputSampleRateHz(48_000) }))
                }
                return b.build()
            }
        }.setExtensionRendererMode(DefaultRenderersFactory.EXTENSION_RENDERER_MODE_PREFER)

    /** Asks Android for bit-perfect output on a USB DAC (API 34+). Returns a note for the UI/log. */
    fun applyMixer(context: Context, quality: String): String? {
        if (Build.VERSION.SDK_INT < 34) return if (quality == "hires") "Bit-perfect output needs Android 14" else null
        val am = context.getSystemService(AudioManager::class.java)
        val attrs = PlatformAudioAttributes.Builder()
            .setUsage(PlatformAudioAttributes.USAGE_MEDIA)
            .setContentType(PlatformAudioAttributes.CONTENT_TYPE_MUSIC)
            .build()
        val usb = am.getDevices(AudioManager.GET_DEVICES_OUTPUTS).firstOrNull {
            it.type == AudioDeviceInfo.TYPE_USB_DEVICE || it.type == AudioDeviceInfo.TYPE_USB_HEADSET
        }
        return try {
            if (usb == null) {
                if (quality == "hires") "No USB DAC connected" else null
            } else if (quality != "hires") {
                am.clearPreferredMixerAttributes(attrs, usb)
                null
            } else {
                val best = am.getSupportedMixerAttributes(usb)
                    .filter { it.mixerBehavior == AudioMixerAttributes.MIXER_BEHAVIOR_BIT_PERFECT }
                    .maxByOrNull { it.format.sampleRate * 10 + bits(it.format.encoding) }
                if (best != null && am.setPreferredMixerAttributes(attrs, usb, best)) null
                else "This DAC doesn't offer bit-perfect output"
            }
        } catch (e: Exception) {
            Log.w(TAG, "mixer attributes failed", e)
            null
        }
    }

    private fun bits(encoding: Int) = when (encoding) {
        AudioFormat.ENCODING_PCM_FLOAT, AudioFormat.ENCODING_PCM_32BIT -> 32
        AudioFormat.ENCODING_PCM_24BIT_PACKED -> 24
        else -> 16
    }
}
