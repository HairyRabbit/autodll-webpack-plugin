/**
 * test webpack instance was webpack4
 *
 * @flow
 */

import type { Compiler } from 'webpack/lib/Compiler'

export default function isWebpack4(compiler: Compiler): boolean %checks {
  return Boolean(compiler.hooks)
}
