'use strict'
// do all that stuff that is required for framework module distribution

const fs = require('fs')
const path = require('path')
const babel = require('@babel/core')

const targets = {
  'chrome': '58',
  'edge': '20',
  'firefox': '68',
  'ie': 11
}

const plugins = [[__dirname + '/../node_modules/@babel/plugin-proposal-class-properties', { loose: true }], [__dirname + '/../node_modules/@babel/plugin-proposal-private-methods', { loose: true }]]

let babelConfigs = {
  'form-data-json.js': {
    'comments': true,
    'plugins': plugins,
    'presets': [
      [
        __dirname + '/../node_modules/@babel/preset-env',
        {
          'loose': true,
          'targets': targets
        }
      ]
    ]
  },
  'form-data-json.es6.js': {
    'comments': true,
    'plugins': plugins,
    'presets': [
      [
        __dirname + '/../node_modules/@babel/preset-env',
        {
          'loose': true,
          'targets': {
            'node': '14'
          },
          'modules': false
        }
      ]
    ]
  },
  'form-data-json.min.js': {
    'comments': false,
    'plugins': plugins,
    'presets': [
      [
        __dirname + '/../node_modules/@babel/preset-env',
        {
          'loose': true,
          'targets': targets
        }
      ],
      __dirname + '/../node_modules/babel-preset-minify'
    ]
  }
}

/**
 * Run compiler
 * @return {Promise<void>}
 */
async function compile () {
  let srcFile = __dirname + '/../src/form-data-json.js'
  let readmeFile = __dirname + '/../README.md'

  let packageJson = require(__dirname + '/../package.json')
  let srcFileData = fs.readFileSync(srcFile).toString()
  srcFileData = srcFileData.replace(/\/\/ module exports.*/is, '')
  let readmeFileData = fs.readFileSync(readmeFile).toString()

  let matchDefaultOptionsToJson = srcFileData.match(/static defaultOptionsToJson = {(.*?  )}/is)
  matchDefaultOptionsToJson[1] = '\n{\n' + matchDefaultOptionsToJson[1].trim().replace(/^    /gm, '') + '\n}\n'
  readmeFileData = readmeFileData.replace(/```javascript defaultOptionsToJson.*?```/is, '```javascript defaultOptionsToJson' + matchDefaultOptionsToJson[1] + '```')
  let matchDefaultOptionsFromJson = srcFileData.match(/static defaultOptionsFromJson = {(.*?  )}/is)
  matchDefaultOptionsFromJson[1] = '\n{\n' + matchDefaultOptionsFromJson[1].trim().replace(/^    /gm, '') + '\n}\n'
  readmeFileData = readmeFileData.replace(/```javascript defaultOptionsFromJson.*?```/is, '```javascript defaultOptionsFromJson' + matchDefaultOptionsFromJson[1] + '```')

  fs.writeFileSync(readmeFile, readmeFileData)

  let copyToFolders = [__dirname + '/../docs/scripts/', __dirname + '/../dist/']

  for (let i = 0; i < copyToFolders.length; i++) {
    let copyToFolder = copyToFolders[i]

    for (let file in babelConfigs) {
      let contents = ''
      contents = '// ' + packageJson.name + ' | version: ' + packageJson.version + ' | url: ' + packageJson.homepage + '\n'
      contents += babel.transformSync(srcFileData, babelConfigs[file]).code
      if (file.endsWith('.es6.js')) {
        contents = contents.replace(/^class FormDataJson/mg, 'export default class FormDataJson')
      } else {
        contents += `

// module exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormDataJson
}`
      }
      fs.writeFileSync(copyToFolder + '/' + file, contents)
    }
  }
}

(async function init () {
  await compile()
})()