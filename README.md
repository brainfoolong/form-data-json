# Form Data Json - Form input values to/from JSON
A zero dependency, cross browser library to easily get or set form input values as/from a json object. It can handle all existing input types, including multidimensional array names and file input.

## Installation
Download [latest release](https://github.com/brainfoolong/form-data-json/releases/latest) and include `dist/form-data-json.min.js` into your project.
```html
<script src="dist/form-data-json.min.js"></script>
```
###### Or CDN
```html
<script src="https://unpkg.com/form-data-json-convert@latest/dist/form-data-json.min.js"></script>
```
###### Or NPM
```
npm install form-data-json-convert
```

## Features
* No dependency - Vanilla javascript
* Cross Browser including IE11
* Multidimensional input name support. For example: `name="entry[123][person]"`
* Super small: ~3kB gzipped 

## Playground
[Test it out here.](https://unpkg.com/form-data-json-convert@latest/example/playground.html)

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
* Write all tests in `tests/test.html`. Each new option must have an own test.

## How to use
###### Read form input values
```javascript
let values = FormDataJson.formToJson(document.querySelector("form"))
``` 
###### Read form input values including all inputs, even disabled inputs or unchecked checkboxes
```javascript
let values = FormDataJson.formToJson(document.querySelector("form"), new FormDataJsonOptions({ includeDisabled: true }))
```
###### Read with file inputs as base64 data uri
```javascript
FormDataJson.formToJson(document.querySelector("form"), null, function(values){})
```

###### Set form input values
```javascript
FormDataJson.fillFormFromJsonValues(document.querySelector("form"), {'name': 'BrainFooLong'})
```
###### Set form input values and unset all other existing input values
```javascript
FormDataJson.fillFormFromJsonValues(document.querySelector("form"), {'name': 'BrainFooLong'}, new FormDataJsonOptions({ unsetAllInputsOnFill: true }))
```
###### All options
```javascript
/**
* Include all disabled inputs in result data
* @type {boolean}
*/
includeDisabled = false

/**
* Include checkboxes that are unchecked with a null, otherwise the key will not exist in result data
* @type {boolean}
*/
includeUncheckedAsNull = false

/**
* Include all input buttons/submits values, otherwise the key they will not exist in result data
* @type {boolean}
*/
includeButtonValues = false
```