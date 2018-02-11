/**
 * resolve package.json config
 *
 * @flow
 */

import fs from 'fs'

export default function resolvePkgConfig(pkgPath: string): Object {
  try {
    return JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  } catch(err) {
    throw err
  }
}
