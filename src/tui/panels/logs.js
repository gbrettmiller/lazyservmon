import blessed from 'blessed'

/**
 * Create the logs panel (35% wide, 60% tall, bottom-left).
 * @param {blessed.Screen} screen
 * @returns {blessed.Log}
 */
export function createLogsPanel(screen) {
  return blessed.log({
    parent: screen,
    label: ' Logs ',
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      label: { fg: 'cyan' },
      focus: {
        border: { fg: 'yellow' },
        label: { fg: 'yellow' },
      },
    },
    left: 0,
    top: '40%',
    width: '35%',
    height: '60%',
    keys: true,
    vi: true,
    mouse: true,
    scrollable: true,
    alwaysScroll: true,
    scrollback: 500,
    tags: true,
  })
}
