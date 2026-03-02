/**
 * Create a unified Server object with all required fields.
 * @param {Partial<Server>} fields
 * @returns {Server}
 */
export function makeServer(fields = {}) {
  return {
    id: fields.id ?? null,
    type: fields.type ?? 'detected',
    name: fields.name ?? null,
    pid: fields.pid ?? null,
    command: fields.command ?? null,
    args: fields.args ?? [],
    cwd: fields.cwd ?? null,
    port: fields.port ?? null,
    url: fields.url ?? (fields.port ? `http://localhost:${fields.port}` : null),
    status: fields.status ?? 'running',
    cpuPercent: fields.cpuPercent ?? null,
    memBytes: fields.memBytes ?? null,
    uptimeSeconds: fields.uptimeSeconds ?? null,
    // managed-only
    configId: fields.configId ?? null,
    childProcess: fields.childProcess ?? null,
    autoStart: fields.autoStart ?? false,
  }
}

/**
 * Merge updated fields into an existing server object (immutable).
 * @param {Server} server
 * @param {Partial<Server>} updates
 * @returns {Server}
 */
export function updateServer(server, updates) {
  return { ...server, ...updates }
}

/**
 * Create a detected server from /proc scan data.
 * @param {object} procData
 * @returns {Server}
 */
export function makeDetectedServer(procData) {
  const { pid, command, args, cwd, port, name, cpuPercent, memBytes, uptimeSeconds } = procData
  return makeServer({
    id: `proc-${pid}`,
    type: 'detected',
    name: name ?? command,
    pid,
    command,
    args: args ?? [],
    cwd: cwd ?? null,
    port: port ?? null,
    url: port ? `http://localhost:${port}` : null,
    status: 'running',
    cpuPercent: cpuPercent ?? null,
    memBytes: memBytes ?? null,
    uptimeSeconds: uptimeSeconds ?? null,
    configId: null,
    childProcess: null,
    autoStart: false,
  })
}

/**
 * Create a managed server from config data.
 * @param {object} config
 * @returns {Server}
 */
export function makeManagedServer(config) {
  return makeServer({
    id: config.id,
    type: 'managed',
    name: config.name,
    pid: null,
    command: config.command,
    args: config.args ?? [],
    cwd: config.cwd ?? null,
    port: config.port ?? null,
    url: config.url ?? (config.port ? `http://localhost:${config.port}` : null),
    status: 'stopped',
    cpuPercent: null,
    memBytes: null,
    uptimeSeconds: null,
    configId: config.id,
    childProcess: null,
    autoStart: config.autoStart ?? false,
  })
}
