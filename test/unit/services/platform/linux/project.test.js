import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { findProjectName } from '../../../../../core/util/project.js'
import { getProjectName } from '../../../../../services/platform/linux/project.js'

// Create an injectable fs stub from a map of path→content
function makeFs(files) {
  return async (path) => files[path] ?? null
}

describe('findProjectName', () => {
  test('finds package.json in start directory', async () => {
    const fs = makeFs({
      '/home/user/projects/my-app/package.json': '{"name": "my-app", "version": "1.0.0"}',
    })
    const name = await findProjectName('/home/user/projects/my-app', 3, fs)
    assert.equal(name, 'my-app')
  })

  test('walks up one level to find package.json', async () => {
    const fs = makeFs({
      '/home/user/projects/my-app/package.json': '{"name": "parent-app"}',
    })
    // Start from a subdirectory
    const name = await findProjectName('/home/user/projects/my-app/src', 3, fs)
    assert.equal(name, 'parent-app')
  })

  test('walks up two levels to find package.json', async () => {
    const fs = makeFs({
      '/home/user/projects/monorepo/package.json': '{"name": "monorepo"}',
    })
    const name = await findProjectName('/home/user/projects/monorepo/packages/lib', 3, fs)
    assert.equal(name, 'monorepo')
  })

  test('returns null when no package.json within depth limit', async () => {
    const fs = makeFs({
      '/package.json': '{"name": "root"}', // too deep for depth=2
    })
    const name = await findProjectName('/home/user/projects/app/src', 2, fs)
    assert.equal(name, null)
  })

  test('returns null when package.json has no name field', async () => {
    const fs = makeFs({
      '/home/user/projects/app/package.json': '{"version": "1.0.0"}',
    })
    const name = await findProjectName('/home/user/projects/app', 3, fs)
    assert.equal(name, null)
  })

  test('skips malformed package.json and continues walking', async () => {
    const fs = makeFs({
      '/home/user/projects/app/src/package.json': 'this is not json {{{',
      '/home/user/projects/app/package.json': '{"name": "real-app"}',
    })
    const name = await findProjectName('/home/user/projects/app/src', 3, fs)
    assert.equal(name, 'real-app')
  })

  test('returns null for empty directory path', async () => {
    const fs = makeFs({})
    const name = await findProjectName('/nonexistent/path', 3, fs)
    assert.equal(name, null)
  })

  test('stops at filesystem root', async () => {
    const fs = makeFs({})
    // Very deep path but no package.json anywhere — should not infinite loop
    const name = await findProjectName('/a/b/c/d/e', 10, fs)
    assert.equal(name, null)
  })
})

describe('getProjectName', () => {
  test('resolves project name via procfs cwd and package.json walk', async () => {
    const readlinkFn = async (path) => {
      assert.equal(path, '/proc/1234/cwd')
      return '/home/user/projects/my-app'
    }
    const readFn = makeFs({
      '/home/user/projects/my-app/package.json': '{"name": "my-app"}',
    })
    const name = await getProjectName(1234, readFn, readlinkFn)
    assert.equal(name, 'my-app')
  })

  test('returns null when readlinkFn throws (process gone)', async () => {
    const readlinkFn = async () => { throw new Error('ENOENT') }
    const readFn = makeFs({})
    const name = await getProjectName(9999, readFn, readlinkFn)
    assert.equal(name, null)
  })

  test('passes readFn through to findProjectName', async () => {
    let readFnCalled = false
    const readlinkFn = async () => '/srv/api'
    const readFn = async (path) => {
      readFnCalled = true
      return path === '/srv/api/package.json' ? '{"name": "api-service"}' : null
    }
    const name = await getProjectName(42, readFn, readlinkFn)
    assert.equal(name, 'api-service')
    assert.ok(readFnCalled, 'injected readFn was not called')
  })

  test('does not throw when readFn is undefined (findProjectName default handles it)', async () => {
    // readlinkFn returns a path that almost certainly has no package.json on this machine;
    // the real defaultReadFn in findProjectName will gracefully return null for each miss
    const readlinkFn = async () => '/tmp/__lazyservmon_no_such_dir__'
    const name = await getProjectName(1, undefined, readlinkFn)
    // we only care it didn't throw and returned null or a string
    assert.ok(name === null || typeof name === 'string')
  })
})
