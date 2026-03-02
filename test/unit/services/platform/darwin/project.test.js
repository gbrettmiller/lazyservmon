import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parseLsofCwd, getProjectName } from '../../../../../services/platform/darwin/project.js'

const fixture = await readFile('test/fixtures/lsof-cwd.txt', 'utf8')

describe('parseLsofCwd', () => {
  test('extracts cwd from fixture output', () => {
    assert.equal(parseLsofCwd(fixture), '/home/user/projects/my-app')
  })

  test('returns null when no n-line present', () => {
    assert.equal(parseLsofCwd('p1234\nfcwd\n'), null)
  })

  test('returns null for empty output', () => {
    assert.equal(parseLsofCwd(''), null)
  })

  test('handles n-line at start of output', () => {
    assert.equal(parseLsofCwd('n/some/path\nother\n'), '/some/path')
  })

  test('returns null for bare n with no path (length === 1)', () => {
    assert.equal(parseLsofCwd('p1234\nfcwd\nn\n'), null)
  })
})

describe('getProjectName', () => {
  test('resolves project name from fixture lsof output', async () => {
    const execFn = async () => fixture
    const readFn = async (path) =>
      path === '/home/user/projects/my-app/package.json'
        ? '{"name": "my-app"}'
        : null
    const name = await getProjectName(1234, execFn, readFn)
    assert.equal(name, 'my-app')
  })

  test('returns null when lsof finds no cwd', async () => {
    const execFn = async () => 'p1234\nfcwd\n'
    const readFn = async () => null
    const name = await getProjectName(1234, execFn, readFn)
    assert.equal(name, null)
  })

  test('returns null when execFn throws', async () => {
    const execFn = async () => { throw new Error('lsof failed') }
    const readFn = async () => null
    const name = await getProjectName(1234, execFn, readFn)
    assert.equal(name, null)
  })

  test('returns null when no package.json found', async () => {
    const execFn = async () => fixture
    const readFn = async () => null
    const name = await getProjectName(1234, execFn, readFn)
    assert.equal(name, null)
  })
})
