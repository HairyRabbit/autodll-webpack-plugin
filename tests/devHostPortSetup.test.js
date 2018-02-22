/**
 * @jest
 */

test('should return user host and port', () => {
  const devHostPortSetup = require('../src/devHostPortSetup').default
  expect(devHostPortSetup('0.0.0.0', '42')).toEqual(['0.0.0.0', '42'])
})

test('should return options host and port', () => {
  const devHostPortSetup = require('../src/devHostPortSetup').default
  expect(devHostPortSetup(undefined, undefined, {
    host: '0.0.0.0',
    port: '42'
  })).toEqual(['0.0.0.0', '42'])
})

test('should return default host and port', () => {
  const devHostPortSetup = require('../src/devHostPortSetup').default
  expect(devHostPortSetup(undefined, undefined, undefined)).toEqual(['localhost', '8080'])
})
