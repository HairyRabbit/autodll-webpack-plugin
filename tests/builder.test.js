/**
 * @jest
 */

beforeEach(() => {
  jest.resetModules()
})

function buildCallback(err, data) {
  jest.doMock('webpack', () => {
    return (opts) => {
      return {
        run(cb) {
          cb(err, data)
        }
      }
    }
  })
}

test('should build successful', (done) => {
  buildCallback(null, {
    hasErrors: () => false,
    foo: 42
  })
  const builder = require('../src/builder').default
  builder(undefined, undefined, undefined, undefined, data => {
    expect(data.foo).toBe(42)
    done()
  })
})

test('should throw when webpack throw error', (done) => {
  buildCallback(true)
  const builder = require('../src/builder').default
  builder(undefined, undefined, undefined, err => {
    expect(err).toBe(true)
    done()
  })
})

test('should log error when build successful', (done) => {
  const log = jest.fn()
  let errors
  console.error = jest.fn(errs => errors = errs)
  buildCallback(null, {
    hasErrors: () => true,
    toJson: () => ({
      errors: ['foo', 'bar']
    })
  })
  const builder = require('../src/builder').default
  builder(undefined, log, undefined, undefined, err => {
    expect(log).toHaveBeenCalled()
    expect(errors).toEqual(['foo', 'bar'])
    expect(err).toBeInstanceOf(Error)
    done()
  })
})


test('should report result when build successful', (done) => {
  const log = jest.fn()
  const reporter = jest.fn()
  buildCallback(null, {
    hasErrors: () => false
  })
  const builder = require('../src/builder').default
  builder(undefined, log, reporter, undefined, data => {
    expect(log).toHaveBeenCalled()
    expect(reporter).toHaveBeenCalled()
    expect(data.hasErrors()).toBe(false)
    done()
  })
})
