import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

const CONFIG_DIR = join(homedir(), '.config', 'lazyservmon')
const CONFIG_PATH = join(CONFIG_DIR, 'config.json')

const DEFAULT_CONFIG = {
  version: 1,
  servers: [],
  settings: {
    scanIntervalMs: 2000,
    statsIntervalMs: 1000,
    maxLogLines: 500,
  },
}

/**
 * Load config from disk. Returns merged defaults if file doesn't exist.
 * @param {string} [configPath] - injectable path for testing
 * @returns {Promise<object>}
 */
export async function loadConfig(configPath = CONFIG_PATH) {
  try {
    const content = await readFile(configPath, 'utf8')
    const parsed = JSON.parse(content)
    return mergeDefaults(parsed)
  } catch (err) {
    if (err.code === 'ENOENT') return structuredClone(DEFAULT_CONFIG)
    throw err
  }
}

/**
 * Save config to disk, creating the directory if needed.
 * @param {object} config
 * @param {string} [configPath] - injectable path for testing
 * @returns {Promise<void>}
 */
export async function saveConfig(config, configPath = CONFIG_PATH) {
  await mkdir(dirname(configPath), { recursive: true })
  await writeFile(configPath, JSON.stringify(config, null, 2), 'utf8')
}

/**
 * Merge loaded config with defaults (settings only, not servers).
 * @param {object} loaded
 * @returns {object}
 */
function mergeDefaults(loaded) {
  return {
    version: loaded.version ?? DEFAULT_CONFIG.version,
    servers: loaded.servers ?? [],
    settings: {
      ...DEFAULT_CONFIG.settings,
      ...(loaded.settings ?? {}),
    },
  }
}

export { CONFIG_PATH, DEFAULT_CONFIG }
