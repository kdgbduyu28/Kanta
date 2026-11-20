package com.kanta.media

import android.content.Context
import android.content.SharedPreferences
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.kanta.media.local.LocalPlayback
import java.util.concurrent.CopyOnWriteArrayList

const val TAG = "Kanta"

/**
 * Process-wide hub. The JS module, the notification listener service and the local player
 * service all meet here, so the queue keeps running when Kanta's screens are closed.
 */
object KantaCore {
    lateinit var app: Context
        private set
    val main = Handler(Looper.getMainLooper())

    val prefs: SharedPreferences by lazy { app.getSharedPreferences("kanta", Context.MODE_PRIVATE) }
    val db: KantaDb by lazy { KantaDb(app) }
    val watcher: SessionWatcher by lazy { SessionWatcher(app) }
    val history: HistoryLogger by lazy { HistoryLogger() }
    val engine: QueueEngine by lazy { QueueEngine(app) }
    val local: LocalPlayback by lazy { LocalPlayback(app) }

    /** True while one of Kanta's screens is in the foreground. */
    @Volatile var appVisible = false

    private val listeners = CopyOnWriteArrayList<(String, Any?) -> Unit>()
    private var initialized = false

    fun init(context: Context) {
        if (initialized) return
        app = context.applicationContext
        initialized = true
        main.post { engine.restore() }
    }

    fun isInitialized() = initialized

    fun addListener(l: (String, Any?) -> Unit) = listeners.add(l)
    fun removeListener(l: (String, Any?) -> Unit) = listeners.remove(l)

    /** Sends an event to JS (if the app is open). Always on the main thread. */
    fun emit(event: String, value: Any?) {
        main.post {
            for (l in listeners) {
                try {
                    l(event, value)
                } catch (e: Exception) {
                    Log.w(TAG, "emit $event failed", e)
                }
            }
        }
    }

    var autoAdvance: Boolean
        get() = prefs.getBoolean("autoAdvance", true)
        set(v) = prefs.edit().putBoolean("autoAdvance", v).apply()

    var upNextNotifications: Boolean
        get() = prefs.getBoolean("upNext", true)
        set(v) = prefs.edit().putBoolean("upNext", v).apply()

    var historyEnabled: Boolean
        get() = prefs.getBoolean("history", true)
        set(v) = prefs.edit().putBoolean("history", v).apply()
}
