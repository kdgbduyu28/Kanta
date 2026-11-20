# Kanta — notes for agents

Android music hub (Expo SDK 57 + local Kotlin module). Read first:
- Spec: `docs/superpowers/specs/2026-11-20-kanta-design.md`
- Plan: `docs/superpowers/plans/2026-11-20-kanta.md`
- Visual reference: `docs/design/MixPlay-reference.pdf`

Rules that matter day to day:
- Kanta controls installed apps (media sessions + song links). Never: Spotify Web API in the core,
  embed players, unofficial YouTube APIs, user-agent spoofing, extracting audio.
- Source ids: `spotify | ytmusic | applemusic | local`.
- Every user-facing string goes through `t()`; add Filipino to `src/i18n/fil.ts`.
- `kanta.db` is shared: JS owns the schema (`src/db/schema.ts`); Kotlin (`KantaDb.kt`) writes only
  `plays`, `queue`, `queue_state`. Change those tables on both sides together.
- Title/artist matching rules exist twice: `src/lib/normalize.ts` and `QueueRules.kt`. Keep in step.
- The user prefers no builds/tests mid-development; verify when asked. Installing on their phone is their step.
- Phase 0 (`../kanta-spike`) results should tune `Starter.kt`, `endWindowMs` and `linkFromMediaId`.
