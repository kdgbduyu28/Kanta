package com.kanta.media

object SessionPick {
    const val SPOTIFY = "com.spotify.music"
    const val YTMUSIC = "com.google.android.apps.youtube.music"
    const val APPLEMUSIC = "com.apple.android.music"

    val PACKAGES = mapOf("spotify" to SPOTIFY, "ytmusic" to YTMUSIC, "applemusic" to APPLEMUSIC)

    fun sourceFor(pkg: String, ownPkg: String? = null): String? = when (pkg) {
        SPOTIFY -> "spotify"
        YTMUSIC -> "ytmusic"
        APPLEMUSIC -> "applemusic"
        ownPkg -> "local"
        else -> null
    }

    /**
     * The session Now Playing should show: supported apps only, a playing one first,
     * otherwise the most recently updated; sessions without a title are ignored.
     */
    fun pickActiveSession(sessions: List<SessionSnapshot>, ownPkg: String? = null): SessionSnapshot? {
        val ok = sessions.filter { sourceFor(it.pkg, ownPkg) != null && !it.title.isNullOrBlank() }
        return ok.filter { it.playing }.maxByOrNull { it.updatedAt } ?: ok.maxByOrNull { it.updatedAt }
    }

    /** Spotify gives "spotify:track:<id>"; YouTube Music a bare 11-char video id. Same rules as links.ts. */
    fun sourceIdFromMediaId(source: String, mediaId: String?): String? {
        if (mediaId == null) return null
        return when (source) {
            "spotify" -> Regex("^spotify:track:([A-Za-z0-9]+)$").find(mediaId)?.groupValues?.get(1)
            "ytmusic" -> if (Regex("^[A-Za-z0-9_-]{11}$").matches(mediaId)) mediaId else null
            else -> null
        }
    }
}
