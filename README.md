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
* Super small: ~4kB gzipped
* Typescript and Javascript
* Cross browser - IE11 was supported until [2.2.3](https://github.com/brainfoolong/form-data-json/releases/tag/2.2.3)

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

###### ES6 Module in Browser

```cmd
import FormDataJson from 'pathtodistfolder/form-data-json.es6.js'
```

###### Typescript

Use `dist/form-data-json.ts`.

## Demo
[Check it out here](https://brainfoolong.github.io/form-data-json)

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

###### All default options for FormDataJson.toJson()

You can edit this defaults globally by modifying `FormDataJson.defaultOptionsToJson`.

```typescript defaultOptionsToJson
export interface FormDataJsonOptionsToJson {
  /**
   * Include all disabled field values
   * @type {boolean}
   */
  includeDisabled?: boolean;

  /**
   * Include all button field values
   * @type {boolean}
   */
  includeButtonValues?: boolean;

  /**
   * Include all unchecked radio/checkboxes as given value when they are unchecked
   * If undefined, then the unchecked field will be ignored in output
   * @type {*}
   */
  uncheckedValue?: any;

  /**
   * A function, where first parameter is the input field to check for
   * Must return true if the field should be included
   * All other return values, as well as no return value, will skip the input field in the progress
   * @type {function|null}
   */
  inputFilter?: ((input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLElement) => boolean | undefined) | null;

  /**
   * Does return an array list, with same values as native Array.from(new FormData(form))
   * A list will look like [["inputName", "inputValue"], ["inputName", "inputValue"]]
   * The input name will not be changed and the list can contain multiple equal names
   * @type {boolean}
   */
  flatList?: boolean;

  /**
   * If true, then this does skip empty fields from the output
   * Empty is considered to be:
   * An empty array (for multiple selects/checkboxes)
   * An empty input field (length = 0 or null)
   * This does recursively remove keys
   * Example: {"agb":"1", "user" : [{"name" : ""},{"name" : ""}]} will be {"agb":"1"}
   * @type {boolean}
   */
  skipEmpty?: boolean;

  /**
   * A function that will be called when all file fields are read as base64 data uri
   * First passed parameter to this function are the form values including all file data
   * Note: If set, the original return value from toJson() returns null
   * @type {function|null}
   */
  filesCallback?: ((fieldValues: any) => void) | null;

  /**
   * By default, files are read as base64 data url
   * Possible values are: readAsDataURL, readAsBinaryString, readAsText, readAsArrayBuffer
   * @type {list}
   */
  fileReaderFunction?: 'readAsDataURL' | 'readAsBinaryString' | 'readAsText' | 'readAsArrayBuffer';

  /**
   * If true then values try to be a real Array instead of Object where possible
   * If false then all values that are multiple (multiple select, same input names checkboxes, unnamed array indexes, etc...) will be objects
   * @type {boolean}
   */
  arrayify?: boolean;

  /**
   * If true and given a form with an id attribute, then the script will
   * search for any form input element with a form attribute which matches the id of the form in the complete dom
   * This may come with a performance penalty and you should deactivate it when not needed
   * Default is true, as this is html standard behaviour
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#form
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea#form
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select#form
   * @type {boolean}
   */
  includeLinkedFormElements?: boolean;
}
```

###### All default options for FormDataJson.fromJson()

You can edit this defaults globally by modifying `FormDataJson.defaultOptionsFromJson`.

```typescript defaultOptionsFromJson
export interface FormDataJsonOptionsFromJson {

  /**
   * Does expect the given values are in a flatList, previously exported with toJson
   * Instead of the default behaviour with nested objects
   * @type {boolean}
   */
  flatList?: boolean;

  /**
   * If true, then all fields that are not exist in the passed values object, will be cleared/emptied
   * Not exist means, the value must be undefined
   * @type {boolean}
   */
  clearOthers?: boolean;

  /**
   * If true, then all fields that are not exist in the passed values object, will be reset
   * Not exist means, the value must be undefined
   * @type {boolean}
   */
  resetOthers?: boolean;

  /**
   * If true, when a fields value has changed, a "change" event will be fired
   * @type {boolean}
   */
  triggerChangeEvent?: boolean;

  /**
   * Same as
   * @see FormDataJsonOptionsToJson.includeLinkedFormElements
   * @type {boolean}
   */
  includeLinkedFormElements?: boolean;
}
```

###### All default options for FormDataJson.reset()

You can edit this defaults globally by modifying `FormDataJson.defaultOptionsReset`.

```typescript defaultOptionsReset
export interface FormDataJsonOptionsReset {

  /**
   * If true, when a fields value has changed, a "change" event will be fired
   * @type {boolean}
   */
  triggerChangeEvent?: boolean;

  /**
   * Same as
   * @see FormDataJsonOptionsToJson.includeLinkedFormElements
   * @type {boolean}
   */
  includeLinkedFormElements?: boolean;
}
```
###### All default options for FormDataJson.clear()

You can edit this defaults globally by modifying `FormDataJson.defaultOptionsClear`.

```typescript defaultOptionsClear
export interface FormDataJsonOptionsClear {

  /**
   * If true, when a fields value has changed, a "change" event will be fired
   * @type {boolean}
   */
  triggerChangeEvent?: boolean;

  /**
   * Same as
   * @see FormDataJsonOptionsToJson.includeLinkedFormElements
   * @type {boolean}
   */
  includeLinkedFormElements?: boolean;
}
```
## How to contribute

* Please write an issue before you start programming.
* Always test the official supported browsers.
* Write all tests in `docs/tests/test.html`. Each new option must have an own test.
