import { spawn } from 'node:child_process'

/**
 * macOS platform implementation — process scanning not yet implemented.
 * See macos-plan.md for the planned lsof/ps approach.
 * openUrl is functional via the macOS `open` command.
 */

class NotImplementedError extends Error {
  constructor(fn) {
    super(`${fn} is not implemented on macOS. See macos-plan.md for the implementation plan.`)
    this.name = 'NotImplementedError'
  }
}

export function getPortMap() { throw new NotImplementedError('getPortMap') }
export function scanProcesses() { throw new NotImplementedError('scanProcesses') }
export function getCpuPercent() { throw new NotImplementedError('getCpuPercent') }
export function getProjectName() { throw new NotImplementedError('getProjectName') }

/**
 * Open a URL in the default browser using the macOS `open` command.
 * @param {string} url
 */
export function openUrl(url) {
  spawn('open', [url], { detached: true, stdio: 'ignore' }).unref()
}
