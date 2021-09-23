'use strict'

/**
 * Form Data Json Converter
 * @link https://github.com/brainfoolong/form-data-json
 * @licence MIT
 */
class FormDataJson {

  /**
   * All input types that are buttons
   * @type {string[]}
   */
  static buttonInputTypes = ['button', 'submit', 'reset', 'image']

  /**
   * All input types that have a checked status
   * @type {string[]}
   */
  static checkedInputTypes = ['checkbox', 'radio']

  /**
   * Get input value
   * Unchecked checkboxes/radios will return null
   * Unselected single selectbox will return null, multiple always return array even if it's empty
   * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} inputElement
   * @return {*}
   */
  static getInputValue (inputElement) {
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
    if (inputElement instanceof HTMLInputElement && FormDataJson.checkedInputTypes.indexOf(inputElement.type.toLowerCase()) > -1) {
      return inputElement.checked ? inputElement.value : null
    }
    return inputElement.value
  }

  /**
   * Set input value
   * To mark radio/checkbox as checked the value must match the checkbox value attribute, boolean true/false does not work here
   * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} inputElement
   * @param {*|null} value Null will unset the value
   */
  static setInputValue (inputElement, value) {
    let inputType = (inputElement.type || 'text').toLowerCase()
    if (inputElement instanceof HTMLInputElement && FormDataJson.checkedInputTypes.indexOf(inputType) > -1) {
      inputElement.checked = value === inputElement.value
    } else if (inputElement instanceof HTMLSelectElement) {
      if (!FormDataJson.isArray(value)) value = [value]
      // convert all values to string to fix not found indexOf when passing numbers
      for (let i = 0; i < value.length; i++) {
        value[i] = value[i] !== null && value[i] !== undefined ? value[i] + '' : value[i]
      }
      for (let i = 0; i < inputElement.options.length; i++) {
        let option = inputElement.options[i]
        let optionValue = typeof option.value !== 'undefined' ? option.value : option.text
        option.selected = value.indexOf(optionValue) > -1
      }
    } else if (inputElement instanceof HTMLInputElement && inputType === 'file') {
      // cannot set file type
    } else {
      inputElement.value = value
    }
  }

  /**
   * Take an object and make it an one dimensional object
   * Example: {'foo' : {'bar' 1, 'name' : 'nobody'}} becomes to { 'foo[bar]' : 1, 'foo[name]' : 'nobody'}
   * @param {Object} src The data from formToJson
   * @param {string=} prependKey Internal
   * @param {Object=} merged Internal
   * @return {Object}
   */
  static flatten (src, prependKey, merged) {
    merged = merged || {}
    for (let i in src) {
      const k = prependKey ? prependKey + '[' + i + ']' : i
      if (typeof src[i] === 'object' && src[i] !== null) {
        merged = FormDataJson.flatten(src[i], k, merged)
      } else {
        merged[k] = src[i]
      }
    }
    return merged
  }

  /**
   * Get all form elements as a flat key/value mapping
   * @param {*} el
   * @return {Object|null}
   * @private
   */
  static getFormElementsFlat (el) {
    el = FormDataJson.getElement(el)
    if (!el) {
      console.warn('FormDataJson: Unsupported element passed')
      return null
    }
    let inputs = el.querySelectorAll('select, textarea, input, button')
    let inputsFlat = {}
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i]
      if (!input.name || input.name.length === 0) continue
      let inputName = input.name
      let inputNameClean = inputName.replace(/\[\]$/g, '')
      let isMultiple = input instanceof HTMLSelectElement && input.multiple
      // for all elements with blank array index, that uses auto increment key
      if (!isMultiple && inputNameClean !== inputName) {
        if (typeof inputsFlat[inputNameClean] === 'undefined') {
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
      if (FormDataJson.isArray(row)) {
        for (let i = 0; i < row.length; i++) {
          returnObject[inputName + '[' + i + ']'] = { 'type': 'array', 'input': row[i] }
        }
      } else {
        returnObject[inputName] = { 'type': 'default', 'input': row }
      }
    }
    return returnObject
  }

