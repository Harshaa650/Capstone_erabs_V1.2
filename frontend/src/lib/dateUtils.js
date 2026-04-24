/**
 * Date/time utilities — all display in IST (Asia/Kolkata, UTC+5:30).
 * Supabase stores timestamps as UTC; we always convert to IST for display.
 */

const IST_TZ = { timeZone: 'Asia/Kolkata' }

/** Format a UTC ISO string as a readable date in IST: "Thu, Apr 23, 2026" */
export function fmtDate(isoStr) {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleDateString('en-US', {
    ...IST_TZ,
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

/** Format a UTC ISO string as a time in IST: "10:00 AM" */
export function fmtTime(isoStr) {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleTimeString('en-US', {
    ...IST_TZ,
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

/** Format a UTC ISO string as date + time in IST: "Thu, Apr 23, 2026, 10:00 AM" */
export function fmtDateTime(isoStr) {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleString('en-US', {
    ...IST_TZ,
    weekday: 'short', month: 'short', day: 'numeric',
    year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

/** Format just the date portion in IST: "Apr 23, 2026" */
export function fmtDateShort(isoStr) {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleDateString('en-US', {
    ...IST_TZ,
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

/**
 * Build an IST-aware ISO string to send to the backend.
 * e.g. date="2026-04-23", time="10:00" → "2026-04-23T10:00:00+05:30"
 */
export function toISTISO(dateStr, timeStr) {
  return `${dateStr}T${timeStr}:00+05:30`
}
