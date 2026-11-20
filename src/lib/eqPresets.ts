// Equalizer bands and presets for local playback (plan Task 7.3).

export const EQ_FREQS_HZ = [60, 150, 400, 1000, 2400, 6000, 10000, 14000, 16000];
export const EQ_LABELS = ['60', '150', '400', '1k', '2.4k', '6k', '10k', '14k', '16k'];

export type PresetId = 'flat' | 'pop' | 'rock' | 'jazz' | 'classical' | 'hiphop' | 'edm';

export const EQ_PRESETS: Record<PresetId, number[]> = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  pop: [-1, 1, 3, 4, 3, 1, 0, -1, -1],
  rock: [4, 3, -1, -2, -1, 2, 4, 5, 5],
  jazz: [3, 2, 1, 2, -1, -1, 0, 1, 2],
  classical: [4, 3, 2, 0, -1, -1, 0, 2, 3],
  hiphop: [5, 4, 1, -1, -1, 1, 0, 2, 3],
  edm: [5, 4, 0, -2, 0, 2, 3, 4, 4],
};

export const PRESET_LABELS: Record<PresetId, string> = {
  flat: 'Flat',
  pop: 'Pop',
  rock: 'Rock',
  jazz: 'Jazz',
  classical: 'Classical',
  hiphop: 'Hip-Hop',
  edm: 'EDM',
};

export const PRESET_ORDER: PresetId[] = ['flat', 'pop', 'rock', 'jazz', 'classical', 'hiphop', 'edm'];

export type CustomPreset = { name: string; gainsDb: number[] };

export function clampDb(db: number): number {
  return Math.max(-12, Math.min(12, db));
}

/** Which preset (if any) these gains are exactly. */
export function matchPreset(gains: number[], custom: CustomPreset[] = []): string | null {
  const same = (a: number[]) => a.length === gains.length && a.every((v, i) => v === gains[i]);
  for (const id of PRESET_ORDER) if (same(EQ_PRESETS[id])) return id;
  for (const c of custom) if (same(c.gainsDb)) return `custom:${c.name}`;
  return null;
}
