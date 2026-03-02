import { spawn } from 'node:child_process'

/**
 * Windows platform implementation — not yet implemented.
 * Note: blessed has limited Windows terminal support. A full Windows port
 * will likely require an alternative TUI library (e.g. ink, terminal-kit).
 */

class NotImplementedError extends Error {
  constructor(fn) {
    super(`${fn} is not implemented on Windows.`)
    this.name = 'NotImplementedError'
  }
}

export function getPortMap() { throw new NotImplementedError('getPortMap') }
export function scanProcesses() { throw new NotImplementedError('scanProcesses') }
export function getCpuPercent() { throw new NotImplementedError('getCpuPercent') }
export function getProjectName() { throw new NotImplementedError('getProjectName') }

/**
 * Open a URL in the default browser using the Windows `start` command.
 * @param {string} url
 */
export function openUrl(url) {
  spawn('cmd', ['/c', 'start', url], { detached: true, stdio: 'ignore' }).unref()
}
