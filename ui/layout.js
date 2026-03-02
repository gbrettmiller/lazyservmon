import { createServerList } from './panels/server-list.js'
import { createDetailsPanel } from './panels/details.js'
import { createLogsPanel } from './panels/logs.js'

/**
 * Assemble the three-panel layout on the screen.
 * @param {blessed.Screen} screen
 * @returns {{ serverList: blessed.List, details: blessed.Box, logs: blessed.Log }}
 */
export function createLayout(screen) {
  const serverList = createServerList(screen)
  const details = createDetailsPanel(screen)
  const logs = createLogsPanel(screen)

  // Wire resize — blessed handles this automatically with percentage-based sizes,
  // but we trigger a render on resize to be safe.
  screen.on('resize', () => {
    serverList.emit('attach')
    details.emit('attach')
    logs.emit('attach')
    screen.render()
  })

  return { serverList, details, logs }
}
