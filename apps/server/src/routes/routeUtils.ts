export function withinUnlockWindow(iso: string, hours: number): boolean {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return false;
  const now = Date.now();
  const unlockAt = t - hours * 60 * 60 * 1000;
  return now >= unlockAt;
}
