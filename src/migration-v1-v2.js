'use strict'

/**
 * Migration script that maps old stuff to new stuff
 * Should only temporarily be used
 * @link https://github.com/brainfoolong/form-data-json
 * @licence MIT
 */

/**
 * Deprecated
 * @deprecated Use FormDataJson.toJson instead
 */
FormDataJson.formToJson = function (formElement, options, fileValuesCallback) {
  options = options || {}
  if (options.includeUncheckedAsNull) options.uncheckedValue = null
  if (options.unsetAllInputsOnFill) options.clearOthers = true
  if (fileValuesCallback) options.filesCallback = fileValuesCallback
  return FormDataJson.toJson(formElement, options)
}

/**
 * Deprecated
 * @deprecated Use FormDataJson.fromJson instead
 */
FormDataJson.fillFormFromJsonValues = function (formElement, values, options) {
  options = options || {}
  return FormDataJson.fromJson(formElement, values, options)
}

/**
 * Deprecated
 * @deprecated Use option "flatList" in FormDataJson.toJson()
 */
FormDataJson.flattenJsonFormValues = function () {
  console.error('FormDataJson.flattenJsonFormValues doesn\'t exist anymore, use option "flatList" in FormDataJson.toJson()')
}
