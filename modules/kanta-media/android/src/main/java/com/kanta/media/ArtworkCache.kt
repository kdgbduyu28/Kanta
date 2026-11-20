package com.kanta.media

import android.content.Context
import android.graphics.Bitmap
import java.io.File
import java.io.FileOutputStream
import java.security.MessageDigest

/** Saves session cover bitmaps as files so JS can show them (file:// uris), max 200 files. */
class ArtworkCache(context: Context) {
    private val dir = File(context.cacheDir, "artwork").apply { mkdirs() }

    fun save(bitmap: Bitmap, key: String): String? {
        val name = sha1(key) + ".jpg"
        val f = File(dir, name)
        if (!f.exists()) {
            try {
                // Session art can be huge; 600px is plenty for the Now Playing screen.
                val scaled = if (bitmap.width > 600) {
                    Bitmap.createScaledBitmap(bitmap, 600, (bitmap.height * 600f / bitmap.width).toInt().coerceAtLeast(1), true)
                } else bitmap
                FileOutputStream(f).use { scaled.compress(Bitmap.CompressFormat.JPEG, 88, it) }
                trim()
            } catch (e: Exception) {
                return null
            }
        }
        return "file://${f.absolutePath}"
    }

    private fun trim() {
        val files = dir.listFiles() ?: return
        if (files.size <= 200) return
        files.sortedBy { it.lastModified() }.take(files.size - 200).forEach { it.delete() }
    }

    private fun sha1(s: String): String =
        MessageDigest.getInstance("SHA-1").digest(s.toByteArray()).joinToString("") { "%02x".format(it) }
}
