<div alert="center">
  <img src="https://raw.githubusercontent.com/HairyRabbit/media/master/Rabbit-Simple.svg?sanitize=true" alt="Logo" />
</div>

# autodll-webpack-plugin

Make dll first, let webpack build fast.

## Usage

```js
const AutoDllWebpackPlugin = require('@rabbitcc/autodll-webpack-plugin')

module.exports = {
  // webpack config options...
  plugins: [
    new AutoDllwebpackplugin()
  ]
}
```

## Interface

```js
type Options = {
  /**
   * dll bundle file name
   * manifest file name
   * cache directory
   * cache file name.
   */
  name: string = 'vendor',
  manifest: string = 'vendor.manifest.json',
  output: string = '.dll',
  cachename: string = 'vendor.cache.json',
  /**
   * force report.
   */
  debug: boolean = false,
  /**
   * disabled.
   */
  disabled: boolean = false,
  /**
   * watch package.json change for rebuild dll.
   */
  watch: boolean = false
  /**
   * modify the dll option before make.
   */
  makeOptions: webpackOption => void = webpackOption => {},
  /**
   * include or exclude anthor packages.
   */
  include: Array<string> = [],
  exclude: Array<string> = [],
  /**
   * If you development on a old browsers like ie8. Perhaps need to add polyfills
   * for es6 feature support, e.g. 'Object.assign'.
   * set this option to 'ture' to prepend babel-polyfill or @babel/polyfill to dll
   * 'options.entry'.
   *
   * Note: this feature require `.babelrc` set 'preset-env.useBuiltins' to 'entry'.
   */
  injectBabelPolyfill: boolean = false,
  /**
   * perpend 'webpack-dev-server/client' to entry. By default, the options 'host'
   * and 'port' was inherit from 'devServer' options, or failback to
   * use 'http://localhost' and '8080' as the default value.
   */
  injectDevClientScript: boolean = false,
  host: string = 'localhost',
  port: string = '8080'
}
```
