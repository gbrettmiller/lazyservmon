import blessed from 'blessed'
import { PANEL_LABELS } from '../../content/strings.js'
import { BORDER_COLOR, LAYOUT } from '../../design/tokens.js'

/**
 * Create the logs panel (35% wide, 60% tall, bottom-left).
 * @param {blessed.Screen} screen
 * @returns {blessed.Log}
 */
export function createLogsPanel(screen) {
  return blessed.log({
    parent: screen,
    label: PANEL_LABELS.logs,
    border: { type: 'line' },
    style: {
      border: { fg: BORDER_COLOR.normal },
      label: { fg: BORDER_COLOR.normal },
      focus: {
        border: { fg: BORDER_COLOR.focus },
        label: { fg: BORDER_COLOR.focus },
      },
    },
    left: 0,
    top: LAYOUT.splitHeight,
    width: LAYOUT.serverListWidth,
    height: LAYOUT.logsHeight,
    keys: true,
    vi: true,
    mouse: true,
    scrollable: true,
    alwaysScroll: true,
    scrollback: 500,
    tags: true,
  })
}
