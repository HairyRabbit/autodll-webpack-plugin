/**
 * update file mtime to back 10s
 *
 * @flow
 */

import fs from 'fs'

export default function backMTime(path: string): void {
  const now = Date.now() / 1000 - 10
  fs.utimesSync(path, now, now)
}
