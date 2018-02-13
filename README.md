<div alert="center">
  <img src="https://raw.githubusercontent.com/HairyRabbit/media/master/Rabbit-Simple.svg?sanitize=true" alt="Logo" />
</div>

# autodll-webpack-plugin

Make dll first, let webpack build fast.

## Features

- make webpack dll bundle from dependencies field of 'package.json', before webpack compile.
- auto update dll bundle when you add/remove packages to 'dependencies', watch on package.json changed.
- inject dll bundle to html-webpack-plugin assets.chunks

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
   * show the debug logs.
   */
  debug: boolean = false,
  /**
   * disabled do everything, just return.
   */
  disabled: boolean = false,
  /**
   * modify the dll option of webpack before make process.
   */
  makeOptions: webpackOption => void = webpackOption => {},
  /**
   * include or exclude someother packages.
   */
  include: Array<string> = [],
  exclude: Array<string> = [],
  /**
   * something times development on a old browsers, like ie8, need add polyfills to
   * support es6 features, e.g. 'Object.assign'. set this option to 'ture' to
   * prepend babel polyfill to dll options.entry.
   *
   * Note: this feature require `.babelrc` set 'preset-env.useBuiltins' to 'entry'.
   */
  injectBabelPolyfill: boolean = false,
  /**
   * perpend 'webpack-dev-server/client' to entry, when you development a web app, by
   * default, the options 'host' and 'port' was inherit from 'devServer' options, if
   * not found, will use 'http://localhost:8080' as the default value.
   */
  injectDevClientScript: boolean = false,
  host: string = 'localhost',
  port: string = '8080'
}
```
