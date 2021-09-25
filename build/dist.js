'use strict'
// do all that stuff that is required for framework module distribution

const fs = require('fs')
const path = require('path')
const babel = require('@babel/core')

const babelConf = {
  'comments': false,
  'plugins': [__dirname + '/../node_modules/@babel/plugin-proposal-class-properties', __dirname + '/../node_modules/@babel/plugin-proposal-private-methods'],
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
  let srcFile = __dirname + '/../src/form-data-json.js'
  let readmeFile = __dirname + '/../README.md'

  let packageJson = require(__dirname + '/../package.json')
  let srcFileData = fs.readFileSync(srcFile).toString()
  let readmeFileData = fs.readFileSync(readmeFile).toString()

  let matchDefaultOptionsToJson = srcFileData.match(/static defaultOptionsToJson = {(.*?  )}/is)
  matchDefaultOptionsToJson[1] = '\n{\n' + matchDefaultOptionsToJson[1].trim().replace(/^    /gm, '') + '\n}\n'
  readmeFileData = readmeFileData.replace(/```javascript defaultOptionsToJson.*?```/is, '```javascript defaultOptionsToJson' + matchDefaultOptionsToJson[1] + '```')
  let matchDefaultOptionsFromJson = srcFileData.match(/static defaultOptionsFromJson = {(.*?  )}/is)
  matchDefaultOptionsFromJson[1] = '\n{\n' + matchDefaultOptionsFromJson[1].trim().replace(/^    /gm, '') + '\n}\n'
  readmeFileData = readmeFileData.replace(/```javascript defaultOptionsFromJson.*?```/is, '```javascript defaultOptionsFromJson' + matchDefaultOptionsFromJson[1] + '```')

  fs.writeFileSync(readmeFile, readmeFileData)

  let contents = '// ' + packageJson.name + ' | version: ' + packageJson.version + ' | url: ' + packageJson.homepage + '\n'
  contents += babel.transformSync(srcFileData, babelConf).code
  let basename = path.basename(srcFile)
  let minFile = distFolder + '/' + basename.substr(0, basename.length - 3) + '.min.js'
  fs.writeFileSync(minFile, contents)
  // also copy to docs folder
  fs.copyFileSync(minFile, __dirname + '/../docs/lib/' + path.basename(minFile))
}

(async function init () {
  await compile()
})()