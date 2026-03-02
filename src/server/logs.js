import { createInterface } from 'node:readline'

/**
 * Attach log listeners to a child process's stdout/stderr.
 * Calls onLine(line) for each line.
 * @param {ChildProcess} proc
 * @param {Function} onLine - called with each output line
 * @returns {Function} detach function
 */
export function attachLogs(proc, onLine) {
  const handlers = []

  const attach = (stream, prefix) => {
    if (!stream) return
    const rl = createInterface({ input: stream, crlfDelay: Infinity })
    const handler = (line) => onLine(`${prefix}${line}`)
    rl.on('line', handler)
    handlers.push(() => {
      rl.removeListener('line', handler)
      rl.close()
    })
  }

  attach(proc.stdout, '')
  attach(proc.stderr, '[stderr] ')

  return () => handlers.forEach(h => h())
}
