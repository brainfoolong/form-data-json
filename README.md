![Form Data Json Logo](https://brainfoolong.github.io/form-data-json/img/logo-readme-github.png)

# Form Data Json - Form input values to/from JSON (And a bit more...)

A zero dependency, cross browser library to easily get or set/manipulate form input values as/from a json object. It can
handle all input types, including multidimensional array names and file input.
Native [FormData](https://developer.mozilla.org/docs/Web/API/FormData) is limited to reading only, we have way more:

* Read data as multidimensional object or as a flat list (similar to FormData)
* Write data into forms
* Read unchecked/disabled fields as well
* Read file inputs as base64, arraybuffer, etc...
* Clear forms
* Reset forms to their defaults
* And, you don't even need a `<form>` element, we accept every container, even the `<body>`
* Super small: ~3kB gzipped
* Cross Browser including IE11 (Yes, the ugly one also)

## Installation

Download [latest release](https://github.com/brainfoolong/form-data-json/releases/latest) and
include `dist/form-data-json.min.js` into your project.

```html

<script src="dist/form-data-json.min.js"></script>
```

###### CDN (Latest version automatically, do not use it in production because of possible breaking changes)

```html

<script src="https://cdn.jsdelivr.net/npm/form-data-json-convert/dist/form-data-json.min.js"></script>
```

###### NPM

```cmd
npm install form-data-json-convert
// import in NodeJS: const FormDataJson = require('form-data-json-convert')
```

###### ES6 Module

```cmd
import FormDataJson from 'pathtodistfolder/form-data-json.es6.js'
```

## What's not supported

* Write to `<input type="file">` It's impossible in javascript to set values for file inputs, for security reasons.
  However, reading file input as base64 data uri string is supported.

## How to use

### Read data

```javascript
let values = FormDataJson.toJson(document.querySelector("form")) // with native element
let values = FormDataJson.toJson("#form-id") // with selector
let values = FormDataJson.toJson($("#form-id")) // with jQuery
``` 

###### Read form input values as a flat object (similar to native FormData())

```javascript
let values = FormDataJson.toJson(document.querySelector("form"), { flatList: true })
``` 

###### Read form input values including disabled

```javascript
let values = FormDataJson.toJson(document.querySelector("form"), { includeDisabled: true })
```

###### Read with file inputs as base64 data uri

```javascript
FormDataJson.toJson(document.querySelector("form"), {
  filesCallback: function (values) {
    console.log(values)
  }
})
```

###### Read form input values but filter out, for example, all password fields

```javascript
let values = FormDataJson.toJson(document.querySelector("form"), {
  inputFilter: function (inputElement) {
    return (inputElement.type || 'text') !== 'password'
  }
})
``` 

### Write data

```javascript
FormDataJson.fromJson(document.querySelector("form"), { 'name': 'BrainFooLong' })
```

###### Set form input values and clear all other existing input values

```javascript
FormDataJson.fromJson(document.querySelector("form"), { 'name': 'BrainFooLong' }, { clearOthers: true })
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
{
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
 * @type {*}
 */
'uncheckedValue': undefined,

/**
 * A function, where first parameter is the input field to check for
 * Must return true if the field should be included
 * All other return values, as well as no return value, will skip the input field in the progress
 * @type {function|null}
 */
'inputFilter': null,

/**
 * Does return an array list, with same values as native Array.from(new FormData(form))
 * A list will look like [["inputName", "inputValue"], ["inputName", "inputValue"]]
 * The input name will not be changed and the list can contain multiple equal names
 * @type {boolean}
 */
'flatList': false,

/**
 * If true, then this does skip empty fields from the output
 * Empty is considered to be:
 * An empty array (for multiple selects/checkboxes)
 * An empty input field (length = 0 or null)
 * This does recursively remove keys
 * Example: {"agb":"1", "user" : [{"name" : ""},{"name" : ""}]} will be {"agb":"1"}
 * @type {boolean}
 */
'skipEmpty': false,

/**
 * A function that will be called when all file fields are read as base64 data uri
 * First passed parameter to this function are the form values including all file data
 * Note: If set, the original return value from toJson() returns null
 * @type {function|null}
 */
'filesCallback': null,

/**
 * By default, files are read as base64 data url
 * Possible values are: readAsDataURL, readAsBinaryString, readAsText, readAsArrayBuffer
 * @type {string}
 */
'fileReaderFunction': 'readAsDataURL',

/**
 * If true than values try to be a real Array instead of Object where possible
 * If false than all values that are multiple (multiple select, same input names checkboxes, unnamed array indexes, etc...) will be objects
 * @type {boolean}
 */
'arrayify': true
}
```

###### All default options for fromJson()

You can edit this defaults globally by modifying `FormDataJson.defaultOptionsFromJson`.

```javascript defaultOptionsFromJson
{
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
'clearOthers': false,

/**
 * If true, than all fields that are not exist in the passed values object, will be reset
 * Not exist means, the value must be undefined
 * @type {boolean}
 */
'resetOthers': false,

/**
 * If true, when a fields value has changed, a "change" event will be fired
 * @type {boolean}
 */
'triggerChangeEvent': false
}
```

## How to contribute

* Please write an issue before you start programming.
* Always test the official supported browsers.
* Write all tests in `docs/tests/test.html`. Each new option must have an own test.
