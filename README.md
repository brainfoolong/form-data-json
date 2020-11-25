![Form Data Json Logo](https://brainfoolong.github.io/form-data-json/logo-readme-github.png)

# Form Data Json - Form input values to/from JSON
A zero dependency, cross browser library to easily get or set form input values as/from a json object. It can handle all existing input types, including multidimensional array names and file input.

## Installation
Download [latest release](https://github.com/brainfoolong/form-data-json/releases/latest) and include `dist/form-data-json.min.js` into your project.
```html
<script src="dist/form-data-json.min.js"></script>
```
###### For a quick test without downloading
```html
<script src="https://brainfoolong.github.io/form-data-json/lib/form-data-json.min.js"></script>
```
###### NPM
```
npm install form-data-json-convert
```

## Features
* No dependency - Vanilla javascript
* Cross Browser including IE11
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
let values = FormDataJson.formToJson(document.querySelector("form"))
``` 
###### Read form input values as a flat object (similar to native FormData() keys)
```javascript
let values = FormDataJson.formToJson(document.querySelector("form"))
values = FormDataJson.flattenJsonFormValues(values)
``` 
###### Read form input values including all inputs, even disabled inputs or unchecked checkboxes
```javascript
let values = FormDataJson.formToJson(document.querySelector("form"), new FormDataJsonOptions({ includeDisabled: true, includeUncheckedAsNull : true }))
```
###### Read with file inputs as base64 data uri
```javascript
FormDataJson.formToJson(document.querySelector("form"), null, function(values){})
```

###### Read a single input field
```javascript
let values = FormDataJson.getInputValue(document.querySelector("input"))
```

###### Set form input values
```javascript
FormDataJson.fillFormFromJsonValues(document.querySelector("form"), {'name': 'BrainFooLong'})
```
###### Set form input values and unset all other existing input values
```javascript
FormDataJson.fillFormFromJsonValues(document.querySelector("form"), {'name': 'BrainFooLong'}, new FormDataJsonOptions({ unsetAllInputsOnFill: true }))
```

###### Set a single input field
```javascript
let values = FormDataJson.setInputValue(document.querySelector("input"), 'foo')
```

###### All options and their defaults
You can edit this defaults to your needs.
```javascript
FormDataJsonOptions.defaults = {
    /**
     * Include all disabled inputs in result data
     * @type {boolean}
     */
    includeDisabled: false,
    /**
     * Include checkboxes that are unchecked with a null, otherwise the key will not exist in result data
     * @type {boolean}
     */
    includeUncheckedAsNull: false,
    /**
     * Include all input buttons/submits values, otherwise the key they will not exist in result data
     * @type {boolean}
     */
    includeButtonValues: false,
    /**
     * Will unset all existing input fields in form when using fillFormFromJsonValues
     * This will be helpful if you have checkboxes and want to fill from json object, but checkboxes still stay checked
     * because the key not exist in the json data
     * @type {boolean}
     */
    unsetAllInputsOnFill: false
  }
```