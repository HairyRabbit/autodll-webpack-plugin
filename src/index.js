/**
 * autodll-webpack-plugin
 *
 * Auto make webpack DLL, don't used for production mode
 *
 * 1. Generate webpack DLL 'vendor.js' to '<rootDir>/.dll' directory
 * 2. Inject plugin DllReferencePlugin to webpack options
 * 3. Add assets to HtmlWebpackPlugin plugin
 * 4. Add package.json to entry, let it watchable
 *
 * @TODO inherit webpack options to generate dll.
 * @TODO webpack4 supports
 *
 * @flow
 */

import webpack from 'webpack'
// import { Tapable, SyncHook } from 'tapable'
import { RawSource } from 'webpack-sources'
import path from 'path'
import fs from 'fs'
import type { Compiler } from 'webpack/lib/Compiler'
import type { Compilation } from 'webpack/lib/Compilation'

type Options = {
  depkey: string,
  name: string,
  manifest: string,
  output: string,
  ignore: Function,
  cachename: string,
  debug: string | boolean,
  makeOptions: Function
}

export default class AutoDllPlugin /* extends Tapable */ {
  depkey: string;
  name: string;
  manifest: string;
  output: string;
  ignore: Function;
  cachename: string;
  debug: boolean | string;
  makeOptions: Function;
  description: string;
  flag: string;
  context: string;
  compiler: Compiler;
  webpackOptions: Object;
  deps: Array<string>;
  pkgpath: string;
  timestamp: number;
  webpack4: boolean;
  runWithoutWatch: boolean;

  constructor(options: Options) {
    // super()
    options = options || {}
    this.depkey = options.depkey || 'dependencies'
    this.name = options.name || 'vendor'
    this.manifest = options.manifest || this.name + '.manifest.json'
    this.output = options.output || '.dll'
    this.ignore = options.ignore || (() => true)
    this.cachename = options.cachename || this.name + '.cache.json'
    this.debug = options.debug || process.env.DEBUG || false
    this.makeOptions = options.makeOptions || (x => x)
    this.description = 'AutoDllPlugin'
    this.flag = '[AutoDLLPlugin]'

    /*
    this.hooks = {
      beforeBuild: new SyncHook(),
      build: new SyncHook(),
      afterBuild: new SyncHook()
    }
    */
  }

  apply(compiler: Compiler) {
    this.compiler = compiler
    this.context = compiler.context
    this.webpackOptions = compiler.options
    this.pkgpath = path.resolve(this.context, 'package.json')
    this.deps = this.resolve()

    /**
     * inject pkg to entry, let watch it
     */
    compiler.options.entry = this.injectEntry()

    this.webpack4 = Boolean(compiler.hooks)

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
          && compiler.contextTimestamps[this.pkgpath]

    if(!timestamp) {
      /**
       * first run, check the cache was exists
       */
      const pkgMTime = new Date(fs.statSync(this.pkgpath).mtime).getTime()
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
          const manifest = path.resolve(this.context, this.output, this.manifest)
          const now = Date.now() / 1000 - 10
          fs.utimesSync(manifest, now, now)
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
      this.deps = this.resolve()

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
  log(str: string, ...args: Array<string>) {
    if(this.debug) {
      console.log.apply(console, [
        '%s ' + str,
        this.flag,
        ...args
      ])
    }
  }

  /**
   * Inject pkg to entry, let watchable
   */
  injectEntry() {
    const entry = this.webpackOptions.entry
    if('string' === typeof entry) {
      return [ this.pkgpath, entry ]
    } else if(Array.isArray(entry)) {
      entry.unshift(this.pkgpath)
      return entry
    } else if('object' === typeof entry){
      Object.keys(entry).forEach(key => {
        if(Array.isArray(entry[key])) {
          entry[key].unshift(this.pkgpath)
        } else {
          /**
           * @TODO: string or other type.
           */
          entry[key] = [ this.pkgpath, entry ]
        }
      })
      return entry
    } else if ('function' === typeof entry) {
      return entry(this.pkgpath)
    } else {
      return entry
    }
  }

  /**
   * call webpack.DllReferencePlugin
   */
  applyRefPlugin(compiler: Function) {
    new webpack.DllReferencePlugin({
      context: this.context,
      manifest: path.resolve(this.context, this.output, this.manifest)
    }).apply(compiler)
  }

  /**
   * push vendor.js to html scripts assets.
   */
  applyHtmlPlugin(compilation: Compilation) {
    const mfs = this.compiler.outputFileSystem
    const isMemoryFS = Boolean(mfs.data)
    if(isMemoryFS) {
      const outputPath = this.webpackOptions.output.path
      const fileName = this.name + '.js'
      const dllFileRelativePath = path.resolve(outputPath, fileName)
      const dllFilePath = path.resolve(this.context, this.output, fileName)
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
          data.assets.js.unshift('/' + fileName)
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
  renderDeps() {
    return this.deps.map(dep => '  - ' + dep).join('\n')
  }

  /**
   * check for dependencies was updated.
   */
  check() {
    const cachepath = path.resolve(this.context, this.output, this.cachename)

    try {
      const cache = JSON.parse(fs.readFileSync(cachepath, 'utf-8')).sort()
      const cachelen = cache.length
      this.log('Check cache file "%s"', path.relative(this.context, cachepath))

      /**
       * compare cache and dependencies
       */
      const deps = this.deps.sort()
      const depslen = deps.length

      /**
       * @TODO if depslen less than cachelen, maybe also not rebuild at watching
       * it will build when next start up. so, the cache just includes deps was
       * ok
       */
      if(cachelen !== depslen) return false

      /**
       * two array has the same length. compare each other.
       */
      for(let i = 0; i < cachelen; i++) {
        if(cache[i] !== deps[i]) return false
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
    const bundles = this.deps
    const cachename = this.cachename
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

    const options = {
      entry: {
        [this.name]: this.deps
      },
      output: {
        path: path.resolve(this.context, this.output),
        filename: '[name].js',
        library: '[name]'
      },
      context: this.context,
      devtool: 'none',
      plugins: [
        new webpack.DllPlugin({
          context: this.context,
          path: path.resolve(this.context, this.output, this.manifest),
          name: '[name]'
        }),

        new WriteCachePlugin()
      ]
    }

    if(this.webpack4) {
      // options.mode = 'development'
    }

    return this.makeOptions(options)
  }

  /**
   * resolve package.json, get deps
   */
  resolve() {
    /**
     * @TODO package.json was not found will throw error
     * if deps was undefined or empty, need not build at first
     */
    try {
      const pkgconfig = JSON.parse(fs.readFileSync(this.pkgpath, 'utf-8'))
      return Object.keys(pkgconfig[this.depkey || {}]).filter(this.ignore)
    } catch(error) {
      throw new Error(error)
    }
  }
}