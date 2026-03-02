import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { createStore } from '../../../core/store.js'

describe('createStore', () => {
  test('initialises with default state shape', () => {
    const store = createStore()
    const state = store.getState()
    assert.deepEqual(state.servers, [])
    assert.equal(state.selectedId, null)
    assert.deepEqual(state.logLines, {})
  })

  test('merges provided initial state over defaults', () => {
    const store = createStore({ selectedId: 'api', servers: [{ id: 'api' }] })
    const state = store.getState()
    assert.equal(state.selectedId, 'api')
    assert.equal(state.servers.length, 1)
    assert.deepEqual(state.logLines, {})
  })
})

describe('getState', () => {
  test('returns a shallow copy — the returned object is not the internal reference', () => {
    const store = createStore()
    const stateA = store.getState()
    const stateB = store.getState()
    // Each call produces a distinct object
    assert.notEqual(stateA, stateB)
  })

  test('top-level properties reflect current state', () => {
    const store = createStore({ selectedId: 'api' })
    assert.equal(store.getState().selectedId, 'api')
    store.setState({ selectedId: 'web' })
    assert.equal(store.getState().selectedId, 'web')
  })
})

describe('setState', () => {
  test('merges partial updates into state', () => {
    const store = createStore()
    store.setState({ selectedId: 'web' })
    assert.equal(store.getState().selectedId, 'web')
    assert.deepEqual(store.getState().servers, [])
  })

  test('emits change event with new state', () => {
    const store = createStore()
    let emitted = null
    store.on('change', (state) => { emitted = state })
    store.setState({ selectedId: 'web' })
    assert.ok(emitted !== null)
    assert.equal(emitted.selectedId, 'web')
  })

  test('does not mutate previous snapshot', () => {
    const store = createStore()
    const before = store.getState()
    store.setState({ selectedId: 'web' })
    assert.equal(before.selectedId, null)
  })
})

describe('addLogLine', () => {
  test('appends a line for a new server', () => {
    const store = createStore()
    store.addLogLine('api', 'server started')
    assert.deepEqual(store.getLogs('api'), ['server started'])
  })

  test('appends subsequent lines in order', () => {
    const store = createStore()
    store.addLogLine('api', 'line 1')
    store.addLogLine('api', 'line 2')
    store.addLogLine('api', 'line 3')
    assert.deepEqual(store.getLogs('api'), ['line 1', 'line 2', 'line 3'])
  })

  test('does not affect logs for other servers', () => {
    const store = createStore()
    store.addLogLine('api', 'api log')
    store.addLogLine('web', 'web log')
    assert.deepEqual(store.getLogs('api'), ['api log'])
    assert.deepEqual(store.getLogs('web'), ['web log'])
  })

  test('emits log event with serverId and line', () => {
    const store = createStore()
    let emitted = null
    store.on('log', (payload) => { emitted = payload })
    store.addLogLine('api', 'hello')
    assert.deepEqual(emitted, { serverId: 'api', line: 'hello' })
  })

  test('trims to maxLines when buffer is full', () => {
    const store = createStore()
    const maxLines = 5
    for (let i = 0; i < maxLines; i++) {
      store.addLogLine('api', `line ${i}`, maxLines)
    }
    // Buffer is exactly full — adding one more should drop the oldest
    store.addLogLine('api', 'line 5', maxLines)
    const logs = store.getLogs('api')
    assert.equal(logs.length, maxLines)
    assert.equal(logs[0], 'line 1')
    assert.equal(logs[maxLines - 1], 'line 5')
  })

  test('default maxLines is 500', () => {
    const store = createStore()
    for (let i = 0; i < 501; i++) {
      store.addLogLine('api', `line ${i}`)
    }
    assert.equal(store.getLogs('api').length, 500)
    assert.equal(store.getLogs('api')[0], 'line 1')
  })

  test('does not emit change event', () => {
    const store = createStore()
    let changeCount = 0
    store.on('change', () => { changeCount++ })
    store.addLogLine('api', 'a line')
    assert.equal(changeCount, 0)
  })
})

describe('getLogs', () => {
  test('returns empty array for unknown server', () => {
    const store = createStore()
    assert.deepEqual(store.getLogs('unknown'), [])
  })

  test('returns current lines for known server', () => {
    const store = createStore()
    store.addLogLine('api', 'hello')
    assert.deepEqual(store.getLogs('api'), ['hello'])
  })
})

describe('clearLogs', () => {
  test('empties lines for specified server', () => {
    const store = createStore()
    store.addLogLine('api', 'line 1')
    store.addLogLine('api', 'line 2')
    store.clearLogs('api')
    assert.deepEqual(store.getLogs('api'), [])
  })

  test('does not affect other servers', () => {
    const store = createStore()
    store.addLogLine('api', 'api line')
    store.addLogLine('web', 'web line')
    store.clearLogs('api')
    assert.deepEqual(store.getLogs('web'), ['web line'])
  })

  test('is safe to call when no lines exist', () => {
    const store = createStore()
    assert.doesNotThrow(() => store.clearLogs('api'))
    assert.deepEqual(store.getLogs('api'), [])
  })
})
