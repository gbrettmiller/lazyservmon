import { loadConfig } from '../services/config.js'
import { createStore } from '../core/store.js'
import { scanProcesses, getCpuPercent } from '../services/platform/index.js'
import { makeManagedServer, updateServer } from '../core/server/model.js'
import { ServerManager } from '../services/server/manager.js'
import { getScreen, destroyScreen } from '../ui/screen.js'
import { createLayout } from '../ui/layout.js'
import { render } from '../ui/renderer.js'
import { registerKeys } from '../ui/keys.js'

/**
 * Main application orchestrator.
 */
export async function createApp() {
  const config = await loadConfig()
  const store = createStore({
    servers: config.servers.map(makeManagedServer),
    selectedId: null,
    logLines: {},
  })

  const screen = getScreen()
  const widgets = createLayout(screen)
  const manager = new ServerManager(store)

  // Initial render
  const doRender = () => render(store.getState(), widgets, screen)
  store.on('change', doRender)
  store.on('log', doRender)

  // Auto-start managed servers
  const initialServers = store.getState().servers
  const startedServers = initialServers.map(s => {
    if (s.type === 'managed' && s.autoStart) {
      return manager.spawn(s)
    }
    return s
  })
  store.setState({ servers: startedServers })

  // Set initial selection
  if (startedServers.length > 0) {
    store.setState({ selectedId: startedServers[0].id })
  }

  // Scan interval
  const { scanIntervalMs, statsIntervalMs } = config.settings

  const scanInterval = setInterval(async () => {
    try {
      const detected = await scanProcesses()
      const { servers } = store.getState()

      // Keep managed servers, replace detected servers
      const managed = servers.filter(s => s.type === 'managed')
      const merged = [...managed, ...detected]

      // Preserve selection if possible
      const { selectedId } = store.getState()
      const stillExists = merged.find(s => s.id === selectedId)
      const newSelectedId = stillExists
        ? selectedId
        : (merged[0]?.id ?? null)

      store.setState({ servers: merged, selectedId: newSelectedId })
    } catch {
      // Scan errors are transient — ignore
    }
  }, scanIntervalMs)

  // Stats interval: update CPU/mem for running servers
  const statsInterval = setInterval(async () => {
    const { servers } = store.getState()
    const running = servers.filter(s => s.pid && s.status === 'running')

    await Promise.all(running.map(async (s) => {
      try {
        const cpuPercent = await getCpuPercent(s.pid, 200)
        const updated = updateServer(s, { cpuPercent })
        const { servers: current } = store.getState()
        store.setState({
          servers: current.map(sv => sv.id === updated.id ? updated : sv),
        })
      } catch {
        // Process may have exited
      }
    }))
  }, statsIntervalMs)

  // Reload config
  const reloadConfig = async () => {
    try {
      const fresh = await loadConfig()
      const { servers } = store.getState()
      const detected = servers.filter(s => s.type === 'detected')
      const managed = fresh.servers.map(sc => {
        const existing = servers.find(s => s.configId === sc.id)
        return existing ?? makeManagedServer(sc)
      })
      store.setState({ servers: [...managed, ...detected] })
    } catch {
      // Reload errors — ignore
    }
  }

  registerKeys(screen, widgets, store, manager, quit, reloadConfig)

  // Initial render
  doRender()

  function quit() {
    clearInterval(scanInterval)
    clearInterval(statsInterval)
    destroyScreen()
    process.exit(0)
  }

  return { store, quit }
}
