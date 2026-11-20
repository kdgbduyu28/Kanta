// Same rules as QueueRules.kt normalizeTitle/normalizeArtist. Keep both in step.

const NOISE = /\s*[([]\s*(official|lyric|lyrics|audio|video|visualizer|music video|hd|hq|explicit|clean)[^)\]]*[)\]]/gi;
const SUFFIX = /\s+-\s+(remaster(ed)?|\d{4} remaster(ed)?|remaster(ed)? \d{4}|single version|radio edit|mono|stereo)( version)?$/i;

export function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** "Yellow - Remastered 2021" / "Yellow (Official Audio)" → "yellow" */
export function normalizeTitle(s: string): string {
  return stripAccents(s)
    .replace(NOISE, '')
    .replace(SUFFIX, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** "Coldplay - Topic" / "Coldplay, Someone" / "Coldplay & X" → "coldplay" */
export function normalizeArtist(s: string): string {
  const main = stripAccents(s)
    .replace(/\s+-\s+topic$/i, '')
    .replace(/vevo$/i, '')
    .split(/,|&| feat\.? | ft\.? | x /i)[0];
  return main.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
