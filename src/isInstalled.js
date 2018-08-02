/**
 * test module is installed on node_modules
 *
 * @flow
 */

export default function isInstalled(name: string): boolean {
  try {
    __non_webpack_require__.resolve(name)
    return true
  } catch(err) {
    return false
  }
}
