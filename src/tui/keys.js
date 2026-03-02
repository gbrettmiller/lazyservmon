import blessed from 'blessed'
import { spawn } from 'node:child_process'
import { killPid, stopPid } from '../server/lifecycle.js'

const HELP_TEXT = [
  '{bold}Keyboard Bindings{/bold}',
  '',
  '  {bold}j / k / ↑↓{/bold}   Navigate server list',
  '  {bold}Tab{/bold}           Cycle panel focus',
  '  {bold}o{/bold}             Open URL in browser (xdg-open)',
  '  {bold}s{/bold}             Stop (SIGTERM → SIGKILL after 5s)',
  '  {bold}x{/bold}             Kill (SIGKILL immediately)',
  '  {bold}r{/bold}             Restart (managed servers only)',
  '  {bold}l{/bold}             Focus log panel',
  '  {bold}R{/bold}             Reload config from disk',
  '  {bold}?{/bold}             Toggle this help',
  '  {bold}q / C-c{/bold}       Quit',
  '',
  'Press {bold}?{/bold} to dismiss.',
].join('\n')

/**
 * Register all key bindings on the screen and widgets.
 * @param {blessed.Screen} screen
 * @param {object} widgets - { serverList, details, logs }
 * @param {Store} store
 * @param {ServerManager} manager
 * @param {Function} onQuit
 * @param {Function} onReloadConfig
 */
export function registerKeys(screen, widgets, store, manager, onQuit, onReloadConfig) {
  const { serverList, details, logs } = widgets
  const panels = [serverList, details, logs]
  let focusIndex = 0
  let helpBox = null

  // Quit
  screen.key(['q', 'C-c'], onQuit)

  // Tab: cycle focus
  screen.key('tab', () => {
    focusIndex = (focusIndex + 1) % panels.length
    panels[focusIndex].focus()
    screen.render()
  })

  // Navigation: when server list selection changes, update selectedId
  serverList.on('select item', (_item, index) => {
    const { servers } = store.getState()
    const server = servers[index]
    if (server) store.setState({ selectedId: server.id })
  })

  // j/k: focus server list and move selection
  screen.key(['j', 'down'], () => {
    serverList.focus()
    focusIndex = 0
    serverList.down(1)
    serverList.emit('select item', null, serverList.selected)
    screen.render()
  })

  screen.key(['k', 'up'], () => {
    serverList.focus()
    focusIndex = 0
    serverList.up(1)
    serverList.emit('select item', null, serverList.selected)
    screen.render()
  })

  // Focus log panel
  screen.key('l', () => {
    logs.focus()
    focusIndex = 2
    screen.render()
  })

  // Open in browser
  screen.key('o', () => {
    const { servers, selectedId } = store.getState()
    const server = servers.find(s => s.id === selectedId)
    if (server?.url) {
      spawn('xdg-open', [server.url], { detached: true, stdio: 'ignore' }).unref()
    }
  })

  // Stop (SIGTERM → SIGKILL after 5s)
  screen.key('s', () => {
    const { servers, selectedId } = store.getState()
    const server = servers.find(s => s.id === selectedId)
    if (!server) return

    if (server.type === 'managed' && server.childProcess) {
      manager.stop(server).catch(() => {})
    } else if (server.pid) {
      stopPid(server.pid).catch(() => {})
    }
  })

  // Kill (SIGKILL immediately)
  screen.key('x', () => {
    const { servers, selectedId } = store.getState()
    const server = servers.find(s => s.id === selectedId)
    if (!server) return

    if (server.type === 'managed' && server.childProcess) {
      manager.kill(server)
    } else if (server.pid) {
      killPid(server.pid, 'SIGKILL')
    }
  })

  // Restart (managed only)
  screen.key('r', async () => {
    const { servers, selectedId } = store.getState()
    const server = servers.find(s => s.id === selectedId)
    if (!server || server.type !== 'managed') return

    try {
      const updated = await manager.restart(server)
      const newServers = store.getState().servers.map(s =>
        s.id === updated.id ? updated : s
      )
      store.setState({ servers: newServers })
    } catch {
      // ignore restart errors
    }
  })

  // Reload config from disk
  screen.key('R', () => {
    if (onReloadConfig) onReloadConfig()
  })

  // Help toggle
  screen.key('?', () => {
    if (helpBox) {
      helpBox.destroy()
      helpBox = null
    } else {
      helpBox = blessed.box({
        parent: screen,
        top: 'center',
        left: 'center',
        width: 54,
        height: 18,
        border: { type: 'line' },
        label: ' Help ',
        content: HELP_TEXT,
        tags: true,
        style: {
          border: { fg: 'yellow' },
          label: { fg: 'yellow' },
          bg: 'black',
          fg: 'white',
        },
        keys: true,
      })
      helpBox.key(['q', '?', 'escape'], () => {
        helpBox.destroy()
        helpBox = null
        screen.render()
      })
      helpBox.focus()
    }
    screen.render()
  })

  // Initial focus on server list
  serverList.focus()
}
