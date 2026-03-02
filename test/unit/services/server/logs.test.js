import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { Readable } from 'node:stream'
import { attachLogs } from '../../../../services/server/logs.js'

// Build a minimal ChildProcess stub with controllable stdout/stderr streams
function makeProc({ stdout = true, stderr = true } = {}) {
  const proc = new EventEmitter()
  proc.stdout = stdout ? new Readable({ read() {} }) : null
  proc.stderr = stderr ? new Readable({ read() {} }) : null
  return proc
}

function pushLine(stream, line) {
  stream.push(`${line}\n`)
}

describe('attachLogs', () => {
  test('calls onLine for each stdout line', async () => {
    const proc = makeProc()
    const lines = []
    attachLogs(proc, (line) => lines.push(line))

    pushLine(proc.stdout, 'ready on port 3000')
    pushLine(proc.stdout, 'connected to db')

    // Allow readline to process the buffered data
    await new Promise(resolve => setImmediate(resolve))

    assert.deepEqual(lines, ['ready on port 3000', 'connected to db'])
  })

  test('prefixes stderr lines with [stderr]', async () => {
    const proc = makeProc()
    const lines = []
    attachLogs(proc, (line) => lines.push(line))

    pushLine(proc.stderr, 'uncaught exception')

    await new Promise(resolve => setImmediate(resolve))

    assert.equal(lines.length, 1)
    assert.equal(lines[0], '[stderr] uncaught exception')
  })

  test('handles stdout and stderr interleaved', async () => {
    const proc = makeProc()
    const lines = []
    attachLogs(proc, (line) => lines.push(line))

    pushLine(proc.stdout, 'stdout line')
    pushLine(proc.stderr, 'stderr line')

    await new Promise(resolve => setImmediate(resolve))

    assert.ok(lines.includes('stdout line'))
    assert.ok(lines.includes('[stderr] stderr line'))
    assert.equal(lines.length, 2)
  })

  test('does not prefix stdout lines', async () => {
    const proc = makeProc()
    const lines = []
    attachLogs(proc, (line) => lines.push(line))

    pushLine(proc.stdout, 'plain output')

    await new Promise(resolve => setImmediate(resolve))

    assert.equal(lines[0], 'plain output')
  })

  test('tolerates null stdout', async () => {
    const proc = makeProc({ stdout: false, stderr: true })
    const lines = []
    assert.doesNotThrow(() => attachLogs(proc, (line) => lines.push(line)))

    pushLine(proc.stderr, 'only stderr')

    await new Promise(resolve => setImmediate(resolve))

    assert.deepEqual(lines, ['[stderr] only stderr'])
  })

  test('tolerates null stderr', async () => {
    const proc = makeProc({ stdout: true, stderr: false })
    const lines = []
    assert.doesNotThrow(() => attachLogs(proc, (line) => lines.push(line)))

    pushLine(proc.stdout, 'only stdout')

    await new Promise(resolve => setImmediate(resolve))

    assert.deepEqual(lines, ['only stdout'])
  })

  test('returns a detach function', () => {
    const proc = makeProc()
    const detach = attachLogs(proc, () => {})
    assert.equal(typeof detach, 'function')
  })

  test('detach stops further lines from being delivered', async () => {
    const proc = makeProc()
    const lines = []
    const detach = attachLogs(proc, (line) => lines.push(line))

    pushLine(proc.stdout, 'before detach')
    await new Promise(resolve => setImmediate(resolve))

    detach()

    pushLine(proc.stdout, 'after detach')
    await new Promise(resolve => setImmediate(resolve))

    assert.deepEqual(lines, ['before detach'])
  })
})
