/**
 * @jest
 */

test('should do nothing', () => {
  const noop = require('../src/noop').default
  expect(noop()).toBe(undefined)
})
