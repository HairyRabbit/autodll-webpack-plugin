const AutoDllPlugin = require('../../lib').default
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')

module.exports = {
  entry: path.resolve(__dirname, './a.js'),
  context: __dirname,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    new AutoDllPlugin(),
    new HtmlWebpackPlugin()
  ]
}