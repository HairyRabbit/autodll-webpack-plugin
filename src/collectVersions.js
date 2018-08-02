/**
 * collect dependency version
 *
 * @flow
 */

import path from 'path'

export default function collectVersions(deps: Array<string>,
                                        context: string): { [name: string]: string } {
  return deps.reduce((acc, dep) => {
    const depPath = path.resolve(context, 'node_modules', dep, 'package.json')
    const version = __non_webpack_require__(depPath).version
    acc[dep] = version
    return acc
  }, {})
}
