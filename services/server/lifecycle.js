/**
 * Stop a process gracefully: SIGTERM, then SIGKILL after timeout.
 * @param {ChildProcess} proc
 * @param {number} [timeoutMs=5000]
 * @returns {Promise<void>}
 */
export async function stop(proc, timeoutMs = 5000) {
  if (!proc || proc.exitCode !== null) return

  proc.kill('SIGTERM')

  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (proc.exitCode === null) {
        proc.kill('SIGKILL')
      }
      resolve()
    }, timeoutMs)

    proc.once('exit', () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

/**
 * Kill a process immediately with SIGKILL.
 * @param {ChildProcess} proc
 */
export function kill(proc) {
  if (!proc || proc.exitCode !== null) return
  proc.kill('SIGKILL')
}

/**
 * Kill a PID directly (for detected, non-managed processes).
 * @param {number} pid
 * @param {'SIGTERM'|'SIGKILL'} [signal='SIGTERM']
 */
export function killPid(pid, signal = 'SIGTERM') {
  try {
    process.kill(pid, signal)
  } catch {
    // Process may have already exited
  }
}

/**
 * Stop a PID gracefully: SIGTERM, then SIGKILL after timeout.
 * @param {number} pid
 * @param {number} [timeoutMs=5000]
 * @returns {Promise<void>}
 */
export async function stopPid(pid, timeoutMs = 5000) {
  killPid(pid, 'SIGTERM')
  await new Promise(resolve => setTimeout(resolve, timeoutMs))
  // Check if still running
  try {
    process.kill(pid, 0) // Signal 0 = check existence
    killPid(pid, 'SIGKILL')
  } catch {
    // Already gone
  }
}
