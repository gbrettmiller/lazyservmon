export const PANEL_LABELS = {
  servers: ' Servers ',
  details: ' Details ',
  logs: ' Logs ',
  help: ' Help ',
}

export const DETAIL_LABELS = {
  project: 'Project:',
  pid: 'PID:',
  port: 'Port:',
  cpu: 'CPU:',
  mem: 'MEM:',
  uptime: 'Uptime:',
  dir: 'Dir:',
  url: 'URL:',
  status: 'Status:',
  type: 'Type:',
}

export const EMPTY_STATE = {
  noServer: 'No server selected',
  navigate: 'Use j/k to navigate the server list.',
}

export const KEY_HINT = 'Keys: o=open  s=stop  x=kill  r=restart  l=logs  ?=help'

export const FALLBACK = {
  na: 'N/A',
  unknown: 'unknown',
}

export const HELP_TEXT = [
  '{bold}Keyboard Bindings{/bold}',
  '',
  '  {bold}j / k / ↑↓{/bold}   Navigate server list',
  '  {bold}Tab{/bold}           Cycle panel focus',
  '  {bold}o{/bold}             Open URL in browser (xdg-open)',
  '  {bold}s{/bold}             Stop (SIGTERM → SIGKILL after 5s)',
  '  {bold}x{/bold}             Kill (SIGKILL immediately)',
  '  {bold}r{/bold}             Restart (managed servers only)',
  '  {bold}l{/bold}             Focus log panel',
  '  {bold}R{/bold}             Reload config from disk',
  '  {bold}?{/bold}             Toggle this help',
  '  {bold}q / C-c{/bold}       Quit',
  '',
  'Press {bold}?{/bold} to dismiss.',
].join('\n')
