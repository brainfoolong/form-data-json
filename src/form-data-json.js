'use strict'

/**
 * Form Data Json Converter
 * @link https://github.com/brainfoolong/form-data-json
 * @licence MIT
 */
class FormDataJson {

  /**
   * Default options for toJson()
   * @type {{}}
   */
  static defaultOptionsToJson = {
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
     * Include all unchecked radio/checkboxes as null when they are unchecked
     * If false, than the unchecked field will be ignored in output
     */
    'includeUnchecked': false,

    /**
     * A function, where first parameter is the input field to check for, that must return true if the field should be included
     * All other return values, as well as no return value, will skip the input field in the progress
     * @type {function|null}
     */
    'inputFilter': null,

    /**
     * Does return a flat key/value list of values instead of multiple dimensions
     * This will use the original input names as key, doesn't matter how weird they are
     * @type {boolean}
     */
    'flatList': false,

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
  }

  /**
   * Default options for fromJson()
   * @type {{}}
   */
  static defaultOptionsFromJson = {
    /**
     * A function, where first parameter is the input field to check for, that must return true if the field should be included
     * All other return values, as well as no return value, will skip the input field in the progress
     * @type {function|null}
     */
    'inputFilter': null,

    /**
     * If true, than all fields will be reset to their default values before setting the new values
     * @type {boolean}
     */
    'resetForm': false,

    /**
     * If true, than all fields will cleared empty before setting the new values
     * @type {boolean}
     */
    'clearForm': false,

    /**
     * By default, files are read as base64 data url
     * Possible values are: readAsDataURL, readAsBinaryString, readAsText, readAsArrayBuffer
     * @type {string}
     */
    'fileReaderFunction': 'readAsDataURL'
  }

  /**
   * All input types that are buttons
   * @type {string[]}
   */
  static #buttonInputTypes = ['button', 'submit', 'reset', 'image']

  /**
   * All input types that have a checked status
   * @type {string[]}
   */
  static #checkedInputTypes = ['checkbox', 'radio']

