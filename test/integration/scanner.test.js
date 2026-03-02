import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { scanProcesses } from '../../services/platform/linux/scanner.js'

const TEST_PORT = 19999

// A minimal HTTP server that listens on TEST_PORT
const SERVER_CODE = `
const http = require('http')
const server = http.createServer((req, res) => res.end('ok'))
server.listen(${TEST_PORT}, '127.0.0.1', () => {
  if (process.send) process.send('ready')
})
`

describe('scanner integration', () => {
  let child

  before(async () => {
    await new Promise((resolve, reject) => {
      child = spawn(process.execPath, ['-e', SERVER_CODE], {
        stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
      })
      child.on('message', (msg) => {
        if (msg === 'ready') resolve()
      })
      child.on('error', reject)
      // Fallback: give it 2s to start
      setTimeout(resolve, 2000)
    })
  })

  after(() => {
    if (child && !child.killed) child.kill('SIGKILL')
  })

  test('detects spawned node process listening on port', async () => {
    // Give the OS time to register the socket
    await new Promise(r => setTimeout(r, 500))

    const servers = await scanProcesses()
    const found = servers.find(s => s.port === TEST_PORT)
    assert.ok(found, `Expected to find a server on port ${TEST_PORT}. Found: ${JSON.stringify(servers.map(s => ({ pid: s.pid, port: s.port, cmd: s.command })))}`)
    assert.equal(found.type, 'detected')
    assert.equal(found.command, 'node')
    assert.ok(found.pid > 0)
    assert.ok(found.id.startsWith('proc-'))
  })
})
