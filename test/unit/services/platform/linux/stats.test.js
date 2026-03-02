import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { parseStatLine } from '../../../../../services/platform/linux/stats.js'

describe('parseStatLine', () => {
  test('parses fixture stat line', () => {
    // From test/fixtures/proc-stat.txt
    // Field layout after last ')':
    // state=S(0), ppid=12344(1), pgrp=12345(2), session=12345(3), tty=0(4), tpgid=-1(5),
    // flags=4194304(6), minflt=12345(7), cminflt=0(8), majflt=0(9), cmajflt=0(10),
    // utime=150(11), stime=50(12), cutime=0(13), cstime=0(14), priority=20(15),
    // nice=0(16), num_threads=5(17), itrealvalue=0(18), starttime=1234567(19)
    const line = '12345 (node) S 12344 12345 12345 0 -1 4194304 12345 0 0 0 150 50 0 0 20 0 5 0 1234567 123456789 30000 18446744073709551615 1 1 0 0 0 0 0 16781312 134217728 0 0 0 17 3 0 0 0 0 0 0 0 0 0 0 0 0 0'
    const result = parseStatLine(line)
    assert.ok(result)
    assert.equal(result.utime, 150)
    assert.equal(result.stime, 50)
    assert.equal(result.totalTime, 200)
    assert.equal(result.starttime, 1234567)
  })

  test('handles process name with spaces and parens', () => {
    const line = '999 (my (weird) app) S 998 999 999 0 -1 4194304 100 0 0 0 80 20 0 0 20 0 1 0 5000 50000000 10000 18446744073709551615 1 1 0 0 0 0 0 0 0 0 0 0 17 0 0 0'
    const result = parseStatLine(line)
    assert.ok(result)
    assert.equal(result.utime, 80)
    assert.equal(result.stime, 20)
    assert.equal(result.totalTime, 100)
    assert.equal(result.starttime, 5000)
  })

  test('returns null for null input', () => {
    assert.equal(parseStatLine(null), null)
  })

  test('returns null for empty string', () => {
    assert.equal(parseStatLine(''), null)
  })

  test('returns null for malformed input without parens', () => {
    assert.equal(parseStatLine('12345 node S 1 2 3'), null)
  })
})

describe('CPU delta calculation', () => {
  test('computes correct CPU percentage from two stat snapshots', () => {
    // Simulate what getCpuPercent does:
    // elapsed system time: 1 second = 100 ticks (CLK_TCK=100)
    // process used 10 more ticks → 10%
    const stat1 = parseStatLine('100 (node) S 1 100 100 0 -1 0 0 0 0 0 80 20 0 0 20 0 1 0 100 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0')
    const stat2 = parseStatLine('100 (node) S 1 100 100 0 -1 0 0 0 0 0 87 23 0 0 20 0 1 0 100 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0')

    assert.ok(stat1)
    assert.ok(stat2)

    const elapsedTicks = 100 // 1 second at CLK_TCK=100
    const processTicks = stat2.totalTime - stat1.totalTime
    const cpuPercent = (processTicks / elapsedTicks) * 100

    assert.equal(processTicks, 10)
    assert.equal(cpuPercent, 10)
  })
})
