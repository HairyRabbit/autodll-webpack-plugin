import { EnvironmentPlugin } from 'webpack'
import path from 'path'

export default {
  mode: process.env.NODE_ENV,
  target: 'node',
  node: false,
  entry: path.resolve('src/index.js'),
  output: {
    path: path.resolve('lib'),
    filename: `index.js`,
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [{
      test: /\.js$/,
      use: 'babel-loader'
    }]
  },
  optimization: {
    minimize: false
  },
  externals: [
    'webpack',
    'tapable',
    'webpack-sources'
  ]
}
