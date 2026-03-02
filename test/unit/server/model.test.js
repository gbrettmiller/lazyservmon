import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { makeServer, updateServer, makeDetectedServer, makeManagedServer } from '../../../src/server/model.js'

describe('makeServer', () => {
  test('sets all fields to defaults when called with no args', () => {
    const s = makeServer()
    assert.equal(s.id, null)
    assert.equal(s.type, 'detected')
    assert.equal(s.name, null)
    assert.equal(s.pid, null)
    assert.equal(s.command, null)
    assert.deepEqual(s.args, [])
    assert.equal(s.cwd, null)
    assert.equal(s.port, null)
    assert.equal(s.url, null)
    assert.equal(s.status, 'running')
    assert.equal(s.cpuPercent, null)
    assert.equal(s.memBytes, null)
    assert.equal(s.uptimeSeconds, null)
    assert.equal(s.configId, null)
    assert.equal(s.childProcess, null)
    assert.equal(s.autoStart, false)
  })

  test('uses provided field values', () => {
    const s = makeServer({ id: 'proc-123', pid: 123, command: 'vite', port: 5173 })
    assert.equal(s.id, 'proc-123')
    assert.equal(s.pid, 123)
    assert.equal(s.command, 'vite')
    assert.equal(s.port, 5173)
  })

  test('auto-derives url from port when url not provided', () => {
    const s = makeServer({ port: 3000 })
    assert.equal(s.url, 'http://localhost:3000')
  })

  test('url stays null when port is null', () => {
    const s = makeServer({ port: null })
    assert.equal(s.url, null)
  })

  test('explicit url overrides port-derived url', () => {
    const s = makeServer({ port: 3000, url: 'http://my-custom-url:3000' })
    assert.equal(s.url, 'http://my-custom-url:3000')
  })
})

describe('updateServer', () => {
  test('returns new object with merged fields', () => {
    const s = makeServer({ id: 'x', status: 'running', pid: 100 })
    const updated = updateServer(s, { status: 'stopped', pid: null })
    assert.equal(updated.status, 'stopped')
    assert.equal(updated.pid, null)
    assert.equal(updated.id, 'x') // unchanged
  })

  test('does not mutate original', () => {
    const s = makeServer({ status: 'running' })
    updateServer(s, { status: 'stopped' })
    assert.equal(s.status, 'running')
  })
})

describe('makeDetectedServer', () => {
  test('creates server with proc- prefixed id', () => {
    const s = makeDetectedServer({ pid: 5000, command: 'vite', port: 5173 })
    assert.equal(s.id, 'proc-5000')
    assert.equal(s.type, 'detected')
    assert.equal(s.command, 'vite')
    assert.equal(s.port, 5173)
    assert.equal(s.url, 'http://localhost:5173')
    assert.equal(s.status, 'running')
  })

  test('falls back to command as name when name is null', () => {
    const s = makeDetectedServer({ pid: 1, command: 'vite', port: null })
    assert.equal(s.name, 'vite')
  })

  test('uses provided name over command', () => {
    const s = makeDetectedServer({ pid: 1, command: 'node', name: 'my-app', port: 3000 })
    assert.equal(s.name, 'my-app')
  })
})

describe('makeManagedServer', () => {
  test('creates stopped managed server from config', () => {
    const config = {
      id: 'api',
      name: 'api-server',
      command: 'node',
      args: ['server.js'],
      cwd: '/home/user/projects/api',
      port: 3000,
      autoStart: false,
    }
    const s = makeManagedServer(config)
    assert.equal(s.id, 'api')
    assert.equal(s.type, 'managed')
    assert.equal(s.name, 'api-server')
    assert.equal(s.status, 'stopped')
    assert.equal(s.configId, 'api')
    assert.equal(s.autoStart, false)
    assert.equal(s.pid, null)
    assert.equal(s.url, 'http://localhost:3000')
  })
})
