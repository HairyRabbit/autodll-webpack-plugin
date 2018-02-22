/**
 * @jest
 */

test('should return default dll option', () => {
  const optionConstructor = require('../src/optionConstructor').default
  const options = optionConstructor('foo', 'bar', 'baz', 'qux', ['quxx'], {}, 42)
  expect(options.entry).toEqual({ ['foo']: ['quxx'] })
  expect(options.output.path).toMatch(/baz(\/|\\)bar/)
  expect(options.module.rules).toEqual({})
  expect(options.context).toEqual('baz')
  expect(options.plugins.indexOf(42)).not.toBe(-1)
})
