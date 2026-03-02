import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { stop, kill, killPid, stopPid } from '../../../../services/server/lifecycle.js'

// Minimal ChildProcess stub
function makeProc({ exitCode = null } = {}) {
  const proc = new EventEmitter()
  proc.exitCode = exitCode
  proc.killed = []
  proc.kill = (signal) => {
    proc.killed.push(signal)
  }
  return proc
}

describe('kill', () => {
  test('sends SIGKILL to a running process', () => {
    const proc = makeProc()
    kill(proc)
    assert.deepEqual(proc.killed, ['SIGKILL'])
  })

  test('does nothing when proc is null', () => {
    assert.doesNotThrow(() => kill(null))
  })

  test('does nothing when process has already exited', () => {
    const proc = makeProc({ exitCode: 0 })
    kill(proc)
    assert.deepEqual(proc.killed, [])
  })
})

describe('stop', () => {
  test('does nothing when proc is null', async () => {
    await assert.doesNotReject(() => stop(null))
  })

  test('does nothing when process has already exited', async () => {
    const proc = makeProc({ exitCode: 0 })
    await stop(proc)
    assert.deepEqual(proc.killed, [])
  })

  test('sends SIGTERM and resolves when process exits before timeout', async () => {
    const proc = makeProc()
    // Simulate the process responding to SIGTERM by exiting promptly
    const originalKill = proc.kill.bind(proc)
    proc.kill = (signal) => {
      originalKill(signal)
      if (signal === 'SIGTERM') {
        setImmediate(() => proc.emit('exit', 0, null))
      }
    }
    await stop(proc, 5000)
    assert.ok(proc.killed.includes('SIGTERM'))
    assert.ok(!proc.killed.includes('SIGKILL'))
  })

  test('escalates to SIGKILL when process does not exit within timeout', async () => {
    const proc = makeProc()
    // Process never emits 'exit', so the timer fires
    await stop(proc, 20)
    assert.ok(proc.killed.includes('SIGTERM'))
    assert.ok(proc.killed.includes('SIGKILL'))
  })

  test('does not send SIGKILL when process exits before timeout fires', async () => {
    const proc = makeProc()
    proc.kill = (signal) => {
      proc.killed.push(signal)
      // Simulate exit on SIGTERM
      if (signal === 'SIGTERM') {
        proc.exitCode = 0
        setImmediate(() => proc.emit('exit', 0, null))
      }
    }
    await stop(proc, 5000)
    assert.deepEqual(proc.killed, ['SIGTERM'])
  })
})

describe('killPid', () => {
  test('swallows error when PID does not exist', () => {
    assert.doesNotThrow(() => killPid(999999999))
  })

  test('swallows error for non-existent PID with explicit SIGKILL', () => {
    assert.doesNotThrow(() => killPid(999999999, 'SIGKILL'))
  })
})

describe('stopPid', () => {
  test('resolves after the timeout even when PID is gone', async () => {
    // Non-existent PID — both killPid calls will be swallowed
    const start = Date.now()
    await stopPid(999999999, 30)
    const elapsed = Date.now() - start
    assert.ok(elapsed >= 25, `expected at least 25ms, got ${elapsed}ms`)
  })
})
