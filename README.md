![Form Data Json Logo](https://brainfoolong.github.io/form-data-json/logo-readme-github.png?1)

# Form Data Json - Form input values to/from JSON (And a bit more..)
A zero dependency, cross browser library to easily get or set form input values as/from a json object. It can handle all existing input types, including multidimensional array names and file input. It is similar to native [FormData](https://developer.mozilla.org/docs/Web/API/FormData) but have some advantages: Get data as multidimensional object, writing data into forms (not just reading), reading unchecked/disabled fields as well, reading file inputs, and some other helpful features.

## Breaking Changes with from v1 to v2
Please read migration guide bellow. v2 is a refactoring of v1 which a lot of changes/improvements and different method names.

## Installation
Download [latest release](https://github.com/brainfoolong/form-data-json/releases/latest) and include `dist/form-data-json.min.js` into your project.
```html
<script src="dist/form-data-json.min.js"></script>
```
###### CDN (Latest version automatically, do not use it in production because of breaking changes)
```html
<script src="https://cdn.jsdelivr.net/npm/form-data-json-convert/dist/form-data-json.min.js"></script>
```
###### NPM
```
npm install form-data-json-convert
// import: const FormDataJson = require('form-data-json-convert')
```

## Features
* No dependency - Vanilla javascript
* Cross Browser including IE11 (Yes, the ugly one also)
* Multidimensional input name support. For example: `name="entry[123][person]"`
* Super small: ~3kB gzipped 

## Playground
[Test it out here.](https://brainfoolong.github.io/form-data-json/example/playground.html)

## Supported Browser
* Chrome
* Firefox
* Edge (Chromium based and Old)
* Safari
* IE11
* And probably every other that we don't test

## What's not supported
* Write to `<input type="file">` It's impossible in javascript to set values for file inputs, for security reasons. However, reading file input as base64 data uri string is supported.

## How to contribute
* Please write an issue before you start programming.
* Always test the official supported browsers.
* Write all tests in `docs/tests/test.html`. Each new option must have an own test.

## How to use
###### Read form input values
```javascript
let values = FormDataJson.toJson(document.querySelector("form")) // with native element
let values = FormDataJson.toJson("#form-id") // with selector
let values = FormDataJson.toJson($("#form-id")) // with jQuery
``` 
###### Read form input values as a flat object (similar to native FormData() keys)
```javascript
let values = FormDataJson.toJson(document.querySelector("form"), {flatList: true})
``` 
###### Read form input values including all inputs, even disabled inputs or unchecked checkboxes as null
```javascript
let values = FormDataJson.toJson(document.querySelector("form"), {includeDisabled: true, uncheckedValue : null}})
```
###### Read with file inputs as base64 data uri
```javascript
FormDataJson.toJson(document.querySelector("form"), {filesCallback: function(values){}})
```
###### Read form input values but filter out, for example,  all password fields
```javascript
let values = FormDataJson.toJson(document.querySelector("form"), { inputFilter: function(inputElement) { return (inputElement.type || 'text') !== 'password' } })
``` 

###### Set form input values
```javascript
FormDataJson.fromJson(document.querySelector("form"), {'name': 'BrainFooLong'})
```

###### Set form input values and clear all other existing input values
```javascript
FormDataJson.fromJson(document.querySelector("form"), {'name': 'BrainFooLong'}, { clearOthers: true })
```

###### Reset all input fields to their default values
```javascript
FormDataJson.reset(document.querySelector("form"))
```

###### Clear all input fields to empty values
```javascript
FormDataJson.clear(document.querySelector("form"))
```

###### All default options for toJson()
You can edit this defaults globally by modifying `FormDataJson.defaultOptionsToJson`.
```javascript defaultOptionsToJson
/**
 * Include all disabled field values
 * @type {boolean}
 */
'includeDisabled': false,

/**
 * Include all button field values
 * @type {boolean}
 */
'includeButtonValues': false,

/**
 * Include all unchecked radio/checkboxes as given value when they are unchecked
 * If undefined, than the unchecked field will be ignored in output
 */
'uncheckedValue': undefined,

/**
 * A function, where first parameter is the input field to check for, that must return true if the field should be included
 * All other return values, as well as no return value, will skip the input field in the progress
 * @type {function|null}
 */
'inputFilter': null,

/**
 * Does return a flat key/value list of values instead of multiple dimensions
 * This will use the original input names as key, doesn't matter how weird they are
 * Exepected keys are similar to FormData() keys
 * @type {boolean}
 */
'flatList': false,

/**
 * If true, than this does skip empty fields from the output
 * @type {boolean}
 */
'skipEmpty': false,

/**
 * A function the will be called when all file fields are read as base64 data uri
 * Note: This does modify the returned object from the original call of toJson() afterwards
 * @type {function|null}
 */
'filesCallback': null,

/**
 * By default, files are read as base64 data url
 * Possible values are: readAsDataURL, readAsBinaryString, readAsText, readAsArrayBuffer
 * @type {string}
 */
'fileReaderFunction': 'readAsDataURL'
```

###### All default options for fromJson()
You can edit this defaults globally by modifying `FormDataJson.defaultOptionsFromJson`.
```javascript defaultOptionsFromJson
/**
 * Does expect the given values are in a flatList, previously exported with toJson
 * Instead of the default bevhiour with nested objects
 * @type {boolean}
 */
'flatList': false,

/**
 * If true, than all fields that are not exist in the passed values object, will be cleared/emptied
 * Not exist means, the value must be undefined
 * @type {boolean}
 */
'clearOthers': false
```

### Migration/Changelog from v1 to v2
* Class `FormDataJsonOptions` removed. Use bare `{}` objects now as options
* Method `FormDataJson.flattenJsonFormValues` removed. Use `flatList = true` option in `toJson`
* Method `FormDataJson.setInputValue` removed. No replacement. Use `fromJson` if you need to set any input value
* Method `formToJson`  renamed to `toJson`
* Method `fillFormFromJsonValues` renamed to `fromJson`
* Option `unsetAllInputsOnFill` renamed to `clearOthers`
* Option `includeUncheckedAsNull` renamed to `uncheckedValue` and now represent the value that unchecked inputs should have in output