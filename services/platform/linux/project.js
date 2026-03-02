import { readlink, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'

const MAX_WALK_DEPTH = 3

/**
 * Walk up a directory tree looking for package.json.
 * @param {string} startDir
 * @param {number} maxDepth
 * @param {Function} readFn - injectable: (path: string) => Promise<string|null>
 * @returns {Promise<string|null>} package name or null
 */
export async function findProjectName(startDir, maxDepth = MAX_WALK_DEPTH, readFn = defaultReadFn) {
  let dir = startDir
  for (let i = 0; i < maxDepth; i++) {
    const pkgPath = join(dir, 'package.json')
    const content = await readFn(pkgPath)
    if (content) {
      try {
        const pkg = JSON.parse(content)
        if (pkg.name) return pkg.name
      } catch {
        // malformed package.json — keep walking
      }
    }
    const parent = dirname(dir)
    if (parent === dir) break // reached filesystem root
    dir = parent
  }
  return null
}

/**
 * Default read function — returns null on any error.
 * @param {string} path
 * @returns {Promise<string|null>}
 */
async function defaultReadFn(path) {
  try {
    return await readFile(path, 'utf8')
  } catch {
    return null
  }
}

/**
 * Resolve the project name for a PID by reading its cwd and walking up.
 * @param {number} pid
 * @param {Function} [readFn] - injectable reader for testing
 * @param {Function} [readlinkFn] - injectable readlink for testing
 * @returns {Promise<string|null>}
 */
export async function getProjectName(pid, readFn = defaultReadFn, readlinkFn = readlink) {
  try {
    const cwd = await readlinkFn(`/proc/${pid}/cwd`)
    return await findProjectName(cwd, MAX_WALK_DEPTH, readFn)
  } catch {
    return null
  }
}
