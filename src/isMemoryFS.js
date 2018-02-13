/**
 * test if output fs is memory-fs
 *
 * @flow
 */

import type { Compiler } from 'webpack/lib/Compiler'

export default function isMemoryFS(compiler: Compiler): boolean %checks {
  return 'MemoryFileSystem' === compiler.outputFileSystem.constructor.name
}
