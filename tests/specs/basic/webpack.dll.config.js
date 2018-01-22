const path = require('path')
const webpack = require('webpack')

module.exports = {
  mode: 'development',
  entry: {
    vendor: ['react']
  },
  context: __dirname,
  output: {
    path: path.resolve(__dirname, 'dll'),
    filename: '[name].js',
    library: '[name]'
  },
  devtool: 'none',
  stats: 'detailed',
  plugins: [
    new webpack.DllPlugin({
      context: path.resolve(__dirname),
      path: path.resolve(__dirname, '.dll/vendor.json'),
      name: '[name]'
    })
  ],
}
