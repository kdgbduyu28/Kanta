package com.kanta.media

import android.Manifest
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.kanta.media.local.AudioSettingsK
import com.kanta.media.local.LocalLibraryScanner
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** The JS bridge (modules/kanta-media/index.ts). Engine work always runs on the main thread. */
class KantaMediaModule : Module() {
    private val ctx: Context get() = requireNotNull(appContext.reactContext) { "React context gone" }

    private val listener: (String, Any?) -> Unit = { event, value ->
        // Wrapped in { value } so null can be sent.
        sendEvent(event, mapOf("value" to value))
    }

    private fun onMain(block: () -> Unit) = KantaCore.main.post(block)

    override fun definition() = ModuleDefinition {
        Name("KantaMedia")
        Events("nowPlaying", "queueState", "historyChanged", "accessChanged")

        OnCreate {
            KantaCore.init(ctx)
            KantaCore.addListener(listener)
        }
        OnDestroy { KantaCore.removeListener(listener) }
        OnActivityEntersForeground { KantaCore.appVisible = true }
        OnActivityEntersBackground { KantaCore.appVisible = false }

        // ---- Permissions and apps ----

        Function("hasNotificationAccess") {
            NotificationManagerCompat.getEnabledListenerPackages(ctx).contains(ctx.packageName)
        }
        Function("openNotificationAccessSettings") {
            val intent = if (Build.VERSION.SDK_INT >= 30) {
                Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS).putExtra(
                    Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME,
                    ComponentName(ctx, KantaListenerService::class.java).flattenToString(),
                )
            } else Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
            startSettings(intent, Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
        }
        Function("canDrawOverlays") { Settings.canDrawOverlays(ctx) }
        Function("openOverlaySettings") {
            startSettings(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${ctx.packageName}")), null)
        }
        Function("hasAudioPermission") {
            val perm = if (Build.VERSION.SDK_INT >= 33) Manifest.permission.READ_MEDIA_AUDIO else Manifest.permission.READ_EXTERNAL_STORAGE
            ContextCompat.checkSelfPermission(ctx, perm) == PackageManager.PERMISSION_GRANTED
        }
        Function("getInstalledSources") {
            val s = Starter(ctx)
            SessionPick.PACKAGES.filter { (_, pkg) -> s.isInstalled(pkg) }.keys.toList()
        }

        // ---- Now playing and controls ----

        Function("getNowPlaying") { KantaCore.watcher.nowPlaying() }
        Function("play") { onMain { KantaCore.engine.play() } }
        Function("pause") { onMain { KantaCore.engine.pause() } }
        Function("next") { onMain { KantaCore.engine.next() } }
        Function("previous") { onMain { KantaCore.engine.previous() } }
        Function("seekTo") { ms: Double -> onMain { KantaCore.engine.seekTo(ms.toLong()) } }
        Function("openInApp") { source: String, link: String ->
            val item = QueueItemK("", source, link, "", "", 0)
            Starter(ctx).viewIntent(item)?.let { i -> onMain { runCatching { ctx.startActivity(i) } } }
        }

        // ---- Queue ----

        AsyncFunction("setQueue") { items: List<Map<String, Any?>>, startIndex: Int ->
            KantaCore.engine.setQueue(items.map(::toItem), startIndex)
        }.runOnQueue(Queues.MAIN)
        AsyncFunction("insertNext") { item: Map<String, Any?> ->
            KantaCore.engine.insertNext(toItem(item))
        }.runOnQueue(Queues.MAIN)
        AsyncFunction("jumpTo") { index: Int -> KantaCore.engine.jumpTo(index) }.runOnQueue(Queues.MAIN)
        Function("setShuffle") { on: Boolean -> onMain { KantaCore.engine.setShuffle(on) } }
        Function("setRepeat") { mode: String -> onMain { KantaCore.engine.setRepeat(Repeat.from(mode)) } }
        Function("getQueueState") { KantaCore.engine.state() }
        Function("setAutoAdvance") { on: Boolean -> KantaCore.autoAdvance = on }
        Function("setUpNextNotifications") { on: Boolean -> KantaCore.upNextNotifications = on }
        Function("setHistoryEnabled") { on: Boolean -> KantaCore.historyEnabled = on }

        // ---- Spotify kit ----

        AsyncFunction("spotifyConnect") { clientId: String, promise: Promise ->
            SpotifyRemote.connect(ctx, clientId) { ok -> promise.resolve(ok) }
        }.runOnQueue(Queues.MAIN)
        Function("spotifyDisconnect") { onMain { SpotifyRemote.disconnect() } }
        Function("spotifyIsConnected") { SpotifyRemote.isConnected }

        // ---- On this phone ----

        AsyncFunction("scanLocalLibrary") { LocalLibraryScanner.scan(ctx) }
        Function("setAudioSettings") { s: Map<String, Any?> ->
            val settings = AudioSettingsK.fromMap(s)
            KantaCore.prefs.edit().putString("audio", settings.toJson()).apply()
            onMain { KantaCore.local.applySettings(settings) }
        }
    }

    private fun startSettings(intent: Intent, fallback: Intent?) {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try {
            ctx.startActivity(intent)
        } catch (_: Exception) {
            fallback?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)?.let { runCatching { ctx.startActivity(it) } }
        }
    }

    private fun toItem(m: Map<String, Any?>) = QueueItemK(
        trackId = m["trackId"] as? String ?: "",
        source = m["source"] as? String ?: "",
        link = m["link"] as? String ?: "",
        title = m["title"] as? String ?: "",
        artist = m["artist"] as? String ?: "",
        durationMs = (m["durationMs"] as? Number)?.toLong() ?: 0,
    )
}
