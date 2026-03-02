import blessed from 'blessed'

let _screen = null

/**
 * Get or create the blessed screen singleton.
 * @returns {blessed.Screen}
 */
export function getScreen() {
  if (_screen) return _screen
  _screen = blessed.screen({
    smartCSR: true,
    title: 'lazyservmon',
    dockBorders: true,
    fullUnicode: true,
  })
  return _screen
}

/**
 * Destroy the screen (for cleanup).
 */
export function destroyScreen() {
  if (_screen) {
    _screen.destroy()
    _screen = null
  }
}
