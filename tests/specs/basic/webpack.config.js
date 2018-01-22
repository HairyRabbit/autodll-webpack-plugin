const AutoDllPlugin = require('../').AutoDllPlugin
const path = require('path')
const webpack = require('webpack')

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, './a.js'),
  context: __dirname,
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: 'none',
  // stats: 'detailed',
  plugins: [
    new AutoDllPlugin(),
    // new webpack.DllReferencePlugin({
    //   context: path.resolve(__dirname),
    //   manifest: path.resolve(__dirname, '.dll/vendor.json')
    // })
  ],
}
