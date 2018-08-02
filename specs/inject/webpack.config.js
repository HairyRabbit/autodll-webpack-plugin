const AutoDllPlugin = require('../../lib').default
const path = require('path')

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, './a.js'),
  context: __dirname,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    new AutoDllPlugin({
      injectBabelPolyfill: true
    })
  ]
}
