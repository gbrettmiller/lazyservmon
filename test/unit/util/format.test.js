import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { formatBytes, formatDuration, formatCpu } from '../../../src/util/format.js'

describe('formatBytes', () => {
  test('null returns N/A', () => {
    assert.equal(formatBytes(null), 'N/A')
  })

  test('0 bytes', () => {
    assert.equal(formatBytes(0), '0 B')
  })

  test('bytes under 1KB', () => {
    assert.equal(formatBytes(512), '512 B')
  })

  test('kilobytes', () => {
    assert.equal(formatBytes(1024), '1.0 KB')
    assert.equal(formatBytes(1536), '1.5 KB')
  })

  test('megabytes', () => {
    assert.equal(formatBytes(1024 * 1024), '1.0 MB')
    assert.equal(formatBytes(45 * 1024 * 1024), '45.0 MB')
  })

  test('gigabytes', () => {
    assert.equal(formatBytes(1024 * 1024 * 1024), '1.00 GB')
    assert.equal(formatBytes(2.5 * 1024 * 1024 * 1024), '2.50 GB')
  })
})

describe('formatDuration', () => {
  test('null returns N/A', () => {
    assert.equal(formatDuration(null), 'N/A')
  })

  test('under 60 seconds', () => {
    assert.equal(formatDuration(0), '0s')
    assert.equal(formatDuration(45), '45s')
    assert.equal(formatDuration(59), '59s')
  })

  test('minutes and seconds', () => {
    assert.equal(formatDuration(60), '1m 0s')
    assert.equal(formatDuration(754), '12m 34s')
    assert.equal(formatDuration(3599), '59m 59s')
  })

  test('hours and minutes', () => {
    assert.equal(formatDuration(3600), '1h 0m')
    assert.equal(formatDuration(3661), '1h 1m')
    assert.equal(formatDuration(7384), '2h 3m')
  })

  test('fractional seconds are floored', () => {
    assert.equal(formatDuration(1.9), '1s')
    assert.equal(formatDuration(61.9), '1m 1s')
  })
})

describe('formatCpu', () => {
  test('null returns N/A', () => {
    assert.equal(formatCpu(null), 'N/A')
  })

  test('zero', () => {
    assert.equal(formatCpu(0), '0.0%')
  })

  test('typical values', () => {
    assert.equal(formatCpu(2.1), '2.1%')
    assert.equal(formatCpu(100), '100.0%')
    assert.equal(formatCpu(0.05), '0.1%')
  })

  test('rounds to one decimal', () => {
    assert.equal(formatCpu(2.16), '2.2%')
    assert.equal(formatCpu(99.99), '100.0%')
  })
})
