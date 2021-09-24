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
    let inputs = FormDataJson.getFieldTree(el)
    if (!inputs.length) return {}

    console.log(inputs)
    options = Object.assign({}, FormDataJson.defaultOptionsToJson, options || {})
    let returnObject = {}
    let files = []
    for (let k = 0; k < inputs.length; k++) {
      const row = inputs[k]
      const input = row.input
      const inputType = (input.type || 'text').toLowerCase()

      // ignore disabled fields
      if (!options.includeDisabled && input.disabled) {
        continue
      }

      // filter elements by input filter
      if (!FormDataJson.#checkInputFilter(input, options)) {
        continue
      }

      // radio inputs are special, as multiple inputs share the same name
      // we have already processed the same input name
      if (inputType === 'radio') {
        if (typeof returnObject[row.name] !== 'undefined') continue
        returnObject[row.name] = null
        // radio elements are supposed to have same input names, so take the value from the checked one
        for (let i = 0; i < row.inputGroup.length; i++) {
          let inputGroup = row.inputGroup[i]
          if (inputGroup.checked) {
            returnObject[row.name] = inputGroup.value
            break
          }
        }
        continue
      }

      // ignore button values
      if (!options.includeButtonValues && (input instanceof HTMLButtonElement || FormDataJson.#buttonInputTypes.indexOf(inputType) > -1)) {
        continue
      }

      let value = null
      if (input instanceof HTMLSelectElement) {
        let arr = []
        for (let i = 0; i < input.options.length; i++) {
          let option = input.options[i]
          if (option.selected) {
            arr.push((typeof option.value !== 'undefined' ? option.value : option.text).toString())
          }
        }
        if (input.multiple) {
          value = arr
        } else {
          value = arr.length ? arr[0] : null
        }
      } else if (FormDataJson.#checkedInputTypes.indexOf(inputType) > -1) {
        value = input.checked ? input.value : null
      } else {
        value = input.value
      }

      // ignore unchecked fields
      if (!options.includeUncheckedAsNull && FormDataJson.#checkedInputTypes.indexOf(inputType) > -1 && value === null) {
        continue
      }

      let keySplit = options.flatList ? [row.name] : row.nameWithIndex.replace(/\]/g, '').split('[')
      // multiple selects are one level higher when ending with []
      if (row.name.endsWith('[]') && input instanceof HTMLSelectElement && input.multiple) {
        keySplit.pop()
      }

      let useObject = returnObject
      let keyParts = keySplit.length
      for (let i = 0; i < keyParts; i++) {
        let keyPart = keySplit[i]
        if (i === keyParts - 1) {
          // last level of input name array
          if (inputType === 'file') {
            if (options.filesCallback) {
              files.push({ 'object': useObject, 'key': keyPart, 'input': input })
            }
            value = null
          }
          useObject[keyPart] = value
        } else {
          if (typeof useObject[keyPart] !== 'object') {
            useObject[keyPart] = {}
          }
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
              options.filesCallback(FormDataJson.#arrayfy(returnObject))
            }
          }
          reader[options.fileReaderFunction](file)
        }
      }
    } else if (options.filesCallback) {
      options.filesCallback(FormDataJson.#arrayfy(returnObject))
    }
    return FormDataJson.#arrayfy(returnObject)
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
    let inputs = FormDataJson.getFieldTree(el)
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
    let inputs = FormDataJson.getFieldTree(el)
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
   * Make an object to array if possible
   * @param {Object} object
   * @return {*}
   */
  static #arrayfy (object) {
    if (FormDataJson.#isObject(object)) {
      let count = 0
      let valid = true
      for (let key in object) {
        if (FormDataJson.#isObject(object[key])) {
          object[key] = FormDataJson.#arrayfy(object[key])
        }
        if (parseInt(key) !== count) {
          valid = false
        }
        count++
      }
      if (valid) {
        return Object.values(object)
      }
    }
    return object
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
   * Get all input fields as a multidimensional tree, as it would later appear in json data
   * @param {*} el
   * @return {Object}
   * @private
   */
  static getFieldTree (el) {
    el = FormDataJson.#getElement(el)
    if (!el) {
      return []
    }
    let inputs = el.querySelectorAll('select, textarea, input, button')
    let inputTree = {}
    let autoIncrementCounts = {}
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      if (!input.name || input.name.length === 0) continue
      const inputType = (input.type || 'text').toLowerCase()
      let name = input.name
      const keyParts = input.name.replace(/\]/g, '').split('[')
      if (name.endsWith('[]')) {
        if (input instanceof HTMLSelectElement && input.multiple) {
          // special for multiple selects, we skip the last empty part to fix double nested arrays
          keyParts.pop()
        } else if (inputType === 'radio') {
          // special for radio buttons, as they group multiple inputs to the same name
          // so a radio could never be an auto increment array name
          keyParts.pop()
        }
      }

      const keyPartsLength = keyParts.length
      let useObject = inputTree
      let currentName = ''
      for (let j = 0; j < keyPartsLength; j++) {
        let keyPart = keyParts[j]
        currentName = currentName ? currentName + '[' + keyPart + ']' : keyPart
        // auto increment key part
        if (keyPart === '') {
          if (typeof autoIncrementCounts[currentName] === 'undefined') {
            autoIncrementCounts[currentName] = 0
          }
          keyPart = autoIncrementCounts[currentName].toString()
          autoIncrementCounts[currentName]++
        }
        if (keyPartsLength - 1 === j) {
          // last level
          useObject[keyPart] = input
        } else {
          if (typeof useObject[keyPart] === 'undefined') {
            useObject[keyPart] = {}
          }
          useObject = useObject[keyPart]
        }
      }
    }
    return inputTree
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
   * Get length of an object/array
   * @param {*} arg
   * @return {number}
   * @private
   */
  static #objectLength (arg) {
    if (FormDataJson.#isArray(arg)) return arg.length
    if (FormDataJson.#isObject(arg)) {
      let count = 0
      for (let k in arg) count++
      return count
    }
    return 0
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
   * Check if given input element is allowed depending on the given filter
   * @param {HTMLElement} element
   * @param {Object=} options
   * @return {boolean}
   * @private
   */
  static #checkInputFilter (element, options) {
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