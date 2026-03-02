import blessed from 'blessed'

/**
 * Create the details panel (65% wide, 100% tall, right side).
 * @param {blessed.Screen} screen
 * @returns {blessed.Box}
 */
export function createDetailsPanel(screen) {
  return blessed.box({
    parent: screen,
    label: ' Details ',
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      label: { fg: 'cyan' },
      focus: {
        border: { fg: 'yellow' },
        label: { fg: 'yellow' },
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
    padding: { left: 1, right: 1, top: 0, bottom: 0 },
  })
}
