/** Durée lisible : « 45 s », « 12 min », « 2 h 05 ». */
export function formatSeconds(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds))
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`
}

/** Une part (0 à 1) en pourcentage entier : 0.724 → « 72 % ». */
export function formatPercent(share: number): string {
  return `${Math.round(share * 100)} %`
}
