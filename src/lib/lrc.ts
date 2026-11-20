export type LyricLine = { timeMs: number; line: string };

const STAMP = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

/** Parses synced LRC text. Tag lines like [ar:...] are skipped; a line with several stamps repeats. */
export function parseLrc(text: string): LyricLine[] {
  const out: LyricLine[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const stamps = [...raw.matchAll(STAMP)];
    if (!stamps.length) continue;
    const line = raw.replace(STAMP, '').trim();
    for (const s of stamps) {
      const frac = s[3] ?? '0';
      const ms = Number(frac.padEnd(3, '0').slice(0, 3));
      out.push({ timeMs: Number(s[1]) * 60_000 + Number(s[2]) * 1000 + ms, line });
    }
  }
  return out.sort((a, b) => a.timeMs - b.timeMs);
}

/** Index of the line being sung at positionMs; -1 before the first line. */
export function activeLineIndex(lines: LyricLine[], positionMs: number): number {
  let lo = 0;
  let hi = lines.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].timeMs <= positionMs) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans;
}
