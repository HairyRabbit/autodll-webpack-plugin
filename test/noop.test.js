/**
 * @jest
 */

import assert from 'assert'
import noop from '../src/noop'

describe('test noop()', function () {
  it('return void', function() {
    assert(undefined === noop())
  })
})