  /**
   * Get values from all form elements inside the given element
   * @param {*} el
   * @param {Object=} options
   * @return {Object}
   */
  static toJson (el, options) {
    let inputs = FormDataJson.#getInputsFlat(el)
    if (!inputs) return {}
    options = Object.assign({}, FormDataJson.defaultOptionsToJson, options || {})
    let returnObject = {}
    let files = []
    for (let inputName in inputs) {
      const input = inputs[inputName]
      if (!FormDataJson.#isElementAllowed(input, options)) continue
      let inputType = (input.type || 'text').toLowerCase()
      if (!options.includeDisabled && input.disabled) continue
      if (!options.includeButtonValues && (input instanceof HTMLButtonElement || FormDataJson.#buttonInputTypes.indexOf(inputType) > -1)) {
        continue
      }
      let value = FormDataJson.#getInputValue(input)
      let keySplit = options.flatList ? [input.name] : inputName.replace(/\]/g, '').split('[')
      let useObject = returnObject
      let prevObject = null
      let prevKey = null
      let keyParts = keySplit.length
      for (let i = 0; i < keyParts; i++) {
        let keyPart = keySplit[i]
        if (i === keyParts - 1) {
          if (inputType === 'file') {
            if (options.filesCallback) {
              files.push({ 'object': useObject, 'key': keyPart, 'input': input })
            }
            value = null
          }
          // ignore if we should not include unchecked fields
          if (!options.includeUncheckedAsNull && FormDataJson.#checkedInputTypes.indexOf(inputType) > -1 && value === null) {
            continue
          }
          // key doesn't match the next index key of the array, we make it an object
          if (prevKey !== null && FormDataJson.#isArray(useObject) && parseInt(keyPart) !== useObject.length) {
            useObject = Object.assign({}, useObject)
            // make sure to update the reference in the parent object
            prevObject[prevKey] = useObject
          }
          if (FormDataJson.#isArray(useObject[keyPart])) {
            useObject[keyPart].push(value)
          } else {
            useObject[keyPart] = value
          }
        } else {
          // by default, we try to use native arrays
          // only when the keypart doesn't match the next index of the array, we make it an object
          if (typeof useObject[keyPart] !== 'object') {
            useObject[keyPart] = []
          }
          prevObject = useObject
          prevKey = keyPart
          useObject = useObject[keyPart]
        }
      }
    }

    if (files.length) {
      let filesDone = 0
      let filesRequired = 0
      for (let i = 0; i < files.length; i++) {
        let row = files[i]
        let useObject = row.object
        filesRequired += row.input.files.length
        for (let j = 0; j < row.input.files.length; j++) {
          let file = row.input.files[j]
          let reader = new FileReader()
          reader.onload = function () {
            if (row.input.multiple) {
              if (!FormDataJson.#isArray(useObject[row.key])) {
                useObject[row.key] = []
              }
              useObject[row.key].push(reader.result)
            } else {
              useObject[row.key] = reader.result
            }
            filesDone++
            if (filesDone === filesRequired) {
              options.filesCallback(returnObject)
            }
          }
          reader[options.fileReaderFunction](file)
        }
      }
    } else if (options.filesCallback) {
      options.filesCallback(returnObject)
    }
    return returnObject
  }

  /**
   * Fill given form values into all form elements inside given element
   * @param {*} el
   * @param {Object} values
   * @param {Object=} options
   * @param {string=} keyPrefix Internal only
   * @param {number=} depth Internal only
   */
  static fromJson (el, values, options, keyPrefix) {
    if (!FormDataJson.#isObject(values)) return
    el = FormDataJson.#getElement(el)
    if (!el) return

    options = Object.assign({}, FormDataJson.defaultOptionsFromJson, options || {})

    if (options.clearForm) FormDataJson.clear(el)
    else if (options.resetForm) FormDataJson.reset(el)

    let inputs = el.querySelectorAll('select, textarea, input, button')
    for (let i = 0; i < inputs.length; i++) {
      let input = inputs[i]
      if (!input.name || input.type === 'file') continue
      let name = input.name
      // selects and checkbox inputs accept both array/object and scalar values and can have a [] affix (to act as an array)
      // so truncate [] from name because we don't need it
      if (input instanceof HTMLSelectElement || input.type && FormDataJson.#checkedInputTypes.indexOf(input.type.toLowerCase()) > -1) {
        name = name.replace(/\[\]$/g, '')
      }
      let nameParts = name.replace(/\]/g, '').split('[')

      let value = values
      do {
        let namePart = nameParts.shift()
        value = value[namePart]
      } while (value && typeof value === 'object' && nameParts.length)
      FormDataJson.#setInputValue(input, value)
    }

  }

  /**
   * Reset all input fields in the given element to their default values
   * @param {*} el
   */
  static reset (el) {
    let inputs = FormDataJson.#getInputsFlat(el)
    if (!inputs) return
    for (let inputName in inputs) {
      const row = inputs[inputName]
      const input = row.input
      // ignore button elements, as reset would reset button labels, which is mostly not that what anybody want
      if (input.type && FormDataJson.#buttonInputTypes.indexOf(input.type.toLowerCase()) > -1) {
        continue
      }
      if (input.type && FormDataJson.#checkedInputTypes.indexOf(input.type.toLowerCase()) > -1) {
        input.checked = input.defaultChecked
      } else if (input instanceof HTMLSelectElement) {
        const options = input.querySelectorAll('option')
        for (let i = 0; i < options.length; i++) {
          const option = options[i]
          option.selected = option.defaultSelected
        }
      } else if (input.getAttribute('value')) {
        input.value = input.getAttribute('value')
      } else if (typeof input.defaultValue === 'string' || typeof input.defaultValue === 'number') {
        input.value = input.defaultValue
      }
    }
  }

  /**
   * Clear all input fields (to empty, unchecked, unselected) in the given element
   * @param {*} el
   */
  static clear (el) {
    let inputs = FormDataJson.#getInputsFlat(el)
    if (!inputs) return

    for (let inputName in inputs) {
      const row = inputs[inputName]
      const input = row.input
      // ignore button elements, as clear would unset button labels, which is mostly not that what anybody want
      if (input.type && FormDataJson.#buttonInputTypes.indexOf(input.type.toLowerCase()) > -1) {
        continue
      }
      FormDataJson.#setInputValue(input, null)
    }
  }

  /**
   * Get input value
   * Unchecked checkboxes/radios will return null
   * Unselected single selectbox will return null, multiple always return array even if it's empty
   * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} inputElement
   * @return {*}
   * @private
   */
  static #getInputValue (inputElement) {
    if (inputElement instanceof HTMLSelectElement) {
      let arr = []
      for (let i = 0; i < inputElement.options.length; i++) {
        let option = inputElement.options[i]
        if (option.selected) {
          arr.push((typeof option.value !== 'undefined' ? option.value : option.text).toString())
        }
      }
      if (inputElement.multiple) {
        return arr
      }
      return arr.length ? arr[0] : null
    }
    if (inputElement instanceof HTMLInputElement && FormDataJson.#checkedInputTypes.indexOf(inputElement.type.toLowerCase()) > -1) {
      return inputElement.checked ? inputElement.value : null
    }
    return inputElement.value
  }

