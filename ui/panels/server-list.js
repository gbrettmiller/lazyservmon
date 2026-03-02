import blessed from 'blessed'
import { PANEL_LABELS } from '../../content/strings.js'
import { BORDER_COLOR, SELECTED_ITEM, LAYOUT } from '../../design/tokens.js'

/**
 * Create the server list panel (35% wide, 40% tall, top-left).
 * @param {blessed.Screen} screen
 * @returns {blessed.List}
 */
export function createServerList(screen) {
  return blessed.list({
    parent: screen,
    label: PANEL_LABELS.servers,
    border: { type: 'line' },
    style: {
      border: { fg: BORDER_COLOR.normal },
      label: { fg: BORDER_COLOR.normal },
      selected: SELECTED_ITEM,
      item: { fg: 'white' },
      focus: {
        border: { fg: BORDER_COLOR.focus },
        label: { fg: BORDER_COLOR.focus },
      },
    },
    left: 0,
    top: 0,
    width: LAYOUT.serverListWidth,
    height: LAYOUT.splitHeight,
    keys: true,
    vi: true,
    mouse: true,
    scrollable: true,
    tags: true,
  })
}
