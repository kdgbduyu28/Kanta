package com.kanta.media.local

import android.os.Handler
import androidx.media3.common.Player

/** Ramps two players over `fadeMs` (equal-power), then calls `done`. */
class Crossfader(
    private val handler: Handler,
    private val fadeMs: Long,
    private val outgoing: Player,
    private val incoming: Player,
    private val done: () -> Unit,
) {
    private var startedAt = 0L
    private var cancelled = false
    private val outStart = outgoing.volume

    private val step = object : Runnable {
        override fun run() {
            if (cancelled) return
            val elapsed = System.currentTimeMillis() - startedAt
            val (o, i) = AudioMath.crossfadeVolumes(elapsed, fadeMs)
            outgoing.volume = o * outStart
            incoming.volume = i
            if (elapsed >= fadeMs) {
                outgoing.pause()
                done()
            } else handler.postDelayed(this, 50)
        }
    }

    fun start() {
        startedAt = System.currentTimeMillis()
        handler.post(step)
    }

    fun cancel() {
        cancelled = true
        handler.removeCallbacks(step)
        incoming.release()
    }
}
