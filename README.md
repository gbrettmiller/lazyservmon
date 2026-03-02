# lazyservmon

A LazyDocker-style terminal UI for monitoring development servers. It automatically detects running dev server processes and lets you start, stop, restart, and inspect managed servers you define in config.

Process scanning is fully implemented on Linux (via `/proc`). macOS and Windows have stub implementations — `openUrl` works on both, but process detection is not yet implemented.

## Requirements

- Node.js (ESM)
- pnpm
- Linux for full functionality; macOS/Windows for `openUrl` only

## Installation

```sh
git clone https://github.com/gbrettmiller/lazyservmon.git
cd lazyservmon

# Install dependencies
pnpm install

# Make the binary executable and link it
chmod +x bin/lazyservmon.js
ln -s "$(pwd)/bin/lazyservmon.js" ~/.local/bin/lazyservmon
```

Make sure `~/.local/bin` is on your `$PATH`.

## Running

```sh
# Via pnpm
pnpm start

# Directly (once linked)
lazyservmon
```

### Hyprland keybinding

To launch lazyservmon from a keybinding, add a line to `~/.config/hypr/bindings.conf` (or wherever you keep your Hyprland binds). For example:

```
bind = SUPER SHIFT, V, exec, omarchy-launch-tui lazyservmon
```

`omarchy-launch-tui` is a launcher helper included with [Omarchy](https://omarchy.org/). Adjust the key combo to whatever you prefer — `SUPER SHIFT V` is just one example.

## Interface

Three panels, navigable by `Tab`:

| Panel | Contents |
|---|---|
| Server list (left) | All detected and managed servers with status, command, and port |
| Details (top right) | PID, port, CPU, memory, uptime, cwd, URL, status, type |
| Logs (bottom right) | Live stdout/stderr for managed servers |

### Status indicators

| Symbol | Status |
|---|---|
| `●` (green) | running |
| `○` (gray) | stopped |
| `✗` (red) | crashed |
| `◌` (yellow) | starting |

## Keyboard bindings

| Key | Action |
|---|---|
| `j` / `k` / `↑` `↓` | Navigate server list |
| `Tab` | Cycle panel focus |
| `l` | Focus log panel |
| `o` | Open server URL in browser (`xdg-open`) |
| `s` | Stop — SIGTERM, then SIGKILL after 5 seconds |
| `x` | Kill — SIGKILL immediately |
| `r` | Restart (managed servers only) |
| `R` | Reload config from disk |
| `?` | Toggle help overlay |
| `q` / `Ctrl+C` | Quit |

`s` and `x` work on both managed and auto-detected servers.
`r` only applies to managed servers (those defined in config).

## Configuration

Config file: `~/.config/lazyservmon/config.json`

The file is created with defaults on first run if it does not exist. You can also create it manually.

### Full config structure

```json
{
  "version": 1,
  "servers": [
    {
      "id": "api",
      "name": "API Server",
      "command": "node",
      "args": ["server.js"],
      "cwd": "/home/you/projects/my-api",
      "port": 3000,
      "autoStart": true
    },
    {
      "id": "frontend",
      "name": "Frontend",
      "command": "pnpm",
      "args": ["dev"],
      "cwd": "/home/you/projects/my-app",
      "port": 5173,
      "autoStart": false
    }
  ],
  "settings": {
    "scanIntervalMs": 2000,
    "statsIntervalMs": 1000,
    "maxLogLines": 500
  }
}
```

### Server fields

| Field | Required | Description |
|---|---|---|
| `id` | yes | Unique identifier for the server |
| `name` | yes | Display name in the UI |
| `command` | yes | Executable to run |
| `args` | no | Array of arguments (default: `[]`) |
| `cwd` | no | Working directory (default: inherited) |
| `port` | no | Port number, used to construct the URL |
| `url` | no | Override the URL (defaults to `http://localhost:<port>`) |
| `autoStart` | no | Start the server when lazyservmon launches (default: `false`) |

### Settings fields

| Field | Default | Description |
|---|---|---|
| `scanIntervalMs` | `2000` | How often to scan `/proc` for new processes (ms) |
| `statsIntervalMs` | `1000` | How often to update CPU stats for running servers (ms) |
| `maxLogLines` | `500` | Maximum log lines retained per server |

Press `R` inside the TUI to reload config from disk without restarting. Running managed servers are preserved across reloads.

## How process detection works

Process detection is Linux-only. On each scan interval, lazyservmon reads `/proc` to find running processes that look like dev servers. A process qualifies if:

1. Its command basename matches a known dev tool: `vite`, `webpack`, `webpack-dev-server`, `next`, `nuxt`, `nest`, `nodemon`, `ts-node`, `ts-node-dev`, `tsx`
2. **Or** it is a bare `node` process with an active TCP listening socket

Port detection works by cross-referencing `/proc/<pid>/fd/` socket inodes against `/proc/net/tcp` and `/proc/net/tcp6`.

Project names are resolved by walking up from the process's `cwd` (up to 3 levels) looking for a `package.json` with a `name` field.

CPU usage is computed by sampling `/proc/<pid>/stat` twice, 200ms apart, on each stats interval.

### Platform support

| Platform | Process scanning | `openUrl` |
|---|---|---|
| Linux | Full (`/proc`) | `xdg-open` |
| macOS | Not yet implemented | `open` |
| Windows | Not yet implemented | `start` |

Platform selection is automatic via `services/platform/index.js` — no configuration needed. Calling any unimplemented function on macOS or Windows throws `NotImplementedError`.

## Architecture

The project uses a 4-layer architecture:

| Layer | Location | Purpose |
|---|---|---|
| Content | `content/strings.js` | All user-facing text: panel labels, detail labels, help text, key hints, fallbacks |
| Design | `design/tokens.js` | Status icons/colors, border colors, layout dimensions, padding, format widths |
| Core | `core/` | Pure logic, no I/O: `store`, `server/model`, `util/format`, `util/async` |
| Services | `services/` | I/O-dependent modules: `config`, platform adapters, server lifecycle |
| UI | `ui/` | All blessed TUI modules (`screen`, `layout`, `renderer`, `keys`, `panels/`) |
| Orchestrator | `src/app.js` | Wires all layers together; runs poll loops and responds to events |

```
bin/lazyservmon.js
content/strings.js
design/tokens.js
core/
  store.js
  server/model.js
  util/format.js
  util/async.js
services/
  config.js
  platform/
    index.js           # auto-selects based on process.platform
    linux/             # full implementation via /proc
    darwin/            # stubs + working openUrl
    win32/             # stubs + working openUrl
  server/
    manager.js
    lifecycle.js
    logs.js
src/app.js
ui/
  screen.js
  layout.js
  renderer.js
  keys.js
  panels/
    server-list.js
    details.js
    logs.js
test/
  unit/
    core/              # store, server/model, util tests
    services/
      platform/linux/  # ports, stats, project tests
      server/          # lifecycle, logs tests
  integration/         # config, scanner
  fixtures/
```

## Scripts

```sh
pnpm start              # Run the app
pnpm test               # Run unit tests
pnpm test:unit          # Run unit tests (explicit)
pnpm test:integration   # Run integration tests
pnpm test:all           # Run all tests
pnpm lint               # Lint bin/, content/, core/, design/, services/, src/, ui/, test/
```

Tests use Node.js's built-in `node:test` runner. No external test framework.
