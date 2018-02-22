/**
 * @jest
 */

beforeEach(() => {
  jest.resetModules()
})

test('should back mtime 10s', () => {
  const now = Date.now()
  let ts
  jest.doMock('fs', () => {
    return {
      utimesSync(path, _ts) {
        ts = _ts
      }
    }
  })
  const mtimeBack = require('../src/mtimeBack').default
  mtimeBack('foo')
  expect((now - ts) >= 10).toBe(true)
})
