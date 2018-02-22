/**
 * make dll option
 *
 * @flow
 */

import path from 'path'
import webpack from 'webpack'

export default function makeDllOptions(name: string,
                                       output: string,
                                       context: string,
                                       manifest: string,
                                       deps: Array<string>,
                                       rules: any,
                                       plugin: any): Object {
  return {
    entry: {
      [name]: deps
    },
    output: {
      path: path.resolve(context, output),
      filename: '[name].js',
      library: '[name]'
    },
    module: {
      rules
    },
    context: context,
    devtool: 'source-map',
    plugins: [
      new webpack.DllPlugin({
        context: context,
        path: path.resolve(context, output, manifest),
        name: '[name]'
      }),

      plugin
    ]
  }
}
