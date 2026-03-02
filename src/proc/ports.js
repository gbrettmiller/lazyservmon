import { safeRead } from '../util/async.js'

const LISTEN_STATE = '0A'

/**
 * Parse a hex-encoded little-endian IPv4 address:port string.
 * Format: "XXXXXXXX:PPPP" where address is 8 hex digits (little-endian u32)
 * and port is 4 hex digits (big-endian u16).
 * @param {string} addrPort - e.g. "0100007F:0035"
 * @returns {{ port: number }}
 */
function parseAddrPort(addrPort) {
  const colonIdx = addrPort.indexOf(':')
  const portHex = addrPort.slice(colonIdx + 1)
  return { port: parseInt(portHex, 16) }
}

/**
 * Parse one /proc/net/tcp or tcp6 file content into a Map<inode, port>.
 * Only includes entries in LISTEN state (0A).
 * @param {string} content
 * @returns {Map<number, number>}
 */
export function parseTcpFile(content) {
  const inodeToPort = new Map()
  const lines = content.split('\n')
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const parts = line.split(/\s+/)
    // Fields: sl local_address rem_address st tx_queue rx_queue tr tm->when retrnsmt uid timeout inode
    if (parts.length < 12) continue
    const localAddr = parts[1]
    const state = parts[3]
    const inode = parseInt(parts[9], 10)
    if (state !== LISTEN_STATE) continue
    if (isNaN(inode) || inode === 0) continue
    const { port } = parseAddrPort(localAddr)
    inodeToPort.set(inode, port)
  }
  return inodeToPort
}

/**
 * Build a Map<inode, port> from /proc/net/tcp and /proc/net/tcp6.
 * @returns {Promise<Map<number, number>>}
 */
export async function getPortMap() {
  const [tcp, tcp6] = await Promise.all([
    safeRead('/proc/net/tcp'),
    safeRead('/proc/net/tcp6'),
  ])

  const result = new Map()

  if (tcp) {
    for (const [inode, port] of parseTcpFile(tcp)) {
      result.set(inode, port)
    }
  }

  if (tcp6) {
    for (const [inode, port] of parseTcpFile(tcp6)) {
      result.set(inode, port)
    }
  }

  return result
}
