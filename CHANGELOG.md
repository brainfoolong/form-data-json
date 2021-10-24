### 2.1.0 - 24.October 2021

* added new toJson option `arrayify` to explicitely disable array return values when needed, default is `true`

### 2.0.0 - 04.October 2021

* complete refactoring - thx to https://github.com/KES777 for extensive testing
* fixed many edge case issues from v1
* removed class `FormDataJsonOptions`. Use bare `{}` objects now as options
* removed method `FormDataJson.flattenJsonFormValues`. Use `flatList = true` option in `toJson`. Note: Output still has
  changed significantly to v1.
* changed method `FormDataJson.setInputValue` and is now considered internal only. No direct replacement. Use `fromJson`
  if you need to set any input value
* changed returned data of `formToJson/toJson` - Now some objects will be real JS arrays, if the keys are enumerated
  from 0 to x without a gap
* removed 3rd parameter `formToJson/toJson` callback function. It is now set into option `filesCallback`
* renamed method `formToJson` to `toJson`
* renamed method `fillFormFromJsonValues` to `fromJson`
* renamed option `unsetAllInputsOnFill` to `clearOthers`
* renamed option `includeUncheckedAsNull` to `uncheckedValue` and now represent the value that unchecked inputs should
  have in output
* added option `skipEmpty`
* added option `fileReaderFunction`
* added option `triggerChangeEvent`
* added option `resetOthers`
* added method `clear`
* added method `reset`
* added unminified compiled file
* optimized compiled files

### 2.0.5beta - 28. September 2021

* reverted option `uncheckedValue` to default to `undefined`. https://github.com/brainfoolong/form-data-json/issues/15

### 2.0.4beta - 27. September 2021

* fixed https://github.com/brainfoolong/form-data-json/issues/16 in `toJson()` in combination with `skipEmpty`
  and `flatList`

### 2.0.3beta - 27. September 2021

* fixed https://github.com/brainfoolong/form-data-json/issues/13 in `toJson()`
* changed option `uncheckedValue` is now false by default, instead of undefined
* added option `resetOthers` for `fromJson()`
* changed output of option `flatList`, it now contains an array list with same values like native `FormData()`

### 2.0.2beta - 27. September 2021

* incorrectly compiled files

### 2.0.1beta - 27. September 2021

* fixed glitch in `toJson()` doesn't respect all filter options correctly

### 2.0.0beta - 26. September 2021

* complete refactoring
* removed class `FormDataJsonOptions`. Use bare `{}` objects now as options
* removed method `FormDataJson.flattenJsonFormValues`. Use `flatList = true` option in `toJson`. Note: Output still has
  changed significantly to v1.
* removed method `FormDataJson.setInputValue`. No direct replacement. Use `fromJson` if you need to set any input value
* removed 3rd parameter `formToJson/toJson` callback function. It is now set into option `filesCallback`
* renamed method `formToJson` to `toJson`
* renamed method `fillFormFromJsonValues` to `fromJson`
* renamed option `unsetAllInputsOnFill` to `clearOthers`
* renamed option `includeUncheckedAsNull` to `uncheckedValue` and now represent the value that unchecked inputs should
  have in output
* added option `skipEmpty`
* added option `fileReaderFunction`
* added option `triggerChangeEvent`
* added unminified compiled file
* optimized compiled files

### 1.3.1 - 27. July 2021

* fixed bug that `setInputValue` will not work for `selects` when passed a non-string value

### 1.3.0 - 1. April 2021

* added a new feature `inputFilter` to `FormDataOptions` - Thanks to [@alcalyn](https://github.com/alcalyn) for the idea
  and initial coding in [#8](https://github.com/brainfoolong/form-data-json/issues/8)

### 1.2.2 - 9. December 2020

* fixed node module usage [#7](https://github.com/brainfoolong/form-data-json/issues/7)

### 1.2.1 - 2. December 2020

* fixed a bug that delete `null` values out of the result, even when they should be included

### 1.2.0 - 25. November 2020

* added `FormDataJson.flattenJsonFormValues`

### 1.1.5 - 14. April 2020

* added `FormDataJsonOptions.defaults`

### 1.1.4 - 14. April 2020

* NPM version bump

### 1.1.3 - 8. April 2020

* fixed setInputValue for file input fields, to not create an error
* updated src documentation

### 1.1.2 - 6. April 2020

* Version bump

### 1.1.1 - 6. April 2020

* Reduced NPM package included files

### 1.1.0 - 6. April 2020

* Added read of file inputs

### 1.0.2 - 6. April 2020

* Fixed populate of Array.isArray

### 1.0.1 - 6. April 2020

* NPM and Playground added

### 1.0.0 - 3. April 2020

* Initial release
