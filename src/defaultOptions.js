/**
 * the default options
 *
 * @flow
 */

import type { Options } from './'

export default {
  name: 'vendor',
  manifest: 'vendor.manifest.json',
  output: '.dll',
  cachename: 'vendor.cache.json',
  debug: false,
  disabled: false,
  makeOptions: (x: Object) => void 0,
  include: [],
  exclude: [],
  injectBabelPolyfill: false,
  injectDevClientScript: false,
  host: 'localhost',
  port: '8080'
}
