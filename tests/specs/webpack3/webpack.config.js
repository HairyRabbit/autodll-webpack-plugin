const AutoDllPlugin = require('../').AutoDllPlugin
const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: path.resolve(__dirname, './a.js'),
  context: __dirname,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  devtool: 'none',
  // stats: 'detailed',
  plugins: [
    new AutoDllPlugin(),
  ],
}
