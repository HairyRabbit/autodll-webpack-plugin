/**
 * plugin
 *
 * @flow
 */

import fs from 'fs'
import path from 'path'
import webpack from 'webpack'
import { Tapable, SyncHook } from 'tapable'
import { RawSource } from 'webpack-sources'
import DefaultOptions from './defaultOptions'
import resolvePkg from './pkgConfigResolver'
import isWebpack4 from './isWebpack4'
import isInstalled from './isInstalled'
import injectEntry from './entryInjecter'
import collectVersions from './collectVersions'
import type { Compiler } from 'webpack/lib/Compiler'
import type { Compilation } from 'webpack/lib/Compilation'
import type { Options } from './'

export default class AutoDllPlugin extends Tapable {
  options: Options;
  description: string;
  flag: string;
  context: string;
  compiler: Compiler;
  webpackOptions: Object;
  pkg: Object;
  deps: Array<string>;
  pkgPath: string;
  cachePath: string;
  timestamp: number;
  webpack4: boolean;
  runWithoutWatch: boolean;

  constructor(options: Options) {
    super()
    this.options = options = {
        ...DefaultOptions,
        ...options
    }

    this.ignore = options.ignore || (() => true)
    this.debug = options.debug || process.env.DEBUG || false
    this.makeOptions = options.makeOptions || (<T>(x: T) => x)
    this.description = 'AutoDllPlugin'
    this.flag = '[AutoDLLPlugin]'


    this.hooks = {
      beforeBuild: new SyncHook(),
      build: new SyncHook(),
      afterBuild: new SyncHook()
    }
  }

  apply(compiler: Compiler): void {
    const { disabled, output, cachename } = this.options
    if(disabled) {
      return
    }

    this.compiler = compiler
    this.context = compiler.context
    this.webpackOptions = compiler.options
    this.pkgPath = path.resolve(this.context, 'package.json')
    this.cachePath = path.resolve(this.context, output, cachename)
    this.pkg = resolvePkg(this.pkgPath)
    this.deps = this.getDeps()
    this.webpack4 = isWebpack4(compiler)

    /**
     * inject pkg to entry, let webpack watch package.json change
     */
    injectEntry(compiler.options, this.pkgPath)

    if(this.webpack4) {
      /**
       * register webpack `run` hook, assert watch mode
       */
      // compiler.hooks.run.tapAsync(
      //   this.description,
      //   this.assertWarning.bind(this)
      // )

      /**
       * register webpack `watchRun` hook
       */
      // compiler.hooks.watchRun.tapAsync(
      //   this.description,
      //   this.plugin.bind(this)
      // )

      /**
       * register webpack `afterPlugins` hook
       */
      // compiler.hooks.afterPlugins.tap(
      //   this.description,
      //   this.applyRefPlugin.bind(this)
      // )

      /**
       * register webpack `compilation` hook, for html-webpack-plugin
       */
      // compiler.hooks.compilation.tap(
      //   this.description,
      //   this.applyRefPlugin.bind(this)
      // )
    } else {
      compiler.plugin('run', this.assertWarning.bind(this))
      if(!this.runWithoutWatch) {
        compiler.plugin('watch-run', this.plugin.bind(this))
        compiler.plugin('after-plugins', this.applyRefPlugin.bind(this))
        compiler.plugin('compilation', this.applyHtmlPlugin.bind(this))
      }
    }
  }

