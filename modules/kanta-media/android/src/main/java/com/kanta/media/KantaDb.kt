package com.kanta.media

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.util.Log
import java.io.File
import java.util.UUID

/**
 * The same kanta.db that JS opens with expo-sqlite (filesDir/SQLite/kanta.db, WAL).
 * JS owns the schema; Kotlin only writes plays, queue and queue_state.
 */
class KantaDb(private val context: Context) {
    private var db: SQLiteDatabase? = null

    private fun open(): SQLiteDatabase? {
        db?.let { if (it.isOpen) return it }
        val file = File(context.filesDir, "SQLite/kanta.db")
        if (!file.exists()) return null // JS has not created it yet (app never opened).
        return try {
            SQLiteDatabase.openDatabase(file.path, null, SQLiteDatabase.OPEN_READWRITE).also {
                it.rawQuery("PRAGMA busy_timeout = 3000", null).close()
                db = it
            }
        } catch (e: Exception) {
            Log.w(TAG, "open kanta.db failed", e)
            null
        }
    }

    private inline fun <T> use(fallback: T, block: (SQLiteDatabase) -> T): T {
        val d = open() ?: return fallback
        return try {
            block(d)
        } catch (e: Exception) {
            Log.w(TAG, "kanta.db query failed", e)
            fallback
        }
    }

    fun insertPlay(trackId: String?, source: String, title: String, artist: String, startedAt: Long, listenedMs: Long) = use(Unit) {
        it.insert("plays", null, ContentValues().apply {
            put("id", UUID.randomUUID().toString())
            if (trackId != null) put("track_id", trackId) else putNull("track_id")
            put("source", source)
            put("title", title)
            put("artist", artist)
            put("started_at", startedAt)
            put("listened_ms", listenedMs)
        })
    }

    /** Finds a saved song for a session: by source id first, then by normalized title + artist. */
    fun findTrackId(source: String, sourceId: String?, title: String, artist: String): String? = use(null) find@{ d ->
        if (sourceId != null) {
            d.rawQuery("SELECT id FROM tracks WHERE source = ? AND source_id = ?", arrayOf(source, sourceId)).use { c ->
                if (c.moveToFirst()) return@find c.getString(0)
            }
        }
        val nt = QueueRules.normalizeTitle(title)
        val na = QueueRules.normalizeArtist(artist)
        d.rawQuery("SELECT id, title, artist FROM tracks WHERE source = ? AND kind = 'track'", arrayOf(source)).use { c ->
            while (c.moveToNext()) {
                if (QueueRules.normalizeTitle(c.getString(1)) == nt && QueueRules.normalizeArtist(c.getString(2)) == na) {
                    return@find c.getString(0)
                }
            }
        }
        null
    }

    fun saveQueue(items: List<QueueItemK>, order: IntArray, cursor: Int, shuffle: Boolean, repeat: Repeat) = use(Unit) { d ->
        d.beginTransaction()
        try {
            d.delete("queue", null, null)
            items.forEachIndexed { i, q ->
                d.insert("queue", null, ContentValues().apply {
                    put("position", i)
                    put("track_id", q.trackId)
                    put("source", q.source)
                    put("link", q.link)
                    put("title", q.title)
                    put("artist", q.artist)
                    put("duration_ms", q.durationMs)
                })
            }
            d.insertWithOnConflict("queue_state", null, ContentValues().apply {
                put("id", 1)
                put("cursor", cursor)
                put("shuffle", if (shuffle) 1 else 0)
                put("repeat", repeat.js)
                put("order_json", order.joinToString(",", "[", "]"))
            }, SQLiteDatabase.CONFLICT_REPLACE)
            d.setTransactionSuccessful()
        } finally {
            d.endTransaction()
        }
    }

    data class SavedQueue(val items: List<QueueItemK>, val order: IntArray, val cursor: Int, val shuffle: Boolean, val repeat: Repeat)

    fun loadQueue(): SavedQueue? = use(null) load@{ d ->
        val items = mutableListOf<QueueItemK>()
        d.rawQuery("SELECT track_id, source, link, title, artist, duration_ms FROM queue ORDER BY position", null).use { c ->
            while (c.moveToNext()) {
                items += QueueItemK(c.getString(0), c.getString(1), c.getString(2), c.getString(3), c.getString(4), c.getLong(5))
            }
        }
        d.rawQuery("SELECT cursor, shuffle, repeat, order_json FROM queue_state WHERE id = 1", null).use { c ->
            if (!c.moveToFirst() || items.isEmpty()) return@load null
            val order = c.getString(3).trim('[', ']').split(',').mapNotNull { it.trim().toIntOrNull() }.toIntArray()
            SavedQueue(items, if (order.size == items.size) order else IntArray(items.size) { it }, c.getInt(0), c.getInt(1) == 1, Repeat.from(c.getString(2)))
        }
    }
}
