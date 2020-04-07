'use strict'
// do all that stuff that is required for framework module distribution

const fs = require('fs')
const path = require('path')
const babel = require('@babel/core')

const babelConf = {
  'comments': false,
  'plugins': [__dirname + '/../node_modules/@babel/plugin-proposal-class-properties'],
  'presets': [
    [
      __dirname + '/../node_modules/@babel/preset-env',
      {
        'targets': {
          'chrome': '58',
          'edge': '20',
          'firefox': '68',
          'ie': '11'
        }
      }
    ],
    __dirname + '/../node_modules/babel-preset-minify'
  ]
}

/**
 * Run compiler
 * @return {Promise<void>}
 */
async function compile () {
  let distFolder = __dirname + '/../dist'
  let files
  if (process.argv[2]) {
    files = [process.argv[2]]
  } else {
    files = [__dirname + '/../src/form-data-json.js']
  }
  let packageJson = require(__dirname + '/../package.json')
  files.forEach(function (file) {
    let contents = '// ' + packageJson.name + ' | version: ' + packageJson.version + ' | url: ' + packageJson.homepage + '\n'
    contents += babel.transformSync(fs.readFileSync(file), babelConf).code
    let basename = path.basename(file)
    let minFile = distFolder + '/' + basename.substr(0, basename.length - 3) + '.min.js'
    fs.writeFileSync(minFile, contents)
    // also copy to docs folder
    fs.copyFileSync(minFile, __dirname + '/../docs/lib/' + path.basename(minFile))
  })
}

(async function init () {
  await compile()
})()