  /**
   * main process
   */
  plugin(watcher: Object, callback: Function) {
    /**
     * check cache before make dll.
     */
    const compiler = watcher.compiler
    const timestamp = compiler.contextTimestamps
          && compiler.contextTimestamps[this.pkgPath]
    const { output, manifest } = this.options

    if(!timestamp) {
      /**
       * first run, check the cache was exists
       */
      const pkgMTime = new Date(fs.statSync(this.pkgPath).mtime).getTime()
      const result = this.check()
      if(!result) {
        this.log(
          '%s, generate new DLL',
          null === result
            ? 'Cache not found'
            : 'Cache was out of date'
        )
        webpack(this.make()).run((err, data) => {
          if(err) {
            callback(err, null)
            return
          }

          this.log('Create DLL successed')
          if(this.debug) {
            console.log(this.renderDeps(), '\n')
            // console.log(data.toString())
          }

          /**
           * update manifest file mtimes
           *
           * @link webpack/watchpack#25
           */
          const manifestFile = path.resolve(this.context, output, manifest)
          const now = Date.now() / 1000 - 10
          fs.utimesSync(manifestFile, now, now)
          this.timestamp = pkgMTime
          callback(null, null)
        })
      } else {
        this.timestamp = pkgMTime
        this.log('Cache was found')
        callback(null, null)
      }
    } else if(timestamp && !this.timestamp) {
      /**
       * this case used for save timestamp, just hack
       */
      this.timestamp = timestamp
      callback(null, null)
    } else if(this.timestamp !== timestamp) {
      /**
       * refetch deps
       */
      this.deps = this.getDeps()

      /**
       * recheck
       */
      const result = this.check()

      if(!result) {
        /**
         * should rebuild DLL
         */
        this.log('Detected deps was update. Rebuild DLL')

        webpack(this.make()).run((err, data) => {
          if(err) {
            callback(err, null)
            return
          }

          this.log('Create DLL successed')
          if(this.debug) {
            console.log(this.renderDeps(), '\n')
            // console.log(data.toString())
          }
          this.timestamp = timestamp
          callback(null, null)
        })
      } else {
        /**
         * the deps not changed, no need to rebuild
         */
        this.timestamp = timestamp
        callback(null, null)
      }
    } else {
      /**
       * no update
       */
      this.log('No update')
      callback(null, null)
    }
  }

  /**
   * log
   */
  _log(method: string, str: string, ...args: Array<string>): void {
    if(this.debug) {
      console[method].apply(console, [
        '%s ' + str,
        this.flag,
        ...args
      ])
    }
  }

  log(...args: Array<string>): void {
    this._log.apply(this, ['log'].concat(args))
  }

  /**
   * call webpack.DllReferencePlugin
   */
  applyRefPlugin(compiler: Function) {
    const { output, manifest } = this.options
    new webpack.DllReferencePlugin({
      context: this.context,
      manifest: path.resolve(this.context, output, manifest)
    }).apply(compiler)
  }

  /**
   * push vendor.js to html scripts assets.
   */
  applyHtmlPlugin(compilation: Compilation) {
    const { name, output } = this.options
    const mfs = this.compiler.outputFileSystem
    const isMemoryFS = Boolean(mfs.data)
    if(isMemoryFS) {
      const outputPath = this.webpackOptions.output.path
      const fileName = name + '.js'
      const dllFileRelativePath = path.resolve(outputPath, fileName)
      const dllFilePath = path.resolve(this.context, output, fileName)
      mfs.mkdirpSync(outputPath)
      mfs.writeFileSync(dllFileRelativePath, fs.readFileSync(dllFilePath, 'utf-8'))

      /**
       * apply to HtmlWebpackPlugin
       */
      if(this.webpack4 && compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration) {
        // compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapAsync(
        //   this.description,
        //   (data, callback) => {
        //     data.assets.js.unshift(fileName)
        //     callback(null, data)
        //   }
        // )
      } else {
        const htmlPluginHook = 'html-webpack-plugin-before-html-generation'
        compilation.plugin(htmlPluginHook, (data, callback) => {
          data.assets.chunks = {
            verdor: {
              entry: '/' + fileName
            },
            ...data.assets.chunks
          }
          callback(null, data)
        })
      }
    }
  }

  assertWarning(compiler: Compiler, callback: Function) {
    this.log('The plugin only works on watch mode, skip generate dll.')
    this.runWithoutWatch = true
    callback(null)
  }

  /**
   * render packaged deps.
   */
  renderDeps(): string {
    return this.deps.map(dep => '  - ' + dep).join('\n')
  }

