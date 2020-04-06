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
   * Unselected selectbox will return null
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
   * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} inputElement
   * @param {*|null} value Null will unset the value
   */
  static setInputValue (inputElement, value) {
    let inputType = (inputElement.type || 'text').toLowerCase()
    if (inputElement instanceof HTMLInputElement && FormDataJson.checkedInputTypes.indexOf(inputType) > -1) {
      inputElement.checked = value === inputElement.value
    } else if (inputElement instanceof HTMLSelectElement) {
      if (!FormDataJson.isArray(value)) value = [value]
      for (let i = 0; i < inputElement.options.length; i++) {
        let option = inputElement.options[i]
        let optionValue = typeof option.value !== 'undefined' ? option.value : option.text
        option.selected = value.indexOf(optionValue) > -1
      }
    } else {
      inputElement.value = value
    }
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
   * @param {string=} keyPrefix
   */
  static fillFormFromJsonValues (formElement, values, options, keyPrefix) {
    if (options && !(options instanceof FormDataJsonOptions)) {
      console.error('Options are not an instance of FormDataJsonOptions')
      return
    }
    if (!values) {
      return
    }
    options = options || new FormDataJsonOptions()
    if (options.unsetAllInputsOnFill) {
      FormDataJson.unsetFormInputs(formElement)
    }
    let arrayCounts = {}
    let inputsFlat = {}
    let inputs = formElement.querySelectorAll('select, textarea, input, button')
    for (let i = 0; i < inputs.length; i++) {
      let input = inputs[i]
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
      if (FormDataJson.isArray(value)) {
        searchInputName += '[]'
      }
      let input = inputsFlat[searchInputName] || null
      if (typeof value === 'object' && !FormDataJson.isArray(value)) {
        FormDataJson.fillFormFromJsonValues(formElement, value, options, searchInputName)
      } else if (input) {
        FormDataJson.setInputValue(input, value)
      }
    }
  }

  /**
   * Unset for inputs
   * @param {HTMLFormElement|Element} formElement
   */
  static unsetFormInputs (formElement) {
    let inputs = formElement.querySelectorAll('select, textarea, input')
    for (let i = 0; i < inputs.length; i++) {
      let inputType = (inputs[i].type || 'text').toLowerCase()
      if (FormDataJson.buttonInputTypes.indexOf(inputType) > -1) {
        continue
      }
      FormDataJson.setInputValue(inputs[i], null)
    }
  }

  /**
   * Check if arg is arr
   * @param {*} arr
   * @return {boolean}
   */
  static isArray (arg) {
    return typeof arg === 'object' && Object.prototype.toString.call(arg) === '[object Array]'
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