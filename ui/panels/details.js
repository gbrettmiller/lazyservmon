import blessed from 'blessed'
import { PANEL_LABELS } from '../../content/strings.js'
import { BORDER_COLOR, PADDING } from '../../design/tokens.js'

/**
 * Create the details panel (65% wide, 100% tall, right side).
 * @param {blessed.Screen} screen
 * @returns {blessed.Box}
 */
export function createDetailsPanel(screen) {
  return blessed.box({
    parent: screen,
    label: PANEL_LABELS.details,
    border: { type: 'line' },
    style: {
      border: { fg: BORDER_COLOR.normal },
      label: { fg: BORDER_COLOR.normal },
      focus: {
        border: { fg: BORDER_COLOR.focus },
        label: { fg: BORDER_COLOR.focus },
      },
    },
    left: '35%',
    top: 0,
    width: '65%',
    height: '100%',
    keys: true,
    vi: true,
    mouse: true,
    scrollable: true,
    tags: true,
    padding: { left: PADDING.detailsLeft, right: PADDING.detailsRight, top: 0, bottom: 0 },
  })
}
