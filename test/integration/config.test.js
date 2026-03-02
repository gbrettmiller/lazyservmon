import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { loadConfig, saveConfig } from '../../src/config.js'

describe('config round-trip', () => {
  let tmpDir
  let configPath

  before(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'server-monitor-test-'))
    configPath = join(tmpDir, 'config.json')
  })

  after(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  test('returns defaults when file does not exist', async () => {
    const config = await loadConfig(configPath)
    assert.equal(config.version, 1)
    assert.deepEqual(config.servers, [])
    assert.equal(config.settings.scanIntervalMs, 2000)
    assert.equal(config.settings.statsIntervalMs, 1000)
    assert.equal(config.settings.maxLogLines, 500)
  })

  test('saves and reloads config correctly', async () => {
    const original = {
      version: 1,
      servers: [
        {
          id: 'api',
          name: 'api-server',
          command: 'node',
          args: ['server.js'],
          cwd: '/home/user/projects/api',
          port: 3000,
          autoStart: false,
        },
      ],
      settings: {
        scanIntervalMs: 3000,
        statsIntervalMs: 500,
        maxLogLines: 250,
      },
    }

    await saveConfig(original, configPath)
    const loaded = await loadConfig(configPath)

    assert.equal(loaded.version, 1)
    assert.equal(loaded.servers.length, 1)
    assert.equal(loaded.servers[0].id, 'api')
    assert.equal(loaded.servers[0].name, 'api-server')
    assert.equal(loaded.settings.scanIntervalMs, 3000)
    assert.equal(loaded.settings.maxLogLines, 250)
  })

  test('merges missing settings with defaults', async () => {
    await saveConfig({ version: 1, servers: [], settings: { scanIntervalMs: 5000 } }, configPath)
    const loaded = await loadConfig(configPath)
    assert.equal(loaded.settings.scanIntervalMs, 5000)
    // These should fall back to defaults
    assert.equal(loaded.settings.statsIntervalMs, 1000)
    assert.equal(loaded.settings.maxLogLines, 500)
  })

  test('creates parent directory if it does not exist', async () => {
    const nestedPath = join(tmpDir, 'nested', 'deep', 'config.json')
    const config = { version: 1, servers: [], settings: { scanIntervalMs: 2000, statsIntervalMs: 1000, maxLogLines: 500 } }
    await saveConfig(config, nestedPath)
    const loaded = await loadConfig(nestedPath)
    assert.equal(loaded.version, 1)
  })
})
