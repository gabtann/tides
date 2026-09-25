const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// Format tampilan dari timestamp ISO yang sudah ada (mis. Signal.detectedAt), contoh "12m ago".
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const time = Date.parse(iso)
  if (Number.isNaN(time)) return ''
  const elapsed = now.getTime() - time
  if (elapsed < MINUTE) return 'just now'
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`
  return `${Math.floor(elapsed / DAY)}d ago`
}
