package com.kanta.media

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

/** "Next: <song> — tap to play", for when Android won't let Kanta open another app from the background. */
class UpNextNotifier(private val context: Context) {
    private val channelId = "up_next"
    private val id = 4101

    private fun ensureChannel() {
        val nm = context.getSystemService(NotificationManager::class.java)
        if (nm.getNotificationChannel(channelId) == null) {
            nm.createNotificationChannel(
                NotificationChannel(channelId, "Up next", NotificationManager.IMPORTANCE_HIGH).apply {
                    description = "The next song in Kanta's queue, when it can't start by itself"
                },
            )
        }
    }

    fun post(item: QueueItemK, starter: Starter) {
        if (!KantaCore.upNextNotifications) return
        val intent = starter.viewIntent(item) ?: return
        ensureChannel()
        val pi = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val n = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle("Next: ${item.title}")
            .setContentText(listOf(item.artist, "Tap to play").filter { it.isNotBlank() }.joinToString(" — "))
            .setContentIntent(pi)
            .setAutoCancel(true)
            .setCategory(NotificationCompat.CATEGORY_RECOMMENDATION)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()
        try {
            NotificationManagerCompat.from(context).notify(id, n)
        } catch (_: SecurityException) {
            // POST_NOTIFICATIONS not granted.
        }
    }

    fun cancel() = NotificationManagerCompat.from(context).cancel(id)
}
