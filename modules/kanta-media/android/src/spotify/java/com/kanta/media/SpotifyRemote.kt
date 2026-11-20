package com.kanta.media

import android.content.Context
import android.util.Log
import com.spotify.android.appremote.api.ConnectionParams
import com.spotify.android.appremote.api.Connector
import com.spotify.android.appremote.api.SpotifyAppRemote

/** Optional Spotify App Remote: start and queue Spotify songs without switching apps (spec §5.4). */
object SpotifyRemote {
    const val available = true
    private var remote: SpotifyAppRemote? = null

    val isConnected: Boolean get() = remote?.isConnected == true

    fun connect(context: Context, clientId: String, done: (Boolean) -> Unit) {
        val params = ConnectionParams.Builder(clientId)
            .setRedirectUri("kanta://spotify-callback")
            .showAuthView(true)
            .build()
        SpotifyAppRemote.connect(context, params, object : Connector.ConnectionListener {
            override fun onConnected(r: SpotifyAppRemote) {
                remote = r
                done(true)
            }

            override fun onFailure(t: Throwable) {
                Log.w(TAG, "Spotify kit failed", t)
                remote = null
                done(false)
            }
        })
    }

    fun disconnect() {
        remote?.let { SpotifyAppRemote.disconnect(it) }
        remote = null
    }

    fun play(uri: String) {
        remote?.playerApi?.play(uri)?.setErrorCallback { Log.w(TAG, "Spotify kit play failed", it) }
    }

    fun queue(uri: String) {
        remote?.playerApi?.queue(uri)?.setErrorCallback { Log.w(TAG, "Spotify kit queue failed", it) }
    }
}
