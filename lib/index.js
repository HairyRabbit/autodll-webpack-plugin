/**
 * autodll-webpack-plugin
 *
 * @flow
 */

import webpack from 'webpack'
import path from 'path'
import fs from 'fs'

export default class AutoDllPlugin {
  constructor(options = {}) {
    this.options = options
    this.depkey = 'dependencies'
    this.name = options.name || 'vendor'
    this.manifest = options.manifest || this.name + '.json'
    this.output = options.output || '.dll'
    this.ignore = options.ignore || (() => true)
  }

  apply(compiler) {
    this.context = compiler.context
    this.webpackOptions = compiler.options
    this.deps = this.resolve()
    const process = this.plugin
    compiler.hooks.beforeRun.tapAsync('AutoDllPlugin', this.plugin.bind(this))
  }

  plugin(compiler, callback) {
    webpack(this.make()).run((err, data) => {
      if(err) return callback(err, null)

      new webpack.DllReferencePlugin({
        context: this.context,
        manifest: path.resolve(this.context, this.output, this.manifest),
      }).apply(compiler)

      callback(null, null)
    })
  }

  make() {
    return {
      entry: {
        [this.name]: this.deps
      },
      output: {
        path: path.resolve(this.context, this.output),
        filename: '[name].js',
        library: '[name]'
      },
      context: this.context,
      mode: 'development',
      devtool: 'none',
      plugins: [
        new webpack.DllPlugin({
          context: this.context,
          path: path.resolve(this.context, this.output, this.manifest),
          name: '[name]'
        })
      ]
    }
  }

  resolve() {
    const pkgpath = path.resolve(this.context, 'package.json')
    const pkgconfig = __non_webpack_require__(pkgpath);
    return Object.keys(pkgconfig[this.depkey]).filter(this.ignore)
  }
}
