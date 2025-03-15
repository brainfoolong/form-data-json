'use strict'
// do all that stuff that is required for framework module distribution

const fs = require('fs')
const path = require('path')
const babel = require('@babel/core')
const targets = {
  'chrome': '58',
  'edge': '20',
  'firefox': '68'
}

const plugins = [[__dirname + '/../node_modules/@babel/plugin-proposal-class-properties', { loose: true }], [__dirname + '/../node_modules/@babel/plugin-proposal-private-methods', { loose: true }]]

/**
 * Run compiler
 * @return {Promise<void>}
 */
async function compile () {
  const srcFileTs = __dirname + '/../src/form-data-json.ts'
  const readmeFile = __dirname + '/../README.md'

  fs.copyFileSync(srcFileTs, __dirname + '/../dist/form-data-json.ts')

  const packageJson = require(__dirname + '/../package.json')
  const srcFileData = fs.readFileSync(srcFileTs).toString().replace(/\r/g, '')
  let readmeFileData = fs.readFileSync(readmeFile).toString()

  const docTypes = { 'FormDataJsonOptionsToJson': 'defaultOptionsToJson', 'FormDataJsonOptionsFromJson': 'defaultOptionsFromJson', 'FormDataJsonOptionsReset': 'defaultOptionsReset', 'FormDataJsonOptionsClear': 'defaultOptionsClear' }

  for (const docType in docTypes) {
    const readmePart = docTypes[docType]
    const m = srcFileData.match(new RegExp('export interface ' + docType + '\\s*\{(.*?)\\n\}', 'is'))
    readmeFileData = readmeFileData.replace(new RegExp('```typescript ' + readmePart + '.*?```', 'is'), '```typescript ' + readmePart + '\n' + m[0] + '\n```')
  }

  fs.writeFileSync(readmeFile, readmeFileData)

  let copyToFolders = [__dirname + '/../docs/scripts/', __dirname + '/../dist/']

  let contents
  const baseCode = fs.readFileSync(__dirname + '/../dist/form-data-json.js').toString()

  const distSrcData = babel.transformSync(baseCode.replace(/export default class/, 'class'), {
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
  }).code

  const distSrcDataMinified = babel.transformSync(distSrcData, {
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
  }).code

  const moduleExport = `

// module exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormDataJson
}`
  for (let i = 0; i < copyToFolders.length; i++) {
    let copyToFolder = copyToFolders[i]

    // dev
    contents = ''
    contents = '// ' + packageJson.name + ' | version: ' + packageJson.version + ' | url: ' + packageJson.homepage + '\n'
    contents += distSrcData.replace(/export default class/, 'class')
    contents += moduleExport
    fs.writeFileSync(copyToFolder + '/form-data-json.js', contents)

    // dev es6
    contents = ''
    contents = '// ' + packageJson.name + ' | version: ' + packageJson.version + ' | url: ' + packageJson.homepage + '\n'
    contents += baseCode
    fs.writeFileSync(copyToFolder + '/form-data-json.es6.js', contents)

    // prod
    contents = ''
    contents = '// ' + packageJson.name + ' | version: ' + packageJson.version + ' | url: ' + packageJson.homepage + '\n'
    contents += distSrcDataMinified.replace(/export default class/, 'class')
    contents += moduleExport
    fs.writeFileSync(copyToFolder + '/form-data-json.min.js', contents)

    // prod es6
    contents = ''
    contents = '// ' + packageJson.name + ' | version: ' + packageJson.version + ' | url: ' + packageJson.homepage + '\n'
    contents += distSrcDataMinified
    fs.writeFileSync(copyToFolder + '/form-data-json.es6.min.js', contents)
  }
}

(async function init () {
  await compile()
})()