  /**
   * Set input value
   * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} inputElement
   * @param {*|null} value Null will unset the value
   * @private
   */
  static #setInputValue (inputElement, value) {
    let inputType = (inputElement.type || 'text').toLowerCase()
    if (inputElement instanceof HTMLInputElement && FormDataJson.#checkedInputTypes.indexOf(inputType) > -1) {
      inputElement.checked = value === true || FormDataJson.#matchValue(value, inputElement.value)
    } else if (inputElement instanceof HTMLSelectElement) {
      for (let i = 0; i < inputElement.options.length; i++) {
        let option = inputElement.options[i]
        let optionValue = typeof option.value !== 'undefined' ? option.value : option.text
        option.selected = FormDataJson.#matchValue(value, optionValue)
      }
    } else if (inputElement instanceof HTMLInputElement && inputType === 'file') {
      // cannot set file type
    } else {
      inputElement.value = value
    }
  }

  /**
   * Set inputs recursive
   * @param {Object<string, HTMLElement[]>} inputList
   * @param {*} values values
   * @param {string=} keyPrefix
   * @private
   */
  static #setInputValuesRecursive (inputList, values, keyPrefix) {
    if (!values || typeof values !== 'object') return

    for (let key in values) {
      const value = values[key]
      const inputName = keyPrefix ? keyPrefix + '[' + key + ']' : key
      const inputs = inputList[inputName] || null
      if (!inputs) {
        if (value && typeof value === 'object') {
          FormDataJson.#setInputValuesRecursive(inputList, value, inputName)
        }
        continue
      }
      console.log(key, value)
      continue

      if (inputs[0] instanceof HTMLSelectElement) {
        console.log(inputs[0], value)

        FormDataJson.#setInputValue(inputs[0], value)
        continue
      }
      // multiple inputs with same name can be input that can be a input with a checkbox, checkboxes are checked when the value matches the given value
      if (inputs.length > 0 && inputs[0].type && FormDataJson.#checkedInputTypes.indexOf(inputs[0].type.toLowerCase()) > -1) {
        for (let i = 0; i < inputs.length; i++) {
          FormDataJson.#setInputValue(inputs[i], value)
        }
        continue
      }
      if (FormDataJson.#isObject(value)) {
        // real objects are supposed to be the next level, as no input can take a real object (only arrays), so go one deeper
        FormDataJson.fromJson(el, value, options, inputName, depth + 1)
        continue
      }
      FormDataJson.#setInputValue(inputs[0], value)
    }
  }

  /**
   * Convert any value to a string
   * A object/array/undefined will be an ampty string
   * Boolean will be 1 or 0
   * @param {*} value
   */
  static #stringify (value) {
    if (value === undefined) return ''
    if (typeof value === 'object') return ''
    if (typeof value === 'boolean') return value ? '1' : '0'
    return value + ''
  }

  /**
   * Check if the given value match the expected value
   * If value is array/object than check each single key. If one does match, it returns true
   * @param {*} value
   * @param {*} expected
   * @return {boolean}
   */
  static #matchValue (value, expected) {
    expected = FormDataJson.#stringify(expected)
    if (value && typeof value === 'object') {
      for (let key in value) {
        if (FormDataJson.#stringify(value[key]) === expected) {
          return true
        }
      }
    } else {
      return FormDataJson.#stringify(value) === expected
    }
    return false
  }

  /**
   * Get all input fields as a flat array
   * @param {*} el
   * @return {Object|null}
   * @private
   */
  static #getInputsFlat (el) {
    el = FormDataJson.#getElement(el)
    if (!el) {
      return null
    }
    let inputs = el.querySelectorAll('select, textarea, input, button')
    let inputsFlat = []
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      if (!input.name || input.name.length === 0) continue
      inputsFlat.push({'name' : input.name, 'input' : input})

      let inputName = input.name
      let inputNameClean = inputName.replace(/\[\]$/g, '')
      let isMultiple = input instanceof HTMLSelectElement && input.multiple
      // for all elements with blank array index, that uses auto increment key
      if (!isMultiple && inputNameClean !== inputName) {
        if (!FormDataJson.#isArray(inputsFlat[inputNameClean])) {
          inputsFlat[inputNameClean] = []
        }
        inputsFlat[inputNameClean].push(input)
      } else {
        if (isMultiple) {
          inputsFlat[inputNameClean] = input
        } else {
          inputsFlat[inputName] = input
        }
      }
    }
    let returnObject = {}
    for (let inputName in inputsFlat) {
      const row = inputsFlat[inputName]
      if (FormDataJson.#isArray(row)) {
        for (let i = 0; i < row.length; i++) {
          returnObject[inputName + '[' + i + ']'] = row[i]
        }
      } else {
        returnObject[inputName] = row
      }
    }
    return returnObject
  }

  /**
   * Check if arg is a real object (not null) and no array
   * @param {*} arg
   * @return {boolean}
   * @private
   */
  static #isObject (arg) {
    return arg && typeof arg === 'object' && Object.prototype.toString.call(arg) !== '[object Array]'
  }

  /**
   * Check if arg is arr
   * @param {*} arg
   * @return {boolean}
   * @private
   */
  static #isArray (arg) {
    return typeof arg === 'object' && Object.prototype.toString.call(arg) === '[object Array]'
  }

  /**
   * Check if given input element is allowed depending on the given options
   * @param {HTMLElement} element
   * @param {Object=} options
   * @return {boolean}
   * @private
   */
  static #isElementAllowed (element, options) {
    if (typeof options.inputFilter !== 'function') return true
    return options.inputFilter(element) === true
  }

  /**
   * Get html element out of given parameter
   * @param {HTMLElement|JQuery|string} param
   * @return {HTMLElement|null}
   * @private
   */
  static #getElement (param) {
    if (typeof param === 'string') return document.querySelector(param)
    if (param instanceof HTMLElement) return param
    if (typeof jQuery !== 'undefined' && param instanceof jQuery) param = param[0]
    console.warn('FormDataJson: Unsupported element passed')
    return null
  }

  /**
   * Take an object and make it an one dimensional object
   * Example: {'foo' : {'bar' 1, 'name' : 'nobody'}} becomes to { 'foo[bar]' : 1, 'foo[name]' : 'nobody'}
   * @param {Object} src
   * @param {string=} prependKey
   * @param {Object=} merged
   * @return {Object}
   * @private
   */
  static #flatten (src, prependKey, merged) {
    merged = merged || {}
    for (let i in src) {
      const k = prependKey ? prependKey + '[' + i + ']' : i
      if (typeof src[i] === 'object' && src[i] !== null) {
        merged = FormDataJson.#flatten(src[i], k, merged)
      } else {
        merged[k] = src[i]
      }
    }
    return merged
  }
}

// module exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormDataJson
}