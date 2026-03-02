import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parseLsofListen, scanProcesses } from '../../../../../services/platform/darwin/scanner.js'

const fixture = await readFile('test/fixtures/lsof-listen.txt', 'utf8')

describe('parseLsofListen', () => {
  test('parses fixture into pid/command/port records', () => {
    const records = parseLsofListen(fixture)
    assert.deepEqual(records, [
      { pid: 1234, command: 'vite', port: 5173 },
      { pid: 5678, command: 'node', port: 3000 },
      { pid: 9999, command: 'python3', port: 8080 },
    ])
  })

  test('returns empty array for empty output', () => {
    assert.deepEqual(parseLsofListen(''), [])
  })

  test('skips records missing a port line', () => {
    const output = 'p1234\ncvite\np5678\ncnode\nn*:3000\n'
    const records = parseLsofListen(output)
    // vite has no port line — skipped; node has port
    assert.deepEqual(records, [{ pid: 5678, command: 'node', port: 3000 }])
  })

  test('deduplicates by pid, taking first port', () => {
    const output = 'p1234\ncvite\nn*:5173\np1234\ncvite\nn*:5174\n'
    const records = parseLsofListen(output)
    assert.deepEqual(records, [{ pid: 1234, command: 'vite', port: 5173 }])
  })

  test('ignores c-line when no p-line has been seen yet', () => {
    const output = 'cvite\np1234\ncvite\nn*:5173\n'
    const records = parseLsofListen(output)
    assert.deepEqual(records, [{ pid: 1234, command: 'vite', port: 5173 }])
  })
})

describe('scanProcesses', () => {
  test('returns detected dev servers matching DEV_COMMANDS', async () => {
    // lsof returns vite (dev) + node with port (dev) + python3 (not dev)
    const execFn = async (cmd) => {
      if (cmd.includes('iTCP')) return fixture
      if (cmd.includes('lsof -p') && cmd.includes('cwd')) return 'n/proj\n'
      if (cmd.includes('ps -p')) return '  0.1  10240  00:01:00\n'
      return ''
    }
    const readFn = async () => '{"name": "my-project"}'
    const servers = await scanProcesses(execFn, readFn)
    // python3 is not in DEV_COMMANDS → excluded
    // node has a port → included; vite is in DEV_COMMANDS → included
    assert.equal(servers.length, 2)
    const commands = servers.map(s => s.command).sort()
    assert.deepEqual(commands, ['node', 'vite'])
  })

  test('returns empty array when lsof fails', async () => {
    const execFn = async () => { throw new Error('lsof not found') }
    const servers = await scanProcesses(execFn)
    assert.deepEqual(servers, [])
  })

  test('returns empty array when lsof output is empty', async () => {
    const execFn = async () => ''
    const servers = await scanProcesses(execFn)
    assert.deepEqual(servers, [])
  })

  test('includes port on returned server', async () => {
    const lsofOutput = 'p1234\ncvite\nn*:5173\n'
    const execFn = async (cmd) => {
      if (cmd.includes('iTCP')) return lsofOutput
      if (cmd.includes('lsof -p')) return 'n/proj\n'
      if (cmd.includes('ps')) return '  0.0  4096  00:00:10\n'
      return ''
    }
    const readFn = async () => null
    const servers = await scanProcesses(execFn, readFn)
    assert.equal(servers.length, 1)
    assert.equal(servers[0].port, 5173)
    assert.equal(servers[0].pid, 1234)
    assert.equal(servers[0].cwd, '/proj')
  })
})
