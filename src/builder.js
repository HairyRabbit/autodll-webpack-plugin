/**
 * build dll use webpack
 *
 * @flow
 */

import webpack from 'webpack'
import noop from './noop'

export default function dllBuilder(options: Object = {},
                                   logger: Function = noop,
                                   reporter: Function = noop,
                                   done: Function = noop,
                                   callback: Function = noop): void {
  webpack(options).run((err, data) => {
    if(err) {
      done(err)
      return
    }

    if(data.hasErrors()) {
      logger('Create DLL failed')
      const json = data.toJson()
      console.error(json.errors)
      callback(new Error('BuildError: DLL build failed.'))
      return
    }

    logger('Create DLL successed')
    reporter()
    callback(data)
    done()
  })
}
