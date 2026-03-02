import { readdir, readlink } from 'node:fs/promises'
import { basename } from 'node:path'
import { getPortMap } from './ports.js'
import { getProjectName } from './project.js'
import { getMemBytes, getUptimeSeconds } from './stats.js'
import { safeRead } from '../../../core/util/async.js'
import { makeDetectedServer } from '../../../core/server/model.js'

// Known dev server command basenames to auto-detect
const DEV_COMMANDS = new Set([
  'vite',
  'webpack',
  'webpack-dev-server',
  'next',
  'nuxt',
  'nest',
  'nodemon',
  'ts-node',
  'ts-node-dev',
  'tsx',
])

/**
 * Parse /proc/<pid>/cmdline (NUL-separated) into [command, ...args]
 * @param {string} content
 * @returns {{ command: string, args: string[] }|null}
 */
function parseCmdline(content) {
  if (!content) return null
  const parts = content.split('\0').filter(Boolean)
  if (parts.length === 0) return null
  return {
    command: basename(parts[0]),
    args: parts.slice(1),
  }
}

/**
 * Extract socket inodes from /proc/<pid>/fd/ symlinks.
 * @param {number} pid
 * @returns {Promise<Set<number>>}
 */
async function getSocketInodes(pid) {
  const inodes = new Set()
  const fdDir = `/proc/${pid}/fd`
  let entries
  try {
    entries = await readdir(fdDir)
  } catch {
    return inodes
  }

  await Promise.all(entries.map(async (fd) => {
    try {
      const target = await readlink(`${fdDir}/${fd}`)
      const match = target.match(/^socket:\[(\d+)\]$/)
      if (match) inodes.add(parseInt(match[1], 10))
    } catch {
      // fd may disappear mid-scan
    }
  }))

  return inodes
}

/**
 * Check if a process is a dev server worth showing.
 * Bare "node" processes are included only if they have a port binding.
 * @param {string} command - basename of the executable
 * @param {boolean} hasPort
 * @returns {boolean}
 */
function isDevProcess(command, hasPort) {
  if (DEV_COMMANDS.has(command)) return true
  if (command === 'node' && hasPort) return true
  return false
}

/**
 * Scan /proc for running dev server processes.
 * @returns {Promise<Server[]>}
 */
export async function scanProcesses() {
  const portMap = await getPortMap()

  let pids
  try {
    const entries = await readdir('/proc')
    pids = entries.filter(e => /^\d+$/.test(e)).map(Number)
  } catch {
    return []
  }

  const results = await Promise.all(pids.map(async (pid) => {
    const cmdlineRaw = await safeRead(`/proc/${pid}/cmdline`)
    const parsed = parseCmdline(cmdlineRaw)
    if (!parsed) return null

    const { command, args } = parsed

    // Get socket inodes and find matching ports
    const socketInodes = await getSocketInodes(pid)
    let port = null
    for (const inode of socketInodes) {
      if (portMap.has(inode)) {
        port = portMap.get(inode)
        break
      }
    }

    if (!isDevProcess(command, port !== null)) return null

    // Gather additional info
    const [cwd, name, memBytes, uptimeSeconds] = await Promise.all([
      readlink(`/proc/${pid}/cwd`).catch(() => null),
      getProjectName(pid),
      getMemBytes(pid),
      getUptimeSeconds(pid),
    ])

    return makeDetectedServer({
      pid,
      command,
      args,
      cwd,
      port,
      name,
      memBytes,
      uptimeSeconds,
      cpuPercent: null, // computed separately via stats polling
    })
  }))

  return results.filter(Boolean)
}
