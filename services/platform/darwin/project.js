import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { findProjectName } from '../../../core/util/project.js'

const execAsync = promisify(exec)

async function defaultExec(cmd) {
  const { stdout } = await execAsync(cmd)
  return stdout
}

/**
 * Parse `lsof -p <pid> -d cwd -Fn` output and extract the cwd path.
 * The cwd line starts with 'n'.
 * @param {string} output
 * @returns {string|null}
 */
export function parseLsofCwd(output) {
  for (const line of output.split('\n')) {
    if (line.startsWith('n') && line.length > 1) {
      return line.slice(1)
    }
  }
  return null
}

/**
 * Resolve the project name for a PID using lsof and package.json walking.
 * @param {number} pid
 * @param {Function} [execFn]
 * @param {Function} [readFn] - injectable file reader for findProjectName
 * @returns {Promise<string|null>}
 */
export async function getProjectName(pid, execFn = defaultExec, readFn = undefined) {
  try {
    const output = await execFn(`lsof -p ${pid} -d cwd -Fn`)
    const cwd = parseLsofCwd(output)
    if (!cwd) return null
    return await findProjectName(cwd, 3, readFn)
  } catch {
    return null
  }
}
