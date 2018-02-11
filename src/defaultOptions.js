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
  makeOptions: (<T>(x: T) => x),
  include: [],
  exclude: [],
  injectBabelPolyfill: false,
  injectDevClientScript: false,
  host: '0.0.0.0',
  port: '8080'
}
