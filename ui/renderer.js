import { formatBytes, formatCpu, formatDuration } from '../core/util/format.js'
import { STATUS_ICON, STATUS_COLOR, FORMAT_WIDTH } from '../design/tokens.js'
import { DETAIL_LABELS, EMPTY_STATE, KEY_HINT, FALLBACK } from '../content/strings.js'

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
    const color = STATUS_COLOR[s.status] ?? 'white'
    const icon = STATUS_ICON[s.status] ?? '?'
    const colored = `{${color}-fg}${icon}{/${color}-fg}`
    const name = (s.name ?? s.command ?? FALLBACK.unknown).padEnd(FORMAT_WIDTH.name)
    const cmd = (s.command ?? '').padEnd(FORMAT_WIDTH.cmd)
    const port = s.port ? String(s.port).padStart(FORMAT_WIDTH.port) : ' '.repeat(FORMAT_WIDTH.port)
    return `${colored} ${name} ${cmd} ${port}`
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
    widget.setContent(`{gray-fg}${EMPTY_STATE.noServer}{/gray-fg}\n\n${EMPTY_STATE.navigate}`)
    return
  }

  const lines = [
    `{bold}${DETAIL_LABELS.project}{/bold}  ${server.name ?? FALLBACK.unknown}`,
    `{bold}${DETAIL_LABELS.pid}{/bold}      ${server.pid ?? FALLBACK.na}`,
    `{bold}${DETAIL_LABELS.port}{/bold}     ${server.port ?? FALLBACK.na}`,
    `{bold}${DETAIL_LABELS.cpu}{/bold}      ${formatCpu(server.cpuPercent)}   {bold}${DETAIL_LABELS.mem}{/bold} ${formatBytes(server.memBytes)}`,
    `{bold}${DETAIL_LABELS.uptime}{/bold}   ${formatDuration(server.uptimeSeconds)}`,
    `{bold}${DETAIL_LABELS.dir}{/bold}      ${server.cwd ?? FALLBACK.na}`,
    `{bold}${DETAIL_LABELS.url}{/bold}      ${server.url ?? FALLBACK.na}`,
    `{bold}${DETAIL_LABELS.status}{/bold}   ${colorStatus(server.status)}`,
    `{bold}${DETAIL_LABELS.type}{/bold}     ${server.type}`,
    '',
    `{gray-fg}${KEY_HINT}{/gray-fg}`,
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
  const color = STATUS_COLOR[status]
  if (!color) return status
  return `{${color}-fg}${status}{/${color}-fg}`
}
