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
import isMemoryFS from './isMemoryFS'
import injectEntry from './entryInjecter'
import collectVersions from './collectVersions'
import setupHostPort from './devHostPortSetup'
import dllBuilder from './builder'
import makeDllOptions from './optionConstructor'
import type { Compiler } from 'webpack/lib/Compiler'
import type { Compilation } from 'webpack/lib/Compilation'
import type { Options } from './'

const IDENT_DEVCLIENT = 'IDENT_DEVCLIENT'
const IDENT_POLYFILL = 'IDENT_POLYFILL'

export default class AutoDllPlugin extends Tapable {
  options: Options;
  pluginID: string;
  flag: string;
  description: string;
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
  installDevClientScript: boolean;
  installBabelPolyfill: boolean;
  status: Object;

  constructor(options: Options) {
    super()
    this.options = options = {
        ...DefaultOptions,
        ...options
    }

    this.pluginID = 'AutoDll'
    this.description = 'AutoDllPlugin'
    this.flag = '[AutoDLL]'

    this.hooks = {
      beforeBuild: new SyncHook(),
      build: new SyncHook(),
      afterBuild: new SyncHook()
    }

    this.plugin = this.plugin.bind(this)
    this.applyRefPlugin = this.applyRefPlugin.bind(this)
    this.applyHtmlPlugin = this.applyHtmlPlugin.bind(this)
    this.make = this.make.bind(this)
    this.cache = this.cache.bind(this)
    this.build = this.build.bind(this)
    this.log = this.log.bind(this)
    this.report = this.report.bind(this)
  }

