import startCase from 'lodash/startCase'
import json      from 'rollup-plugin-json'
import babel     from 'rollup-plugin-babel'
import uglify    from 'rollup-plugin-uglify'
import pkg       from './package.json'

const input     = 'lib/index.js'
const name      = startCase(pkg.npmName).replace(/\s/g, '')
const format    = 'umd'
const sourcemap = true
const globals = {

}

let output, plugins = [
  json({
    exclude: [
      'node_modules/**'
    ]
  }),
  babel({
    exclude: [
      'node_modules/**'
    ]
  })
]

const external = [
  'webpack'
]


if(!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  output = {
    file: 'dist/umd-extra.js',
    format,
    sourcemap
  }
} else {
  output = {
    file: 'dist/umd-extra.min.js',
    format,
    sourcemap
  }

  plugins.push(uglify())
}

export default {
  input,
  output,
  external,
  name,
  plugins,
  globals
}
