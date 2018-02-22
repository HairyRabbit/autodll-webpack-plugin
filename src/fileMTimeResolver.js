/**
 * get file mtime as timestamp
 *
 * @flow
 */

import fs from 'fs'

export default function getMTime(path: string): number {
  try {
    return new Date(fs.statSync(path).mtime).getTime()
  } catch(err) {
    throw err
  }
}
