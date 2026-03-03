# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
pnpm test               # unit tests (use this by default)
pnpm test:all           # unit + integration tests
pnpm lint               # ESLint across all source dirs
pnpm start              # run the TUI
```

To run a single test file:
```sh
node --test test/unit/services/platform/darwin/stats.test.js
```

Test glob patterns **must use single quotes** — bash globstar is off and Node.js handles `**` itself when given a literal string.

Order: `pnpm test && pnpm lint` before considering any change done. Run `pnpm test:all` when touching platform detection or config loading.

## Architecture

4-layer Investiture architecture. Each layer has a strict dependency direction — lower layers never import from higher ones.

| Layer | Path | Role |
|---|---|---|
| Content | `content/strings.js` | All user-facing text (labels, help, hints) |
| Design | `design/tokens.js` | Visual constants (colors, icons, layout dims) |
| Core | `core/` | Pure logic, no I/O |
| Services | `services/` | All I/O: config, platform, server lifecycle |
| UI | `ui/` | blessed TUI panels, layout, key bindings, renderer |
| Orchestrator | `src/app.js` | Wires everything; owns poll intervals and store subscriptions |

**`src/app.js` is the only file that knows about all layers.** Feature work almost never touches it — go to the relevant layer instead.

## State flow

`store.js` (EventEmitter) is the single source of truth. `store.setState()` emits `'change'`; `store.addLogLine()` emits `'log'`. Both events call `doRender()` in `src/app.js`.

`doRender` has a re-entrancy guard (`rendering` flag) — **do not remove it**. `blessed.List.setItems()` fires `'select item'` synchronously during render, which loops back through the store. The guard breaks this cycle.

## Platform abstraction

`services/platform/index.js` uses top-level `await` to dynamically import the correct platform module at startup (`linux`, `darwin`, or `win32`). All other code imports from `services/platform/index.js` — never directly from a platform sub-module.

Public API exported by each platform: `scanProcesses`, `getCpuPercent`, `getMemBytes`, `getUptimeSeconds`, `getProjectName`, `openUrl`.

`core/util/project.js` exports `findProjectName` (package.json walker) — shared by both linux and darwin project modules.

## Testing conventions

- Test runner: `node:test` built-in. No external framework.
- All darwin platform tests are fixture-based and run on Linux (no real `lsof`/`ps` calls).
- Injectable `execFn` / `readFn` / `readlinkFn` parameters on I/O functions are the injection points for tests.
- Fixtures live in `test/fixtures/`.
- Integration tests (`test/integration/`) spawn real child processes — expect them to be slower.

## Key gotchas

- `parseStatLine` (linux stats): must find the **last** `)` to handle `comm` fields that contain spaces or parentheses.
- `/proc/net/tcp` inode field is index **9** (0-based) in a whitespace-split line.
- `blessed.log` panels: use `setContent` + `setScrollPerc(100)` — `log()` is append-only and can't be cleared.
- `(2.15).toFixed(1)` → `'2.1'` (float rounding). Tests that assert formatted CPU values must account for this.
- Injectable `readFn`/`readlinkFn` params in platform modules must **not** declare a default variable that doesn't exist in that file (e.g., `readFn = defaultReadFn`). Omit the default entirely and let the callee (`findProjectName`) use its own — otherwise the reference throws and scan silently returns no servers.
