import { formatBytes, formatCpu, formatDuration } from '../util/format.js'

const STATUS_COLORS = {
  running: '{green-fg}●{/green-fg}',
  stopped: '{gray-fg}○{/gray-fg}',
  crashed: '{red-fg}✗{/red-fg}',
  starting: '{yellow-fg}◌{/yellow-fg}',
}

/**
 * Render the current state into the TUI widgets.
 * @param {object} state - store state
 * @param {object} widgets - { serverList, details, logs }
 * @param {blessed.Screen} screen
 */
export function render(state, widgets, screen) {
  const { servers, selectedId, logLines } = state
  const { serverList, details, logs } = widgets

  renderServerList(servers, selectedId, serverList)
  renderDetails(servers.find(s => s.id === selectedId) ?? null, details)
  renderLogs(selectedId, logLines, logs)

  screen.render()
}

/**
 * Render the server list panel.
 */
function renderServerList(servers, selectedId, widget) {
  const items = servers.map(s => {
    const icon = STATUS_COLORS[s.status] ?? '?'
    const name = (s.name ?? s.command ?? 'unknown').padEnd(16)
    const cmd = (s.command ?? '').padEnd(6)
    const port = s.port ? String(s.port).padStart(5) : '     '
    return `${icon} ${name} ${cmd} ${port}`
  })

  const selectedIndex = servers.findIndex(s => s.id === selectedId)
  widget.setItems(items)
  if (selectedIndex >= 0) widget.select(selectedIndex)
}

/**
 * Render the details panel for the selected server.
 */
function renderDetails(server, widget) {
  if (!server) {
    widget.setContent('{gray-fg}No server selected{/gray-fg}\n\nUse j/k to navigate the server list.')
    return
  }

  const lines = [
    `{bold}Project:{/bold}  ${server.name ?? 'unknown'}`,
    `{bold}PID:{/bold}      ${server.pid ?? 'N/A'}`,
    `{bold}Port:{/bold}     ${server.port ?? 'N/A'}`,
    `{bold}CPU:{/bold}      ${formatCpu(server.cpuPercent)}   {bold}MEM:{/bold} ${formatBytes(server.memBytes)}`,
    `{bold}Uptime:{/bold}   ${formatDuration(server.uptimeSeconds)}`,
    `{bold}Dir:{/bold}      ${server.cwd ?? 'N/A'}`,
    `{bold}URL:{/bold}      ${server.url ?? 'N/A'}`,
    `{bold}Status:{/bold}   ${colorStatus(server.status)}`,
    `{bold}Type:{/bold}     ${server.type}`,
    '',
    '{gray-fg}Keys: o=open  s=stop  x=kill  r=restart  l=logs  ?=help{/gray-fg}',
  ]

  widget.setContent(lines.join('\n'))
}

/**
 * Render the logs panel.
 */
function renderLogs(selectedId, logLines, widget) {
  if (!selectedId) return
  const lines = logLines[selectedId] ?? []
  // blessed.log doesn't have setContent — use setScrollPerc + log()
  // Instead, rebuild content
  widget.setContent(lines.join('\n'))
  widget.setScrollPerc(100)
}

function colorStatus(status) {
  const colors = {
    running: '{green-fg}running{/green-fg}',
    stopped: '{gray-fg}stopped{/gray-fg}',
    crashed: '{red-fg}crashed{/red-fg}',
    starting: '{yellow-fg}starting{/yellow-fg}',
  }
  return colors[status] ?? status
}
