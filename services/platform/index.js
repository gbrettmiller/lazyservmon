const p = process.platform
let mod

if (p === 'linux') {
  mod = await import('./linux/index.js')
} else if (p === 'darwin') {
  mod = await import('./darwin/index.js')
} else if (p === 'win32') {
  mod = await import('./win32/index.js')
} else {
  throw new Error(`Unsupported platform: ${p}`)
}

export const getPortMap = mod.getPortMap
export const scanProcesses = mod.scanProcesses
export const getCpuPercent = mod.getCpuPercent
export const getProjectName = mod.getProjectName
export const openUrl = mod.openUrl
