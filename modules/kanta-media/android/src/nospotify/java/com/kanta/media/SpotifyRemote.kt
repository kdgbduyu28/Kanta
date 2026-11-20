package com.kanta.media

import android.content.Context

/** Built when the Spotify App Remote .aar is not in android/libs: the kit is simply unavailable. */
object SpotifyRemote {
    const val available = false
    val isConnected: Boolean get() = false
    fun connect(context: Context, clientId: String, done: (Boolean) -> Unit) = done(false)
    fun disconnect() {}
    fun play(uri: String) {}
    fun queue(uri: String) {}
}
