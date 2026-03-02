import blessed from 'blessed'

/**
 * Create the server list panel (35% wide, 40% tall, top-left).
 * @param {blessed.Screen} screen
 * @returns {blessed.List}
 */
export function createServerList(screen) {
  return blessed.list({
    parent: screen,
    label: ' Servers ',
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' },
      label: { fg: 'cyan' },
      selected: { bg: 'blue', fg: 'white', bold: true },
      item: { fg: 'white' },
      focus: {
        border: { fg: 'yellow' },
        label: { fg: 'yellow' },
      },
    },
    left: 0,
    top: 0,
    width: '35%',
    height: '40%',
    keys: true,
    vi: true,
    mouse: true,
    scrollable: true,
    tags: true,
  })
}
