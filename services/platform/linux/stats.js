import { safeRead } from '../../../core/util/async.js'
import { sleep } from '../../../core/util/async.js'

const CLK_TCK = 100 // standard Linux USER_HZ

/**
 * Parse /proc/<pid>/stat and extract timing fields.
 * @param {string} content - raw content of /proc/<pid>/stat
 * @returns {{ utime: number, stime: number, starttime: number, totalTime: number }|null}
 */
export function parseStatLine(content) {
  if (!content) return null
  // The comm field (field 2) can contain spaces and parentheses, but is
  // always wrapped in parens. Find the last ')' to skip it safely.
  const lastParen = content.lastIndexOf(')')
  if (lastParen === -1) return null
  const rest = content.slice(lastParen + 2).trim() // skip ') '
  const fields = rest.split(' ')
  // After the comm field, the remaining fields are numbered from 3.
  // utime = field 14 (index 11 in rest), stime = field 15 (index 12 in rest),
  // starttime = field 22 (index 19 in rest)
  const utime = parseInt(fields[11], 10)
  const stime = parseInt(fields[12], 10)
  const starttime = parseInt(fields[19], 10)
  if (isNaN(utime) || isNaN(stime) || isNaN(starttime)) return null
  return { utime, stime, starttime, totalTime: utime + stime }
}

/**
 * Read /proc/uptime and return system uptime in seconds.
 * @param {Function} readFn - injectable reader (defaults to safeRead)
 * @returns {Promise<number|null>}
 */
export async function getSystemUptime(readFn = safeRead) {
  const content = await readFn('/proc/uptime')
  if (!content) return null
  return parseFloat(content.split(' ')[0])
}

/**
 * Compute CPU percentage for a process by sampling /proc/<pid>/stat twice.
 * @param {number} pid
 * @param {number} [intervalMs=1000]
 * @param {Function} [readFn] - injectable reader for testing
 * @returns {Promise<number|null>} CPU percentage (0-N*100 for N cores)
 */
export async function getCpuPercent(pid, intervalMs = 1000, readFn = safeRead) {
  const path = `/proc/${pid}/stat`

  const [content1, uptime1] = await Promise.all([
    readFn(path),
    getSystemUptime(readFn),
  ])
  const stat1 = parseStatLine(content1)
  if (!stat1 || uptime1 == null) return null

  await sleep(intervalMs)

  const [content2, uptime2] = await Promise.all([
    readFn(path),
    getSystemUptime(readFn),
  ])
  const stat2 = parseStatLine(content2)
  if (!stat2 || uptime2 == null) return null

  const elapsedTicks = (uptime2 - uptime1) * CLK_TCK
  if (elapsedTicks <= 0) return null

  const processTicks = stat2.totalTime - stat1.totalTime
  return (processTicks / elapsedTicks) * 100
}

/**
 * Get process memory usage (VmRSS) from /proc/<pid>/status.
 * @param {number} pid
 * @param {Function} [readFn] - injectable reader for testing
 * @returns {Promise<number|null>} memory in bytes
 */
export async function getMemBytes(pid, readFn = safeRead) {
  const content = await readFn(`/proc/${pid}/status`)
  if (!content) return null
  const match = content.match(/^VmRSS:\s+(\d+)\s+kB/m)
  if (!match) return null
  return parseInt(match[1], 10) * 1024
}

/**
 * Get process uptime in seconds.
 * @param {number} pid
 * @param {Function} [readFn] - injectable reader for testing
 * @returns {Promise<number|null>}
 */
export async function getUptimeSeconds(pid, readFn = safeRead) {
  const [statContent, systemUptime] = await Promise.all([
    readFn(`/proc/${pid}/stat`),
    getSystemUptime(readFn),
  ])
  const stat = parseStatLine(statContent)
  if (!stat || systemUptime == null) return null
  const processStartSecs = stat.starttime / CLK_TCK
  return systemUptime - processStartSecs
}
