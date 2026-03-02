import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { makeDetectedServer } from '../../../core/server/model.js'
import { getProjectName } from './project.js'
import { getMemBytes, getUptimeSeconds } from './stats.js'

const execAsync = promisify(exec)

async function defaultExec(cmd) {
  const { stdout } = await execAsync(cmd)
  return stdout
}

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
 * Parse `lsof -nP -iTCP -sTCP:LISTEN -F pcn` output into records.
 * Field-per-line format: p<pid>, c<cmd>, n<host:port>
 * @param {string} output
 * @returns {{ pid: number, command: string, port: number }[]}
 */
export function parseLsofListen(output) {
  const records = []
  const seen = new Set()
  let current = null

  for (const line of output.split('\n')) {
    if (!line) continue
    const field = line[0]
    const value = line.slice(1)

    if (field === 'p') {
      current = { pid: parseInt(value, 10), command: null, port: null }
    } else if (field === 'c' && current) {
      current.command = value
    } else if (field === 'n' && current) {
      // n*:5173 or n127.0.0.1:3000
      const portMatch = value.match(/:(\d+)$/)
      if (portMatch && !seen.has(current.pid)) {
        current.port = parseInt(portMatch[1], 10)
        seen.add(current.pid)
        records.push({ pid: current.pid, command: current.command, port: current.port })
        current = null
      }
    }
  }

  return records
}

function isDevProcess(command, hasPort) {
  if (DEV_COMMANDS.has(command)) return true
  if (command === 'node' && hasPort) return true
  return false
}

/**
 * Scan running processes for dev servers using lsof.
 * @param {Function} [execFn] - injectable exec for testing
 * @param {Function} [readFn] - injectable file reader for project name resolution
 * @returns {Promise<Server[]>}
 */
export async function scanProcesses(execFn = defaultExec, readFn = undefined) {
  let records
  try {
    const output = await execFn('lsof -nP -iTCP -sTCP:LISTEN -F pcn')
    records = parseLsofListen(output)
  } catch {
    return []
  }

  const devRecords = records.filter(r => isDevProcess(r.command, r.port !== null))

  const results = await Promise.all(devRecords.map(async ({ pid, command, port }) => {
    const [name, memBytes, uptimeSeconds] = await Promise.all([
      getProjectName(pid, execFn, readFn).catch(() => null),
      getMemBytes(pid, execFn).catch(() => null),
      getUptimeSeconds(pid, execFn).catch(() => null),
    ])

    // Extract cwd from lsof for the cwd field
    let cwd = null
    try {
      const cwdOut = await execFn(`lsof -p ${pid} -d cwd -Fn`)
      const cwdLine = cwdOut.split('\n').find(l => l.startsWith('n') && l.length > 1)
      if (cwdLine) cwd = cwdLine.slice(1)
    } catch { /* ignore */ }

    return makeDetectedServer({
      pid,
      command,
      args: [],
      cwd,
      port,
      name,
      memBytes,
      uptimeSeconds,
      cpuPercent: null, // computed separately via stats polling
    })
  }))

  return results
}
