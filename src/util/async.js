import { readFile } from 'node:fs/promises'

/**
 * Read a file, returning null on ENOENT/ESRCH (process disappeared mid-scan).
 * @param {string} path
 * @returns {Promise<string|null>}
 */
export async function safeRead(path) {
  try {
    return await readFile(path, 'utf8')
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'ESRCH' || err.code === 'EACCES' || err.code === 'EPERM') {
      return null
    }
    throw err
  }
}

/**
 * Sleep for the given number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
