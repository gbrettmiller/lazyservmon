import { readlink } from 'node:fs/promises'
import { findProjectName } from '../../../core/util/project.js'

const MAX_WALK_DEPTH = 3

/**
 * Resolve the project name for a PID by reading its cwd and walking up.
 * @param {number} pid
 * @param {Function} [readFn] - injectable reader for testing
 * @param {Function} [readlinkFn] - injectable readlink for testing
 * @returns {Promise<string|null>}
 */
export async function getProjectName(pid, readFn, readlinkFn = readlink) {
  try {
    const cwd = await readlinkFn(`/proc/${pid}/cwd`)
    return await findProjectName(cwd, MAX_WALK_DEPTH, readFn)
  } catch {
    return null
  }
}
