<div alert="center">
  <img src="https://raw.githubusercontent.com/HairyRabbit/media/master/Rabbit-Simple.svg?sanitize=true" alt="Logo" />
</div>

# autodll-webpack-plugin

Make dll first

## Features

- make dll from dependencies field of 'package.json' before webpack compile
- auto update when add/remove packages, watch on package.json changed
- inject dll bundle to html-webpack-plugin assets

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
   * dll bundle file name, manifest file name, cache directory and cache file name.
   */
  name: string = 'vendor',
  manifest: string = 'vendor.manifest.json',
  output: string = '.dll',
  cachename: string = 'vendor.cache.json',
  /**
   * debug log.
   */
  debug: boolean = false,
  /**
   * disabled do everything, just return.
   */
  disabled: boolean = false,
  /**
   * modifie the dll option of webpack before make process.
   */
  makeOptions: webpackOption => webpackOption = x => x,
  /**
   * include or exclude other packages.
   */
  include: Array<string> = [],
  exclude: Array<string> = [],
  /**
   * something times development on old browsers, like ie8, set this option to 'ture'
   * to prepend babel polyfill to dll entry.
   *
   * Note: this feature require `.babelrc` set useBuiltins to 'entry'.
   */
  injectBabelPolyfill: boolean = false,
  /**
   * perpend 'webpack-dev-server/client' to entry, if development with a web app, by
   * default, host and port was inherit from 'devServer' options, if not, will use
   * 'http://localhost:8080' as the default value.
   */
  injectDevClientScript: boolean = false,
  host: string = 'localhost',
  port: string = '8080'
}
```
