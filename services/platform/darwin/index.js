import { spawn } from 'node:child_process'
export { scanProcesses } from './scanner.js'
export { getCpuPercent, getMemBytes, getUptimeSeconds } from './stats.js'
export { getProjectName } from './project.js'

/**
 * Open a URL in the default browser using the macOS `open` command.
 * @param {string} url
 */
export function openUrl(url) {
  spawn('open', [url], { detached: true, stdio: 'ignore' }).unref()
}
