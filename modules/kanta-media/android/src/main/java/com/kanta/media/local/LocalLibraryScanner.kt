package com.kanta.media.local

import android.content.ContentUris
import android.content.Context
import android.net.Uri
import android.provider.MediaStore

/** Reads the phone's music files from MediaStore ("On this phone"). */
object LocalLibraryScanner {
    private val ALBUM_ART = Uri.parse("content://media/external/audio/albumart")

    fun scan(context: Context): List<Map<String, Any?>> {
        val out = mutableListOf<Map<String, Any?>>()
        val cols = arrayOf(
            MediaStore.Audio.Media._ID,
            MediaStore.Audio.Media.TITLE,
            MediaStore.Audio.Media.ARTIST,
            MediaStore.Audio.Media.ALBUM,
            MediaStore.Audio.Media.ALBUM_ID,
            MediaStore.Audio.Media.DURATION,
            MediaStore.Audio.Media.MIME_TYPE,
            MediaStore.Audio.Media.DISPLAY_NAME,
        )
        context.contentResolver.query(
            MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
            cols,
            "${MediaStore.Audio.Media.IS_MUSIC} != 0",
            null,
            "${MediaStore.Audio.Media.TITLE} COLLATE NOCASE",
        )?.use { c ->
            while (c.moveToNext()) {
                val id = c.getLong(0)
                val fileName = c.getString(7) ?: ""
                val artist = c.getString(2)?.takeUnless { it.isBlank() || it == "<unknown>" } ?: "Unknown artist"
                out += mapOf(
                    "uri" to ContentUris.withAppendedId(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, id).toString(),
                    "mediaStoreId" to id.toString(),
                    "title" to (c.getString(1)?.takeUnless { it.isBlank() } ?: fileName.substringBeforeLast('.')),
                    "artist" to artist,
                    "album" to (c.getString(3) ?: ""),
                    "durationMs" to c.getLong(5).toDouble(),
                    "artworkUri" to ContentUris.withAppendedId(ALBUM_ART, c.getLong(4)).toString(),
                    "format" to AudioMath.formatLabel(c.getString(6), null, null),
                )
            }
        }
        return out
    }
}
