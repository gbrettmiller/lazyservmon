import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parseEtime, parsePsLine, getCpuPercent, getMemBytes, getUptimeSeconds } from '../../../../../services/platform/darwin/stats.js'

const fixture = (await readFile('test/fixtures/ps-stats.txt', 'utf8')).trim()

describe('parseEtime', () => {
  test('parses MM:SS', () => {
    assert.equal(parseEtime('02:30'), 150)
  })

  test('parses HH:MM:SS', () => {
    assert.equal(parseEtime('1:23:45'), 5025)
  })

  test('parses DD-HH:MM:SS', () => {
    assert.equal(parseEtime('2-03:04:05'), 2 * 86400 + 3 * 3600 + 4 * 60 + 5)
  })

  test('returns null for empty string', () => {
    assert.equal(parseEtime(''), null)
  })

  test('returns null for unrecognised format', () => {
    assert.equal(parseEtime('notadate'), null)
  })
})

describe('parsePsLine', () => {
  test('parses fixture line', () => {
    const result = parsePsLine(fixture)
    assert.ok(result)
    assert.equal(result.cpuPercent, 0.3)
    assert.equal(result.memBytes, 204800 * 1024)
    assert.equal(result.uptimeSeconds, 5025) // 1*3600 + 23*60 + 45
  })

  test('returns null for empty string', () => {
    assert.equal(parsePsLine(''), null)
  })

  test('returns null for whitespace-only string', () => {
    assert.equal(parsePsLine('   '), null)
  })

  test('handles zero CPU', () => {
    const result = parsePsLine('  0.0  51200  00:00:05')
    assert.ok(result)
    assert.equal(result.cpuPercent, 0.0)
    assert.equal(result.memBytes, 51200 * 1024)
    assert.equal(result.uptimeSeconds, 5)
  })

  test('handles days in etime', () => {
    const result = parsePsLine('  1.5 102400  1-00:00:00')
    assert.ok(result)
    assert.equal(result.uptimeSeconds, 86400)
  })

  test('returns null when fewer than 3 fields', () => {
    assert.equal(parsePsLine('0.3 1024'), null)
  })

  test('returns null when cpu field is not a number', () => {
    assert.equal(parsePsLine('bad 1024 00:01:00'), null)
  })
})

describe('getCpuPercent / getMemBytes / getUptimeSeconds', () => {
  const makeExecFn = (line) => async () => line

  test('getCpuPercent returns cpuPercent from ps output', async () => {
    const result = await getCpuPercent(1234, undefined, makeExecFn('  1.2 8192  00:05:00'))
    assert.equal(result, 1.2)
  })

  test('getCpuPercent returns null when ps fails', async () => {
    const result = await getCpuPercent(1234, undefined, async () => { throw new Error('no proc') })
    assert.equal(result, null)
  })

  test('getMemBytes returns memBytes from ps output', async () => {
    const result = await getMemBytes(1234, makeExecFn('  0.5 16384  00:01:00'))
    assert.equal(result, 16384 * 1024)
  })

  test('getUptimeSeconds returns uptimeSeconds from ps output', async () => {
    const result = await getUptimeSeconds(1234, makeExecFn('  0.0 4096  00:02:30'))
    assert.equal(result, 150)
  })
})
