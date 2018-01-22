const path = require('path')

module.exports =
// [{
//   mode: 'development',
//   entry: path.resolve('lib/index.js'),
//   output: {
//     path: path.resolve('dist'),
//     filename: 'index.js',
//     library: 'AutoDllPlugin',
//     libraryTarget: 'commonjs2'
//   },
//   devtool: 'none',
//   externals: ['webpack'],
//   target: 'node'
// },{
//   mode: 'production',
//   entry: path.resolve('lib/index.js'),
//   output: {
//     path: path.resolve('dist'),
//     filename: 'index.min.js',
//     library: 'AutoDllPlugin',
//     libraryTarget: 'commonjs2'
//   },
//   devtool: 'none',
//   externals: ['webpack'],
//   target: 'node'
// }]
{
  mode: 'development',
  entry: path.resolve('lib/index.js'),
  output: {
    path: path.resolve('dist'),
    filename: 'index.js',
    library: 'AutoDllPlugin',
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [{
      test: /\.js$/,
      use: 'babel-loader'
    }]
  },
  devtool: 'none',
  externals: ['webpack', 'webpack-sources', 'rabbit-umd-extra'],
  target: 'node'
}
