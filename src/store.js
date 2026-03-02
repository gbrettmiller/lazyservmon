import { EventEmitter } from 'node:events'

/**
 * Application state store backed by EventEmitter.
 * Events:
 *   'change' — emitted after any setState() call with the new state
 *   'log'    — emitted when a log line is added: { serverId, line }
 */
class Store extends EventEmitter {
  constructor(initialState = {}) {
    super()
    this._state = {
      servers: [],
      selectedId: null,
      logLines: {},  // Map<serverId, string[]>
      ...initialState,
    }
  }

  /**
   * Get a snapshot of the current state (shallow copy).
   * @returns {object}
   */
  getState() {
    return { ...this._state }
  }

  /**
   * Merge partial state updates and emit 'change'.
   * @param {Partial<object>} updates
   */
  setState(updates) {
    this._state = { ...this._state, ...updates }
    this.emit('change', this._state)
  }

  /**
   * Append a log line for a server and emit 'log'.
   * Trims to maxLines (default 500).
   * @param {string} serverId
   * @param {string} line
   * @param {number} [maxLines=500]
   */
  addLogLine(serverId, line, maxLines = 500) {
    const existing = this._state.logLines[serverId] ?? []
    const updated = existing.length >= maxLines
      ? [...existing.slice(1), line]
      : [...existing, line]
    this._state = {
      ...this._state,
      logLines: { ...this._state.logLines, [serverId]: updated },
    }
    this.emit('log', { serverId, line })
  }

  /**
   * Get log lines for a server.
   * @param {string} serverId
   * @returns {string[]}
   */
  getLogs(serverId) {
    return this._state.logLines[serverId] ?? []
  }

  /**
   * Clear log lines for a server.
   * @param {string} serverId
   */
  clearLogs(serverId) {
    this._state = {
      ...this._state,
      logLines: { ...this._state.logLines, [serverId]: [] },
    }
  }
}

export function createStore(initialState = {}) {
  return new Store(initialState)
}