  apply(compiler: Compiler): void {
    const { disabled, output, manifest, cachename, watch } = this.options
    if(disabled) {
      return
    }

    this.compiler = compiler
    this.context = compiler.context
    this.webpackOptions = compiler.options
    this.pkgPath = path.resolve(this.context, 'package.json')
    this.manifestPath = path.resolve(this.context, output, manifest)
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
       * @TODO: webpack4
       */
    } else {
      compiler.plugin('run', this.plugin(false))
      compiler.plugin('watch-run', this.plugin(true))
      compiler.plugin('after-plugins', this.applyRefPlugin)
      compiler.plugin('compilation', this.applyHtmlPlugin)
    }
  }

  /**
   * main process
   */
  plugin(isWatchMode: boolean) {
    if(!isWatchMode || 'production' === process.env.NODE_ENV) {
      this._log('warn', `Warning: AutoDll plugin not run with webpack watch mode or the env was 'production'`)
    }
    return (watcherOrCompiler: Object, callback: Function) => {
      /**
       * check cache before make dll.
       */
      const compiler = watcherOrCompiler.compiler || watcherOrCompiler
      const timestamp = compiler.contextTimestamps
            && compiler.contextTimestamps[this.pkgPath]
      const { output, manifest, watch } = this.options

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
              ? 'Done, cache file not found'
              : 'Done, cache file out of date'
          )

          this.build(callback, () => {
            /**
             * update manifest file mtimes
             *
             * @link webpack/watchpack#25
             */
            const manifestFile = path.resolve(this.context, output, manifest)
            const now = Date.now() / 1000 - 10
            fs.utimesSync(manifestFile, now, now)
            this.timestamp = pkgMTime
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
        this.pkg = resolvePkg(this.pkgPath)
        this.deps = this.getDeps()

        /**
         * recheck
         */
        const result = this.check()

        if(!result) {
          /**
           * should rebuild DLL
           */
          this.log('Detected dependencies was update. Rebuild DLL')

          this.build(callback, () => {
            this.timestamp = timestamp
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
  }

  /**
   * low level log
   */
  _log(method: string, str: string, ...args: Array<string>): void {
    if(this.options.debug) {
      console[method].apply(console, [
        '%s ' + str,
        this.flag,
        ...args
      ])
    }
  }

  /**
   * logger
   */
  log(...args: Array<string>): void {
    this._log.apply(this, ['log'].concat(args))
  }

  /**
   * call webpack.DllReferencePlugin
   */
  applyRefPlugin(compiler: Function) {
    new webpack.DllReferencePlugin({
      context: this.context,
      manifest: this.manifestPath
    }).apply(compiler)
  }

  /**
   * push vendor.js to html scripts assets.
   */
  applyHtmlPlugin(compilation: Compilation): void {
    const { name, output } = this.options
    if(isMemoryFS(this.compiler)) {
      const mfs = this.compiler.outputFileSystem
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
        /**
         * @TODO: webpack4 supports
         */
      } else {
        const htmlPluginHook = 'html-webpack-plugin-before-html-generation'
        compilation.plugin(htmlPluginHook, appendToChunks)
      }

      function appendToChunks(data: Object, callback: Function): void {
        if(data.plugin.options.inject) {
          data.assets.js = [
            '/' + fileName,
              ...data.assets.js
          ]
        }

        data.assets.chunks = {
          verdor: {
            entry: '/' + fileName
          },
            ...data.assets.chunks
        }
        callback(null, data)
      }
    }
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

      /**
       * include clientScript or polyfills also
       */
      if(injectDevClientScript) {
        deps[IDENT_DEVCLIENT] = 0
      }
      if(injectBabelPolyfill) {
        deps[IDENT_POLYFILL] = 0
      }

      const depslen = Object.keys(deps).length

      /**
       * @TODO if depslen less than cachelen, maybe also not rebuild at watching
       * it will build when next start up. so, the cache just includes deps was
       * works fine.
       */
      if(cachelen !== depslen) return false

      /**
       * compare each key/value.
       */
      const [a1, a2] = cachelen > depslen ? [cache, deps] : [deps, cache]
      for(let key in a1) {
        if(a1[key] !== a2[key]) {
          return false
        }
      }

      return true
    } catch(err) {
      if(!err.message.match(/no such file or directory/)) {
        throw err
      }

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

    /**
     * include clientScript or polyfills also
     */
    if(this.installDevClientScript) {
      bundles[IDENT_DEVCLIENT] = 0
    }
    if(this.installBabelPolyfill) {
      bundles[IDENT_POLYFILL] = 0
    }

    return class WriteCachePlugin {
      description: string;

      constructor() {
        this.description = 'WriteDllCachePlugin'
      }

      apply(compiler: Function) {
        if(this.webpack4) {
          /**
           * register `emit` hook, generate cache file
           * @TODO: webpack4 supports
           */
        } else {
          compiler.plugin('emit', this.addToAssets.bind(this))
        }
      }

      addToAssets(compilation: Compilation, callback: Function): void {
        compilation.assets[cachename] = new RawSource(
          JSON.stringify(bundles)
        )
        callback()
      }
    }
  }

  /**
   * make dll use webpack
   */
  make() {
    const rules = this.webpackOptions.module.rules

    const {
      name,
      output,
      manifest,
      makeOptions,
      injectBabelPolyfill,
      injectDevClientScript,
      host,
      port
    } = this.options

    let deps = [...this.deps]

    this.installDevClientScript = false
    this.installBabelPolyfill = false

    /**
     * inject webpack-dev-serser/client
     * test webpack-dev-server was installed first
     */
    if(injectDevClientScript) {
      if(!isInstalled('webpack-dev-server')) {
        this._log('warn', `Can't find module 'webpack-dev-server'`)
      } else {
        const suffix = setupHostPort(
          host,
          port,
          this.webpackOptions.devServer
        ).join(':')
        deps.unshift(`webpack-dev-server/client?http://${suffix}`)
        this.installDevClientScript = true
      }
    }

    /**
     * inject @babel/polyfill or babel-polyfill
     */
    if(injectBabelPolyfill) {
      const polyfill = ['@babel/polyfill', 'babel-polyfill']
      /**
       * test deps was already includes polyfill librarys
       */
      if(deps.includes(polyfill)) {
        this.log('warn', 'You already bundle babel polyfill, so skip...')
      } else {
        /**
         * match babel polyfill version v6 or v7, and use v7 first
         */
        const polyfillInstalled = polyfill.find(
          str => path.resolve(this.context, 'node_modules', str)
        )

        if(!polyfillInstalled) {
          this.log('warn', `Can't find @babel/polyfill or babel-polyfill, try to install`)
        } else {
          deps.unshift(polyfillInstalled)
          this.installBabelPolyfill = true
        }
      }
    }

    /**
     * make options
     */
    const WriteCachePlugin = this.cache()
    const options = makeDllOptions(
      name,
      output,
      this.context,
      manifest,
      deps,
      rules,
      new WriteCachePlugin()
    )

    /**
     * expose options
     */
    makeOptions(options)
    return options
  }

  /**
   * render packaged deps.
   */
  renderDeps(): string {
    return this.deps.map(dep => '  - ' + dep).join('\n')
  }

  /**
   * report build result
   */
  report() {
    if(this.options.debug) {
      console.log(this.renderDeps(), '\n')
    }
  }

  /**
   * build dll bundles
   */
  build(done: Function, callback: Function): void {
    const options = this.make()
    dllBuilder(options, this.log, this.report, done, callback)
  }

  /**
   * get dependencies from 'package.json'
   */
  getDeps(): Array<string> {
    const { include, exclude } = this.options

    const deps = Object.keys(this.pkg.dependencies || {})
          .filter(dep => Boolean(!~exclude.indexOf(dep)))
          .concat(include)
    return deps
  }
}
