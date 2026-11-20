package com.kanta.media

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.session.PlaybackState
import android.net.Uri
import android.provider.Settings
import android.util.Log

/** Opens a song's link in its app and makes sure it plays (sequence from the Phase 0 test). */
class Starter(private val context: Context) {

    sealed class Result {
        object Started : Result()
        /** Android would block opening the app from the background: post "Up next" instead. */
        object NeedsTap : Result()
        object AppMissing : Result()
    }

    fun isInstalled(pkg: String): Boolean = try {
        context.packageManager.getPackageInfo(pkg, 0)
        true
    } catch (_: PackageManager.NameNotFoundException) {
        false
    }

    fun viewIntent(item: QueueItemK): Intent? {
        val pkg = SessionPick.PACKAGES[item.source] ?: return null
        val i = if (item.link.isBlank()) context.packageManager.getLaunchIntentForPackage(pkg)
        else Intent(Intent.ACTION_VIEW, Uri.parse(item.link)).setPackage(pkg)
        return i?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }

    fun canStartFromHere(fromForeground: Boolean): Boolean =
        fromForeground || KantaCore.appVisible || Settings.canDrawOverlays(context)

    fun start(item: QueueItemK, fromForeground: Boolean): Result {
        val pkg = SessionPick.PACKAGES[item.source] ?: return Result.AppMissing
        if (!isInstalled(pkg)) return Result.AppMissing
        // Best case: the app's session takes a URI directly, so nothing has to come to the front
        // (works from the background too). Phase 0 confirms which apps support it.
        if (tryPlayFromUri(item, pkg)) {
            ensurePlaying(item, pkg, attempt = 0, returnToKanta = false)
            return Result.Started
        }
        if (!canStartFromHere(fromForeground)) return Result.NeedsTap
        val intent = viewIntent(item) ?: return Result.AppMissing
        val returnToKanta = KantaCore.appVisible
        try {
            context.startActivity(intent)
        } catch (e: ActivityNotFoundException) {
            return Result.AppMissing
        } catch (e: Exception) {
            Log.w(TAG, "start ${item.link} blocked", e)
            return Result.NeedsTap
        }
        ensurePlaying(item, pkg, attempt = 0, returnToKanta = returnToKanta)
        return Result.Started
    }

    private fun tryPlayFromUri(item: QueueItemK, pkg: String): Boolean {
        if (item.link.isBlank()) return false
        val c = KantaCore.watcher.controllerFor(pkg) ?: return false
        val actions = c.playbackState?.actions ?: return false
        if (actions and PlaybackState.ACTION_PLAY_FROM_URI == 0L) return false
        val uri = if (item.source == "spotify") QueueEngine.spotifyUri(item.link) else item.link
        return try {
            c.transportControls.playFromUri(Uri.parse(uri), null)
            true
        } catch (e: Exception) {
            Log.w(TAG, "playFromUri failed for $pkg", e)
            false
        }
    }

    /** Some apps open the song page without playing; press play once it shows up (up to ~6 s). */
    private fun ensurePlaying(item: QueueItemK, pkg: String, attempt: Int, returnToKanta: Boolean) {
        KantaCore.main.postDelayed({
            val s = KantaCore.watcher.snapshotFor(pkg)
            val same = s != null && QueueRules.isSameSong(item, s.title, s.artist)
            when {
                same && s!!.playing -> if (returnToKanta) bringKantaBack()
                same -> {
                    KantaCore.watcher.playPkg(pkg)
                    if (returnToKanta) bringKantaBack()
                }
                attempt < 5 -> ensurePlaying(item, pkg, attempt + 1, returnToKanta)
                else -> {
                    // Never matched by title (e.g. the app renamed it); press play anyway.
                    if (s != null && !s.playing) KantaCore.watcher.playPkg(pkg)
                    if (returnToKanta) bringKantaBack()
                }
            }
        }, 1200)
    }

    private fun bringKantaBack() {
        context.packageManager.getLaunchIntentForPackage(context.packageName)?.let {
            it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
            try {
                context.startActivity(it)
            } catch (_: Exception) {
            }
        }
    }
}
