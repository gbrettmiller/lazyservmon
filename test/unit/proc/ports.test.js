import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parseTcpFile } from '../../../src/proc/ports.js'

describe('parseTcpFile', () => {
  test('parses fixture file correctly', async () => {
    const content = await readFile('test/fixtures/proc-tcp.txt', 'utf8')
    const map = parseTcpFile(content)

    // Only LISTEN (0A) entries should be included — 3 of the 4 lines
    assert.equal(map.size, 3)

    // sl 0: port 0x1697 = 5783
    assert.equal(map.get(12345), 5783)

    // sl 1: port 0x0BB8 = 3000
    assert.equal(map.get(23456), 3000)

    // sl 2: port 0x0035 = 53 (loopback DNS)
    assert.equal(map.get(9876), 53)

    // sl 3: state 06 (CLOSE_WAIT) — should NOT be included
    assert.equal(map.has(34567), false)
  })

  test('returns empty map for empty content', () => {
    const map = parseTcpFile('')
    assert.equal(map.size, 0)
  })

  test('returns empty map for header-only content', () => {
    const header = '  sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode\n'
    const map = parseTcpFile(header)
    assert.equal(map.size, 0)
  })

  test('handles tcp6 format (v6 address is longer but port is same)', () => {
    // tcp6 has 32-char local address before the port
    const content = `  sl  local_address                         remote_address                        st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode
   0: 00000000000000000000000001000000:1A0B 00000000000000000000000000000000:0000 0A 00000000:00000000 00:00000000 00000000  1000        0 55555 1 0000000000000000 100 0 0 10 0
`
    const map = parseTcpFile(content)
    assert.equal(map.size, 1)
    // port 0x1A0B = 6667
    assert.equal(map.get(55555), 6667)
  })

  test('skips entries with inode 0', () => {
    const content = `  sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode
   0: 00000000:0050 00000000:0000 0A 00000000:00000000 00:00000000 00000000     0        0 0 1 0000000000000000 100 0 0 10 0
`
    const map = parseTcpFile(content)
    assert.equal(map.size, 0)
  })
})
