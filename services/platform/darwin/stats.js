import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

/**
 * Default exec function — runs a shell command and returns stdout.
 * @param {string} cmd
 * @returns {Promise<string>}
 */
async function defaultExec(cmd) {
  const { stdout } = await execAsync(cmd)
  return stdout
}

/**
 * Parse etime string from `ps` into total seconds.
 * Format: [[DD-]HH:]MM:SS
 * @param {string} str
 * @returns {number|null}
 */
export function parseEtime(str) {
  if (!str || !str.trim()) return null

  const trimmed = str.trim()

  // DD-HH:MM:SS
  const ddMatch = trimmed.match(/^(\d+)-(\d+):(\d+):(\d+)$/)
  if (ddMatch) {
    const [, dd, hh, mm, ss] = ddMatch.map(Number)
    return dd * 86400 + hh * 3600 + mm * 60 + ss
  }

  // HH:MM:SS
  const hmsMatch = trimmed.match(/^(\d+):(\d+):(\d+)$/)
  if (hmsMatch) {
    const [, hh, mm, ss] = hmsMatch.map(Number)
    return hh * 3600 + mm * 60 + ss
  }

  // MM:SS
  const msMatch = trimmed.match(/^(\d+):(\d+)$/)
  if (msMatch) {
    const [, mm, ss] = msMatch.map(Number)
    return mm * 60 + ss
  }

  return null
}

/**
 * Parse a single ps output line: `pcpu rss etime`
 * @param {string} line
 * @returns {{ cpuPercent: number, memBytes: number, uptimeSeconds: number }|null}
 */
export function parsePsLine(line) {
  if (!line || !line.trim()) return null
  const parts = line.trim().split(/\s+/)
  if (parts.length < 3) return null

  const cpuPercent = parseFloat(parts[0])
  const rssKb = parseInt(parts[1], 10)
  const uptimeSeconds = parseEtime(parts[2])

  if (isNaN(cpuPercent) || isNaN(rssKb) || uptimeSeconds == null) return null

  return {
    cpuPercent,
    memBytes: rssKb * 1024,
    uptimeSeconds,
  }
}

/**
 * Get CPU%, memory, and uptime for a process via `ps`.
 * @param {number} pid
 * @param {Function} [execFn]
 * @returns {Promise<{ cpuPercent: number, memBytes: number, uptimeSeconds: number }|null>}
 */
async function getPsStats(pid, execFn = defaultExec) {
  try {
    const output = await execFn(`ps -p ${pid} -o pcpu=,rss=,etime=`)
    return parsePsLine(output.trim())
  } catch {
    return null
  }
}

/**
 * Get CPU percentage for a process.
 * @param {number} pid
 * @param {number} [intervalMs] - accepted but ignored (ps gives rolling kernel average)
 * @param {Function} [execFn]
 * @returns {Promise<number|null>}
 */
export async function getCpuPercent(pid, intervalMs, execFn = defaultExec) {
  const stats = await getPsStats(pid, execFn)
  return stats?.cpuPercent ?? null
}

/**
 * Get resident memory in bytes for a process.
 * @param {number} pid
 * @param {Function} [execFn]
 * @returns {Promise<number|null>}
 */
export async function getMemBytes(pid, execFn = defaultExec) {
  const stats = await getPsStats(pid, execFn)
  return stats?.memBytes ?? null
}

/**
 * Get uptime in seconds for a process.
 * @param {number} pid
 * @param {Function} [execFn]
 * @returns {Promise<number|null>}
 */
export async function getUptimeSeconds(pid, execFn = defaultExec) {
  const stats = await getPsStats(pid, execFn)
  return stats?.uptimeSeconds ?? null
}