  /**
   * check for dependencies was updated.
   */
  check(): ?boolean {
    const {
      output,
      cachename,
      injectBabelPolyfill,
      injectDevClientScript
    } = this.options
    try {
      const cache = JSON.parse(fs.readFileSync(this.cachePath, 'utf-8'))
      const cachelen = Object.keys(cache).length
      this.log('Check cache file "%s"', path.relative(this.context, this.cachePath))

      /**
       * compare cache and dependencies
       */
      const deps = collectVersions(this.deps, this.context)
      const depslen = this.deps.length

      /**
       * @TODO if depslen less than cachelen, maybe also not rebuild at watching
       * it will build when next start up. so, the cache just includes deps was
       * works fine.
       */
      if(cachelen !== depslen) return false

      /**
       * compare each key/value.
       */
      for(let key in cache) {
        if(cache[key] !== deps[key]) {
          return false
        }
      }

      return true
    } catch(erro) {
      /**
       * can't find cache, should create a new one.
       */
      return null
    }
  }

  /**
   * write cache to vendor.cache.json
   */
  cache() {
    const { cachename } = this.options
    const bundles = collectVersions(this.deps, this.context)
    const webpack4 = this.webpack4
    return class WriteCachePlugin {
      description: string;

      constructor() {
        this.description = 'WriteDllCachePlugin'
      }

      apply(compiler: Function) {
        if(webpack4) {
          /**
           * register `emit` hook, generate cache file
           */
          // compiler.hooks.emit.tap(
          //   this.description,
          //   compilation => {
          //     compilation.assets[cachename] = new RawSource(
          //       JSON.stringify(bundles)
          //     )
          //   }
          // )
        } else {
          compiler.plugin('emit', (compilation, callback) => {
            compilation.assets[cachename] = new RawSource(
              JSON.stringify(bundles)
            )
            callback(null, null)
          })
        }
      }
    }
  }

  /**
   * make dll use webpack
   */
  make() {
    const WriteCachePlugin = this.cache()
    const rules = this.webpackOptions.module.rules

    const {
      name,
      output,
      manifest,
      injectBabelPolyfill,
      injectDevClientScript,
      host,
      port
    } = this.options

    let deps = [...this.deps]

    /**
     * inject webpack-dev-serser/client
     */
    if(injectDevClientScript) {
      if(isInstalled('webpack-dev-server')) {
        let _host, _port
        if(!host || !port) {
          const devServerOption = this.webpackOptions.devServer
          if(!devServerOption.host || !devServerOption.port) {
            this._log('warn', `Can't provide host or port, use default value: 'http://localhost:8080'`)
            _host = 'localhost'
            _port = '8080'
          } else {
            _host = devServerOption.host
            _port = devServerOption.port
          }
        } else {
          _host = host
          _port = port
        }

        deps.unshift(`webpack-dev-server/client?http://${host}:${port}`)
      } else {
        this._log('warn', `Can't find webpack-dev-server, try to install`)
      }
    }

    /**
     * inject @babel/polyfill
     */
    if(injectBabelPolyfill) {
      const polyfill = ['@babel/polyfill', 'babel-polyfill']
      if(deps.includes(polyfill)) {
        this.log('warn', 'You already bundle babel polyfill, so skip...')
      } else {
        const polyfillInstalled = polyfill.find(
          str => path.resolve(this.context, 'node_modules', str)
        )

        if(polyfillInstalled) {
          deps.unshift(polyfillInstalled)
        } else {
          this.log('warn', `Can't find @babel/polyfill or babel-polyfill, try to install`)
        }
      }
    }

    const options = {
      entry: {
        [name]: deps
      },
      output: {
        path: path.resolve(this.context, output),
        filename: '[name].js',
        library: '[name]'
      },
      module: {
        rules
      },
      context: this.context,
      devtool: 'source-map',
      plugins: [
        new webpack.DllPlugin({
          context: this.context,
          path: path.resolve(this.context, output, manifest),
          name: '[name]'
        }),

        new WriteCachePlugin()
      ]
    }

    // if(this.webpack4) {
    //   options.mode = 'development'
    // }

    return this.makeOptions(options)
  }

  /**
   * get deps
   */
  getDeps(): Array<string> {
    const { include, exclude } = this.options

    const deps = Object.keys(this.pkg.dependencies || {})
          .filter(dep => Boolean(!~exclude.indexOf(dep)))
          .concat(include)
    return deps
  }
}
