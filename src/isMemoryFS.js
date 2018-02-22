/**
 * test if output fs is memory-fs
 *
 * @flow
 */

import type { Compiler } from 'webpack/lib/Compiler'

export default function isMemoryFS(fs: *): boolean %checks {
  return 'MemoryFileSystem' === fs.constructor.name
}
