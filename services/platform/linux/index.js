import { spawn } from 'node:child_process'
export { getPortMap } from './ports.js'
export { scanProcesses } from './scanner.js'
export { getCpuPercent, getMemBytes, getUptimeSeconds } from './stats.js'
export { getProjectName } from './project.js'

/**
 * Open a URL in the default browser using xdg-open.
 * @param {string} url
 */
export function openUrl(url) {
  spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref()
}
