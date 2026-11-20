package com.kanta.media.local

import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

/** Native copy of the JS AudioSettings, kept in SharedPreferences so the service has it at boot. */
data class AudioSettingsK(
    val quality: String = "auto",
    val eqEnabled: Boolean = false,
    val eqGainsDb: FloatArray = FloatArray(9),
    val crossfadeSec: Int = 0,
    val gapless: Boolean = true,
    val normalize: Boolean = false,
    val balance: Float = 0f,
) {
    fun toJson(): String = JSONObject()
        .put("quality", quality)
        .put("eqEnabled", eqEnabled)
        .put("eqGainsDb", JSONArray(eqGainsDb.map { it.toDouble() }))
        .put("crossfadeSec", crossfadeSec)
        .put("gapless", gapless)
        .put("normalize", normalize)
        .put("balance", balance.toDouble())
        .toString()

    companion object {
        fun fromMap(m: Map<String, Any?>): AudioSettingsK = AudioSettingsK(
            quality = m["quality"] as? String ?: "auto",
            eqEnabled = m["eqEnabled"] as? Boolean ?: false,
            eqGainsDb = (m["eqGainsDb"] as? List<*>)?.map { (it as? Number)?.toFloat() ?: 0f }?.toFloatArray()
                ?.takeIf { it.size == 9 } ?: FloatArray(9),
            crossfadeSec = (m["crossfadeSec"] as? Number)?.toInt() ?: 0,
            gapless = m["gapless"] as? Boolean ?: true,
            normalize = m["normalize"] as? Boolean ?: false,
            balance = (m["balance"] as? Number)?.toFloat() ?: 0f,
        )

        fun load(p: SharedPreferences): AudioSettingsK = try {
            val j = JSONObject(p.getString("audio", null) ?: return AudioSettingsK())
            val g = j.optJSONArray("eqGainsDb")
            AudioSettingsK(
                quality = j.optString("quality", "auto"),
                eqEnabled = j.optBoolean("eqEnabled", false),
                eqGainsDb = if (g != null && g.length() == 9) FloatArray(9) { g.optDouble(it, 0.0).toFloat() } else FloatArray(9),
                crossfadeSec = j.optInt("crossfadeSec", 0),
                gapless = j.optBoolean("gapless", true),
                normalize = j.optBoolean("normalize", false),
                balance = j.optDouble("balance", 0.0).toFloat(),
            )
        } catch (_: Exception) {
            AudioSettingsK()
        }
    }

    override fun equals(other: Any?) = other is AudioSettingsK && toJson() == other.toJson()
    override fun hashCode() = toJson().hashCode()
}
