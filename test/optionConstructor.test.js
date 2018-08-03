/**
 * @jest
 */

import assert from 'assert'
import optionConstructor from '../src/optionConstructor'

describe('test optionConstructor()', function() {
  it('assert options', function() {
    const options = optionConstructor('foo', 'bar', 'baz', 'qux', ['quxx'], {}, 42)
    assert.deepStrictEqual(options.entry, { ['foo']: ['quxx'] })
    assert(options.output.path.match(/baz(\/|\\)bar/))
    assert.deepStrictEqual(options.module.rules, {})
    assert('baz' === options.context)
    assert(-1 !== options.plugins.indexOf(42))
  })
})
