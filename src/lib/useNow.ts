import { useEffect, useState } from 'react';

/** The current time, refreshed every `everyMs` while `running` (progress bars, lyrics). */
export function useNow(running: boolean, everyMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [running, everyMs]);
  return now;
}
