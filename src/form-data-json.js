'use strict'

/**
 * Fix for older browsers
 */
if (!Array.isArray) {
  Array.isArray = function (vArg) {
    return Object.prototype.toString.call(vArg) === '[object Array]'
  }
}

/**
 * Form Data Json Converter
 * @link https://github.com/brainfoolong/formdata-json
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
   * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} inputElement
   * @return {*}
   */
  static getInputValue (inputElement) {
    if (inputElement instanceof HTMLSelectElement) {
      if (inputElement.multiple) {
        let arr = []
        for (let i = 0; i < inputElement.options.length; i++) {
          let opt = inputElement.options[i]
          if (opt.selected) {
            arr.push(typeof opt.value !== 'undefined' ? opt.value : opt.text)
          }
        }
        return arr
      }
      return inputElement.selectedIndex
    }
    if (inputElement instanceof HTMLInputElement && FormDataJson.checkedInputTypes.indexOf(inputElement.type.toLowerCase()) > -1) {
      return inputElement.checked ? inputElement.value : null
    }
    return inputElement.value
  }

  /**
   * Get values from form
   * @param {HTMLFormElement|Element} formElement
   * @param {FormDataJsonOptions=} options
   * @return {Object}
   */
  static formToJson (formElement, options) {
    if (options && !(options instanceof FormDataJsonOptions)) {
      console.error('Options are not an instance of FormDataJsonOptions')
      return
    }
    options = options || new FormDataJsonOptions()
    let object = {}
    let inputs = formElement.querySelectorAll('select, textarea, input, button')
    let arrayCounts = {}
    for (let i = 0; i < inputs.length; i++) {
      let input = inputs[i]
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
          if (!options.includeUncheckedAsNull && value === null) {
            delete o[namePart]
          }
        } else {
          if (typeof o[namePart] !== 'object') {
            o[namePart] = {}
          }
          o = o[namePart]
        }
      }
    }
    return object
  }

  /**
   * Fill form from json values
   * @param {HTMLFormElement|Element} formElement
   * @param {Object} values
   * @param {FormDataJsonOptions=} options
   */
  static fillFormFromJsonValues (formElement, values, options) {
    if (options && !(options instanceof FormDataJsonOptions)) {
      console.error('Options are not an instance of FormDataJsonOptions')
      return
    }
    if (!values) {
      return
    }
    for (let inputName in values) {

    }
  }

  /**
   * Merge options
   * @param {Object} optionsDefault
   * @param {Object=} optionsUser
   * @return {{}}
   */
  static mergeOptions (optionsDefault, optionsUser) {
    let options = {}
    for (let i in optionsDefault) {
      options[i] = optionsDefault[i]
    }
    if (typeof optionsUser === 'object') {
      for (let i in optionsUser) {
        options[i] = optionsUser[i]
      }
    }
    return options
  }
}

/**
 * Form data json options
 */
class FormDataJsonOptions {

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

  /**
   * Will unset all existing input fields in form when using fillFormFromJsonValues
   * This will be helpful if you have checkboxes and want to fill from json object, but checkboxes still stay checked
   * because the key not exist in the json data
   * @type {boolean}
   */
  unsetAllInputsOnFill = false

  /**
   * Constructor
   * @param {Object=} options
   */
  constructor (options) {
    this.merge(options)
  }

  /**
   * Merge options into this instance
   * @param {Object=} options
   */
  merge (options) {
    if (typeof options === 'object') {
      for (let i in options) {
        this[i] = options[i]
      }
    }
  }
}