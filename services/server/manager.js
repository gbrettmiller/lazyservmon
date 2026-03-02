import { spawn } from 'node:child_process'
import { attachLogs } from './logs.js'
import { stop, kill } from './lifecycle.js'
import { updateServer } from '../../core/server/model.js'

/**
 * Manages spawning, tracking, and lifecycle of managed server processes.
 */
export class ServerManager {
  constructor(store) {
    this._store = store
    this._detachFns = new Map() // serverId → detach log fn
  }

  /**
   * Spawn a managed server.
   * @param {Server} server
   * @returns {Server} updated server with childProcess and status
   */
  spawn(server) {
    if (server.type !== 'managed') {
      throw new Error(`Cannot spawn detected server ${server.id}`)
    }
    if (server.childProcess) {
      throw new Error(`Server ${server.id} already has a child process`)
    }

    const child = spawn(server.command, server.args, {
      cwd: server.cwd ?? undefined,
      env: { ...process.env, ...(server.env ?? {}) },
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    const detach = attachLogs(child, (line) => {
      this._store.addLogLine(server.id, line, this._store.getState().settings?.maxLogLines ?? 500)
    })
    this._detachFns.set(server.id, detach)

    const updated = updateServer(server, {
      pid: child.pid,
      childProcess: child,
      status: 'starting',
    })

    child.on('exit', (code, _signal) => {
      this._detachFns.get(server.id)?.()
      this._detachFns.delete(server.id)
      const status = code === 0 ? 'stopped' : 'crashed'
      const current = this._store.getState().servers.find(s => s.id === server.id)
      if (current) {
        const servers = this._store.getState().servers.map(s =>
          s.id === server.id ? updateServer(s, { pid: null, childProcess: null, status, cpuPercent: null }) : s
        )
        this._store.setState({ servers })
      }
    })

    return updated
  }

  /**
   * Stop a managed server gracefully.
   * @param {Server} server
   * @returns {Promise<void>}
   */
  async stop(server) {
    if (!server.childProcess) return
    await stop(server.childProcess)
  }

  /**
   * Kill a managed server immediately.
   * @param {Server} server
   */
  kill(server) {
    if (!server.childProcess) return
    kill(server.childProcess)
  }

  /**
   * Restart a managed server.
   * @param {Server} server
   * @returns {Promise<Server>}
   */
  async restart(server) {
    await this.stop(server)
    // Get fresh copy from store after stop
    const fresh = this._store.getState().servers.find(s => s.id === server.id)
    return this.spawn({ ...(fresh ?? server), childProcess: null, pid: null })
  }
}
