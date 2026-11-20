package com.kanta.media

import android.content.ComponentName
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

/**
 * Bound by Android once the user turns on notification access. Kanta only uses it as the key to
 * other apps' media sessions; notifications themselves are ignored.
 */
class KantaListenerService : NotificationListenerService() {

    override fun onListenerConnected() {
        KantaCore.init(applicationContext)
        KantaCore.watcher.start(ComponentName(this, KantaListenerService::class.java))
        KantaCore.emit("accessChanged", null)
    }

    override fun onListenerDisconnected() {
        KantaCore.history.flush()
        KantaCore.watcher.stop()
        KantaCore.emit("accessChanged", null)
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) = Unit
    override fun onNotificationRemoved(sbn: StatusBarNotification?) = Unit
}
