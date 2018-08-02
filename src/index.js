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
  watch: boolean
}

export {
  default as default,
  IDENT_DEVCLIENT as flagDevClient,
  IDENT_POLYFILL as flagPolyfill
} from './plugin'