  /**
   * Get values from all form elements inside the given element
   * @param {*} el
   * @param {Object=} options
   * @param {function=} fileValuesCallback If given, than call this callback when all file values are readed as base64 data-uri
   * @return {Object}
   */
  static toJson (el, options, fileValuesCallback) {
    let inputs = FormDataJson.getFormElementsFlat(el)
    if (!inputs) return {}
    options = options || {}
    let returnObject = {}
    for (let inputName in inputs) {
      const row = inputs[inputName]
      const input = row.input
      if (!FormDataJson.isElementAllowed(input, options)) continue
      let inputType = (input.type || 'text').toLowerCase()
      if (!options.includeDisabled && input.disabled) continue
      if (!options.includeButtonValues && (input instanceof HTMLButtonElement || FormDataJson.buttonInputTypes.indexOf(inputType) > -1)) {
        continue
      }
      let value = FormDataJson.getInputValue(input)
      let keySplit = inputName.split('[')
      let useObject = returnObject
      let keyParts = keySplit.length
      for (let i = 0; i < keyParts; i++) {
        let keyPart = keySplit[i].replace(/\]$/, '')
        if (i === keyParts - 1) {
          useObject[keyPart] = value
        } else {
          if (typeof useObject[keyPart] === 'undefined') {
            useObject[keyPart] = row.type === 'array' ? [] : {}
          }
          useObject = useObject[keyPart]
        }
      }
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
  static fromJson (el, values, options, keyPrefix, depth) {
    if (!values) return
    el = FormDataJson.getElement(el)
    if (!el) {
      console.warn('FormDataJson: Unsupported element passed')
      return
    }
  }

  /**
   * Get values from form
   * @param {HTMLFormElement|Element} formElement
   * @param {FormDataJsonOptions=} options
   * @param {function=} fileValuesCallback If given, than call this callback when all file values are readed as base64 data-uri
   * @return {Object}
   */
  static formToJson (formElement, options, fileValuesCallback) {
    if (options && !(options instanceof FormDataJsonOptions)) {
      console.error('Options are not an instance of FormDataJsonOptions')
      return
    }
    options = options || new FormDataJsonOptions()
    let object = {}
    let inputs = formElement.querySelectorAll('select, textarea, input, button')
    let arrayCounts = {}
    let files = []
    for (let i = 0; i < inputs.length; i++) {
      let input = inputs[i]
      if (!FormDataJson.isElementAllowed(input, options)) continue
      let inputType = (input.type || 'text').toLowerCase()
      if (!input.name || input.name.length === 0) continue
      if (!options.includeDisabled && input.disabled) continue
      let value = FormDataJson.getInputValue(input)
      if (!options.includeButtonValues && (input instanceof HTMLButtonElement || FormDataJson.buttonInputTypes.indexOf(inputType) > -1)) {
        continue
      }
      let isMultiple = input instanceof HTMLSelectElement && input.multiple
      let o = object
      let nameSplit = input.name.split('[')
      let nameSplitLength = nameSplit.length
      for (let j = 0; j < nameSplitLength; j++) {
        let namePart = nameSplit[j]
        if (j > 0) namePart = namePart.substr(0, namePart.length - 1)
        // need to increment auto-index if given a name with no array index
        if (namePart.length === 0) {
          if (typeof arrayCounts[input.name] === 'undefined') {
            arrayCounts[input.name] = 0
          }
          namePart = arrayCounts[input.name].toString()
          arrayCounts[input.name]++
        }
        // multiple selects will always need an array in name, so leave loop 1 depth earlier because value is already an array
        if (isMultiple && j === nameSplit.length - 2) {
          o[namePart] = value
          break
        } else if (j === nameSplit.length - 1) {
          // radio button can exist multiple times with same name, so only set value when undefined
          if (inputType === 'radio' && typeof o[namePart] !== 'undefined') {
            break
          }
          o[namePart] = value
          // delete key is we should not include undefined values
          if (!options.includeUncheckedAsNull && FormDataJson.checkedInputTypes.indexOf(inputType) > -1 && value === null) {
            delete o[namePart]
          }
          if (inputType === 'file') {
            delete o[namePart]
            if (fileValuesCallback) {
              files.push({ 'object': o, 'name': namePart, 'input': input })
            }
          }
        } else {
          if (typeof o[namePart] !== 'object') {
            o[namePart] = {}
          }
          o = o[namePart]
        }
      }
    }
    if (files.length) {
      let filesDone = 0
      let filesRequired = 0
      for (let i = 0; i < files.length; i++) {
        let row = files[i]
        let o = row.object
        filesRequired += row.input.files.length
        for (let j = 0; j < row.input.files.length; j++) {
          let file = row.input.files[j]
          let reader = new FileReader()
          reader.onload = function () {
            if (typeof o[row.name] === 'undefined') {
              o[row.name] = row.input.multiple ? [] : null
            }
            if (row.input.multiple) {
              o[row.name].push(reader.result)
            } else {
              o[row.name] = reader.result
            }
            filesDone++
            if (filesDone === filesRequired) {
              fileValuesCallback(FormDataJson.convertObjectToArrayIfPossible(object))
            }
          }
          reader.readAsDataURL(file)
        }
      }
    } else if (fileValuesCallback) {
      fileValuesCallback(FormDataJson.convertObjectToArrayIfPossible(object))
    }
    return FormDataJson.convertObjectToArrayIfPossible(object)
  }

  /**
   * Fill form from json values
   * @param {HTMLFormElement|Element} formElement
   * @param {Object} values
   * @param {FormDataJsonOptions=} options
   * @param {string=} keyPrefix
   * @param {number=} depth Internal reference for depth, leave empty
   */
  static fillFormFromJsonValues (formElement, values, options, keyPrefix, depth) {
    if (options && !(options instanceof FormDataJsonOptions)) {
      console.error('Options are not an instance of FormDataJsonOptions')
      return
    }
    if (!values) {
      return
    }
    options = options || new FormDataJsonOptions()
    if (options.unsetAllInputsOnFill && !depth) {
      FormDataJson.unsetFormInputs(formElement)
    }
    depth = depth || 0
    depth++
    let arrayCounts = {}
    let inputsFlat = {}
    let inputs = formElement.querySelectorAll('select, textarea, input, button')
    for (let i = 0; i < inputs.length; i++) {
      let input = inputs[i]
      if (!FormDataJson.isElementAllowed(input, options)) continue
      let inputName = input.name
      let isMultiple = input instanceof HTMLSelectElement && input.multiple
      if (!inputName || inputName.length === 0) continue
      inputsFlat[inputName] = input
      if (inputName.match(/\[\]/)) {
        let parts = inputName.split('[]')
        if (isMultiple) {
          parts = inputName.substr(0, inputName.length - 2).split('[]')
        }
        let partInputName = ''
        for (let j = 0; j < parts.length; j++) {
          if (!parts[j].length) continue
          partInputName += parts[j] + '[]'
          if (typeof arrayCounts[partInputName] === 'undefined') {
            arrayCounts[partInputName] = -1
          }
          arrayCounts[partInputName]++
          partInputName = partInputName.replace(/\[\]/, '[' + arrayCounts[partInputName] + ']')
        }
        if (isMultiple) {
          partInputName += '[]'
        }
        inputsFlat[partInputName] = input
      }
    }
    for (let inputName in values) {
      let value = values[inputName]
      let searchInputName = keyPrefix ? keyPrefix + '[' + inputName + ']' : inputName
      let testInputNames = [searchInputName, searchInputName + '[]']
      let input = null
      for (let i = 0; i < testInputNames.length; i++) {
        console.log(testInputNames[i])
        input = inputsFlat[testInputNames[i]] || null
        if (input) {
          FormDataJson.setInputValue(input, value)
          break
        }
      }
      if (!input && typeof value === 'object') {
        FormDataJson.fillFormFromJsonValues(formElement, value, options, searchInputName, depth)
      }
    }
  }

  /**
   * Unset for inputs in given form/container
   * @param {HTMLFormElement|Element} formElement
   * @param {FormDataJsonOptions=} options
   */
  static unsetFormInputs (formElement, options) {
    let inputs = formElement.querySelectorAll('select, textarea, input')
    for (let i = 0; i < inputs.length; i++) {
      let input = inputs[i]
      if (!FormDataJson.isElementAllowed(input, options)) continue
      let inputType = (input.type || 'text').toLowerCase()
      if (FormDataJson.buttonInputTypes.indexOf(inputType) > -1) {
        continue
      }
      FormDataJson.setInputValue(input, null)
    }
  }

  /**
   * Check if arg is arr
   * @param {*} arg
   * @return {boolean}
   */
  static isArray (arg) {
    return typeof arg === 'object' && Object.prototype.toString.call(arg) === '[object Array]'
  }

  /**
   * Check if given input element is allowed depending on the given options
   * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} element
   * @param {Object=} options
   * @return {boolean}
   */
  static isElementAllowed (element, options) {
    if (typeof options.inputFilter !== 'function') return true
    return options.inputFilter(element) === true
  }

  /**
   * Convert given object into a real array, if the object only contains numeric incremented indexes
   * Otherwise it just return the given object unmodified
   * @param {Object} object
   * @return {Object|Array|*}
   */
  static convertObjectToArrayIfPossible (object) {
    if (!object) return object
    const keys = Object.keys(object)
    let validArray = true
    for (let i = 0; i < keys.length; i++) {
      const value = object[keys[i]]
      if (value && typeof value === 'object' && !FormDataJson.isArray(value)) {
        object[keys[i]] = FormDataJson.convertObjectToArrayIfPossible(value)
      }
      if (keys[i] !== i.toString()) {
        validArray = false
      }
    }
    if (validArray) {
      return Object.values(object)
    }
    return object
  }

  /**
   * Get html element out of given parameter
   * @param {HTMLElement|JQuery|string} param
   * @return {HTMLElement|null}
   */
  static getElement (param) {
    if (typeof param === 'string') return document.querySelector(param)
    if (param instanceof HTMLElement) return param
    if (typeof jQuery !== 'undefined' && param instanceof jQuery) param = param[0]
    return null
  }
}

// module exports
if (

  typeof
    module
  !==
  'undefined'
  &&
  module
    .exports
) {
  module
    .exports = FormDataJson
}