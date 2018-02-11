/**
 * autodll-webpack-plugin
 *
 * Auto make webpack DLL, don't used for production mode
 *
 * 1. generate webpack DLL 'vendor.js' to '<rootDir>/.dll' directory
 * 2. inject plugin DllReferencePlugin to webpack options
 * 3. add assets to HtmlWebpackPlugin plugin
 * 4. add package.json to entry, let it watchable
 *
 * @TODO inherit webpack options to generate dll.
 * @TODO webpack4 supports
 *
 * @flow
 */

export type Options = {
  name: string,
  manifest: string,
  output: string,
  cachename: string,
  debug: boolean,
  disabled: boolean,
  makeOptions: Function,
  include: [],
  exclude: [],
  injectBabelPolyfill: boolean,
  injectDevClientScript: boolean,
  host: string,
  port: string
}

export { default as default } from './plugin'
