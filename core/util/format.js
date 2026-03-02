/**
 * Format bytes into human-readable string
 * @param {number|null} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes == null) return 'N/A'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/**
 * Format seconds into human-readable duration
 * @param {number|null} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (seconds == null) return 'N/A'
  const s = Math.floor(seconds)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  if (m < 60) return `${m}m ${rem}s`
  const h = Math.floor(m / 60)
  const remM = m % 60
  return `${h}h ${remM}m`
}

/**
 * Format CPU percentage
 * @param {number|null} percent
 * @returns {string}
 */
export function formatCpu(percent) {
  if (percent == null) return 'N/A'
  return `${percent.toFixed(1)}%`
}
