/**
 * test module is installed on node_modules
 *
 * @flow
 */

export default function isInstalled(name: string): boolean {
  try {
    require.resolve(name)
    return true
  } catch(err) {
    return false
  }
}
