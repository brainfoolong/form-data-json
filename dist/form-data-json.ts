/**
 * Form Data Json Converter
 * @link https://github.com/brainfoolong/form-data-json
 * @licence MIT
 */

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

export default class FormDataJson {

  /**
   * Default options for toJson()
   * @type {FormDataJsonOptionsToJson}
   */
  static defaultOptionsToJson: FormDataJsonOptionsToJson = {
    includeDisabled: false,
    includeButtonValues: false,
    uncheckedValue: undefined,
    inputFilter: null,
    flatList: false,
    skipEmpty: false,
    filesCallback: null,
    fileReaderFunction: 'readAsDataURL',
    arrayify: true,
    includeLinkedFormElements: true
  }

  /**
   * Default options for fromJson()
   * @type {FormDataJsonOptionsFromJson}
   */
  static defaultOptionsFromJson: FormDataJsonOptionsFromJson = {
    flatList: false,
    clearOthers: false,
    resetOthers: false,
    triggerChangeEvent: false,
    includeLinkedFormElements: true
  }

  /**
   * Default options for reset()
   * @type {FormDataJsonOptionsReset}
   */
  static defaultOptionsReset: FormDataJsonOptionsReset = {
    triggerChangeEvent: false,
    includeLinkedFormElements: true
  }

  /**
   * Default options for clear()
   * @type {FormDataJsonOptionsClear}
   */
  static defaultOptionsClear: FormDataJsonOptionsClear = {
    triggerChangeEvent: false,
    includeLinkedFormElements: true
  }

  /**
   * All input types that are buttons
   * @type {string[]}
   */
  static buttonInputTypes: string[] = ['button', 'submit', 'reset', 'image']

  /**
   * All input types that have a checked status
   * @type {string[]}
   */
  static checkedInputTypes: string[] = ['checkbox', 'radio']

  /**
   * Get values from all form elements inside the given element
   * @param {*} el
   * @param {FormDataJsonOptionsToJson=} toJsonOptions
   * @return {Object|Array|null}
   */
  static toJson (el: any, toJsonOptions: FormDataJsonOptionsToJson | undefined): object | Array<any> | null {
    const options = FormDataJson.merge(FormDataJson.defaultOptionsToJson, toJsonOptions)

    /**
     * Check if given input is valid for given filters based on given options
     * @param {HTMLElement} input
     * @return {boolean}
     */
    function isValidInput (input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLElement): boolean {
      // filter elements by input filter
      if (typeof options.inputFilter === 'function' && options.inputFilter(input) !== true) {
        return false
      }

      // ignore disabled fields
      if (!options.includeDisabled && input.hasAttribute('disabled')) {
        return false
      }

      const inputType = (input.getAttribute('type') || 'text').toLowerCase()

      // ignore button values
      if (!options.includeButtonValues && (input instanceof HTMLButtonElement || FormDataJson.buttonInputTypes.indexOf(inputType) > -1)) {
        return false
      }

      // ignore unchecked fields when no value is given
      if (input instanceof HTMLInputElement && typeof options.uncheckedValue === 'undefined' && FormDataJson.checkedInputTypes.indexOf(inputType) > -1 && !input.checked) {
        return false
      }

      return true
    }

    const tree = FormDataJson.getFieldTree(el, isValidInput, options)
    let returnObject = options.flatList ? [] : {}
    const files: any = []

    /**
     * Recursive get values
     * @param {Object} inputs
     * @param {Object} values
     */
    function recursiveGetInputValues (inputs: any, values: any): void {
      for (let key in inputs) {
        const row = inputs[key]
        const objectKey = options.flatList ? row.name : key
        // next level
        if (row.type === 'nested') {
          if (options.flatList) {
            recursiveGetInputValues(row.tree, values)
          } else {
            values[key] = {}
            recursiveGetInputValues(row.tree, values[key])
          }
          continue
        }
        const input = row.input
        const inputType = row.inputType

        if (inputType === 'file') {
          if (options.filesCallback) {
            files.push({ 'object': values, 'key': objectKey, 'input': input })
          }
          continue
        }

        let value = null
        if (row.type === 'radio') {
          for (let i = 0; i < row.inputs.length; i++) {
            const radioInput = row.inputs[i]
            if (radioInput.checked) {
              value = radioInput.value
              break
            }
          }
          if (value === null) {
            value = options.uncheckedValue
          }
        } else if (inputType === 'checkbox') {
          value = input.checked ? input.value : options.uncheckedValue
        } else if (input instanceof HTMLSelectElement) {
          let arr: any = []
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
        } else {
          value = input.value
        }
        if (options.flatList) {
          values.push([row.name, value])
        } else {
          values[objectKey] = value
        }
      }
    }

    /**
     * Make an object to array if possible
     * @param {Object} object
     * @return {any}
     * @private
     */
    function arrayify (object: any): any {
      if (FormDataJson.isObject(object)) {
        let count = 0
        let valid = true
        for (let key in object) {
          if (FormDataJson.isObject(object[key]) && !(object[key] instanceof Element)) {
            object[key] = arrayify(object[key])
          }
          if (parseInt(key) !== count) {
            valid = false
          }
          count++
        }
        if (valid) {
          let arr: any = []
          for (let i in object) {
            arr.push(object[i])
          }
          return arr
        }
      }
      return object
    }

    /**
     * Does some final cleanup before output data
     * @return {*}
     */
    function output (): any {
      if (options.skipEmpty) {
        returnObject = removeEmpty(returnObject) || (options.flatList ? [] : {})
      }
      if (options.arrayify) {
        returnObject = arrayify(returnObject)
      }
      return returnObject
    }

    /**
     * Recursively remove empty keys
     * @param {Object} object
     * @param {number} depth
     * @return {Object|Array}
     */
    function removeEmpty (object: any, depth: number = 0): any {
      const newObject: any = FormDataJson.isArray(object) ? [] : {}
      let count = 0
      for (let key in object) {
        let value = object[key]
        if (options.flatList && !depth) {
          value = value[1]
        }
        if (value === null || value === undefined || value === '') {
          continue
        }
        if (FormDataJson.isObject(value) || FormDataJson.isArray(value)) {
          value = removeEmpty(value, (depth || 0) + 1) || ''
        }
        if (typeof value !== 'object' && FormDataJson.stringify(value) === '') {
          continue
        }
        if (FormDataJson.isArray(newObject)) {
          newObject.push(options.flatList && !depth ? [object[key][0], value] : value)
        } else {
          newObject[key] = value
        }
        count++
      }
      return count ? newObject : null
    }

    recursiveGetInputValues(tree, returnObject)

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
              if (!FormDataJson.isArray(useObject[row.key])) {
                useObject[row.key] = []
              }
              useObject[row.key].push(reader.result)
            } else {
              useObject[row.key] = reader.result
            }
            filesDone++
            if (filesDone === filesRequired) {
              options.filesCallback(output())
            }
          }
          reader[options.fileReaderFunction](file)
        }
      }
      return null
    } else if (options.filesCallback) {
      options.filesCallback(output())
      return null
    }
    return output()
  }

  /**
   * Fill given form values into all form elements inside given element
   * @param {*} el
   * @param {Object|Array} values
   * @param {FormDataJsonOptionsFromJson=} fromJsonOptions
   */
  static fromJson (el: any, values: any, fromJsonOptions: FormDataJsonOptionsFromJson) {
    if (!FormDataJson.isObject(values) && !FormDataJson.isArray(values)) {
      return
    }
    const options: FormDataJsonOptionsFromJson = FormDataJson.merge(FormDataJson.defaultOptionsFromJson, fromJsonOptions)
    const tree = FormDataJson.getFieldTree(el, null, options)
    const lastUsedFlatListIndex = {}

    if (options.clearOthers) {
      FormDataJson.clear(el, options)
    }
    if (options.resetOthers) {
      FormDataJson.reset(el, options)
    }

    /**
     * Recursive set values
     * @param {*} inputs
     * @param {*} newValues
     */
    function resursiveSetInputValues (inputs: any, newValues: any): void {
      if (!FormDataJson.isObject(newValues) && !FormDataJson.isArray(newValues)) {
        return
      }
      for (let key in inputs) {
        const row = inputs[key]
        const objectKey = options.flatList ? row.name : key
        // next level
        if (row.type === 'nested') {
          if (options.flatList) {
            resursiveSetInputValues(row.tree, newValues)
          } else if (typeof newValues[objectKey] === 'object') {
            // check for a very special case of array checkbox values using autoIncrement names and value to set is given an array
            // the array contains the values to be checked in a random order, that's because we need to check this specially
            const newSubValues = newValues[objectKey]
            let newTree = row.tree
            if (FormDataJson.isArray(newSubValues)) {
              newTree = {}
              for (let subTreeKey in row.tree) {
                const subRow = row.tree[subTreeKey]
                if (subRow.autoIncrementInputs) {
                  if (subRow.input.type.toLowerCase() === 'checkbox' && newSubValues.indexOf(subRow.input.value) > -1) {
                    subRow.input.checked = true
                    continue
                  }
                }
                newTree[subTreeKey] = subRow
              }
            }
            resursiveSetInputValues(newTree, newSubValues)
          }
          continue
        }
        // flat list must search correct entry for given input name
        if (options.flatList) {
          for (let i in newValues) {
            const value = newValues[i]
            if (value && value[0] === row.name) {
              if (lastUsedFlatListIndex[row.name] !== i) {
                lastUsedFlatListIndex[row.name] = i
                FormDataJson.setInputValue(row, value[1], options.triggerChangeEvent)
                break
              }
            }
          }
          continue
        }
        // skip fields that are not presented in the value list
        if (typeof newValues[objectKey] === 'undefined') {
          continue
        }
        FormDataJson.setInputValue(row, newValues[objectKey] || null, options.triggerChangeEvent)
      }
    }

    resursiveSetInputValues(tree, values)
  }

  /**
   * Reset all input fields in the given element to their default values
   * @param {*} el
   * @param {FormDataJsonOptionsReset=} resetOptions
   */
  static reset (el: any, resetOptions: FormDataJsonOptionsReset | undefined = undefined): void {
    const options = FormDataJson.merge(FormDataJson.defaultOptionsReset, resetOptions)
    const tree = FormDataJson.getFieldTree(el, null, options)

    /**
     * Recursive reset
     * @param {*} inputs
     */
    function recursiveResetInputValues (inputs: any): void {
      for (let key in inputs) {
        const row = inputs[key]
        // next level
        if (row.type === 'nested') {
          recursiveResetInputValues(row.tree)
          continue
        }

        if (row.type === 'radio') {
          for (let i = 0; i < row.inputs.length; i++) {
            const radioInput = row.inputs[i]
            radioInput.checked = radioInput.defaultChecked
          }
          continue
        }

        // ignore button elements, as reset would reset button labels, which is mostly not that what anybody want
        if (row.inputType && FormDataJson.buttonInputTypes.indexOf(row.inputType) > -1) {
          continue
        }
        const input = row.input
        if (FormDataJson.checkedInputTypes.indexOf(row.inputType) > -1) {
          FormDataJson.setInputValue(row, input.defaultChecked, options.triggerChangeEvent)
        } else if (input instanceof HTMLSelectElement) {
          const selectOptions = input.querySelectorAll('option')
          const value: any = []
          for (let i = 0; i < selectOptions.length; i++) {
            const option = selectOptions[i]
            if (option.defaultSelected) {
              value.push(option.value)
            }
          }
          FormDataJson.setInputValue(row, value, options.triggerChangeEvent)
        } else if (input.getAttribute('value')) {
          FormDataJson.setInputValue(row, input.getAttribute('value'), options.triggerChangeEvent)
        } else if (typeof input.defaultValue === 'string' || typeof input.defaultValue === 'number') {
          FormDataJson.setInputValue(row, input.defaultValue, options.triggerChangeEvent)
        }
      }
    }

    recursiveResetInputValues(tree)
  }

  /**
   * Clear all input fields (to empty, unchecked, unselected) in the given element
   * @param {*} el
   * @param {FormDataJsonOptionsReset=} clearOptions
   */
  static clear (el: any, clearOptions: FormDataJsonOptionsReset | undefined = undefined): void {
    const options = FormDataJson.merge(FormDataJson.defaultOptionsClear, clearOptions)
    const tree = FormDataJson.getFieldTree(el, null, options)

    /**
     * Recursive clear
     * @param {*} inputs
     */
    function recursiveClearInputValues (inputs: any): void {
      for (let key in inputs) {
        const row = inputs[key]
        // next level
        if (row.type === 'nested') {
          recursiveClearInputValues(row.tree)
          continue
        }
        if (row.input) {
          // ignore button elements, as clear would unset button labels, which is mostly not that what anybody want
          if (FormDataJson.buttonInputTypes.indexOf(row.inputType) > -1) {
            continue
          }
        }
        FormDataJson.setInputValue(row, null, options.triggerChangeEvent)
      }
    }

    recursiveClearInputValues(tree)
  }

  /**
   * Set input value
   * @param {any} row
   * @param {any} newValue Null will unset the value
   * @param {boolean=} triggerChangeEvent
   * @private
   */
  private static setInputValue (row: any, newValue: any, triggerChangeEvent: boolean = false): void {
    const triggerChange = triggerChangeEvent ? function (el) {
      let ev: any
      if (typeof (Event) === 'function') {
        ev = new Event('change', { 'bubbles': true })
      } else {
        ev = document.createEvent('Event')
        ev.initEvent('change', true, true)
      }
      el.dispatchEvent(ev)
    } : null
    if (row.type === 'radio') {
      let changed: any = []
      for (let i = 0; i < row.inputs.length; i++) {
        const radioInput = row.inputs[i]
        if (radioInput.checked) {
          changed.push(radioInput)
        }
        radioInput.checked = false
        if (newValue !== null && FormDataJson.stringify(radioInput.value) === FormDataJson.stringify(newValue)) {
          if (!radioInput.checked) {
            changed.push(radioInput)
          }
          radioInput.checked = true
          break
        }
      }
      if (triggerChange) {
        for (let i in changed) {
          triggerChange(changed[i])
        }
      }
      return
    }

    const input = row.input
    const inputType = row.inputType

    // ignore file input, they cannot be set
    if (inputType === 'file') {
      return
    }

    let changed = false
    if (inputType === 'checkbox') {
      newValue = newValue === true || (newValue !== null && FormDataJson.stringify(input.value) === FormDataJson.stringify(newValue))
      if (newValue !== input.checked) {
        changed = true
      }
      input.checked = newValue
    } else if (input instanceof HTMLSelectElement) {
      let newValueArr = newValue
      if (newValueArr === null || newValueArr === undefined) {
        newValueArr = []
      } else if (FormDataJson.isObject(newValueArr)) {
        newValueArr = Object.values(newValueArr)
      } else if (!FormDataJson.isArray(newValueArr)) {
        newValueArr = [newValueArr]
      }
      const oldSelectedOptionIds: any = []
      const newSelectedOptionIds: any = []
      for (let i = 0; i < input.options.length; i++) {
        const option = input.options[i]
        const optionValue = (typeof option.value !== 'undefined' ? option.value : option.text).toString()
        if (option.selected) {
          oldSelectedOptionIds.push(i)
        }
        option.selected = false
        for (let j = 0; j < newValueArr.length; j++) {
          if (optionValue === FormDataJson.stringify(newValueArr[j])) {
            option.selected = true
            break
          }
        }
        if (option.selected) {
          newSelectedOptionIds.push(i)
        }
      }
      changed = JSON.stringify(oldSelectedOptionIds) !== JSON.stringify(newSelectedOptionIds)
    } else {
      if (input.value !== newValue) {
        changed = true
      }
      input.value = newValue
    }
    if (changed && triggerChange) {
      triggerChange(input)
    }
  }

  /**
   * Convert any value to a string
   * A object/array/undefined will be an ampty string
   * Boolean will be 1 or 0
   * @param {*} value
   * @return {string}
   * @private
   */
  private static stringify (value: any): string {
    if (value === undefined) {
      return ''
    }
    if (typeof value === 'object') {
      return ''
    }
    if (typeof value === 'boolean') {
      return value ? '1' : '0'
    }
    return value + ''
  }

  /**
   * Get all input fields as a multidimensional tree, as it would later appear in json data, but with input elements as values
   * @param {*} checkEl
   * @param {function|null=} isValidInput A function to check for valid input
   * @param { FormDataJsonOptionsToJson|FormDataJsonOptionsFromJson|FormDataJsonOptionsReset|FormDataJsonOptionsClear} options
   * @return {Object}
   * @private
   */
  private static getFieldTree (
    checkEl: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLElement,
    isValidInput: ((input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLElement) => boolean | undefined) | null = null,
    options: FormDataJsonOptionsToJson | FormDataJsonOptionsFromJson | FormDataJsonOptionsReset | FormDataJsonOptionsClear
  ): any {
    const el = FormDataJson.getElement(checkEl)
    if (!el) {
      return []
    }

    let inputs = Array.from(el.querySelectorAll('select, textarea, input, button'))
    // if we have a form with a name, we need to find all attributes that have a "form" attribute with that name as value as well
    if (options.includeLinkedFormElements && el instanceof HTMLFormElement && el.getAttribute('id')) {
      const formId = el.getAttribute('id')
      inputs = inputs.concat(Array.from(document.querySelectorAll('select[form="' + formId + '"], textarea[form="' + formId + '"], input[form="' + formId + '"], button[form="' + formId + '"]')))
    }
    let inputTree = {}
    let autoIncrementCounts = {}
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i] as HTMLInputElement
      if (!input.name || input.name.length === 0) {
        continue
      }
      if (isValidInput && isValidInput(input) !== true) {
        continue
      }

      const inputType = (input.type || 'text').toLowerCase()

      let name = input.name
      const keyParts = input.name.replace(/]/g, '').split('[')
      const isAutoIncrement = name.substring(name.length - 2) === '[]'
      if (isAutoIncrement) {
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
        let newCurrentName = currentName ? currentName + '[' + keyPart + ']' : keyPart
        // auto increment key part
        if (keyPart === '') {
          if (typeof autoIncrementCounts[newCurrentName] === 'undefined') {
            autoIncrementCounts[newCurrentName] = 0
          }
          keyPart = autoIncrementCounts[newCurrentName].toString()
          autoIncrementCounts[newCurrentName]++
        }
        currentName = currentName ? currentName + '[' + keyPart + ']' : keyPart
        // last level
        if (keyPartsLength - 1 === j) {
          // radio elements are special
          if ((input.type || 'text').toLowerCase() === 'radio') {
            if (typeof useObject[keyPart] === 'undefined') {
              useObject[keyPart] = {
                'type': 'radio',
                'name': input.name,
                'inputType': inputType,
                'inputs': [],
                'autoIncrementInputs': 0
              }
            }
            if (isAutoIncrement) {
              useObject[keyPart].autoIncrementInputs = 1
            }
            useObject[keyPart].inputs.push(input)
          } else {
            useObject[keyPart] = {
              'type': 'default',
              'name': input.name,
              'inputType': inputType,
              'input': input,
              'autoIncrementInputs': isAutoIncrement ? 1 : 0
            }
          }
        } else {
          // it could be possible, then really weird a non-standard conform input names result in already
          // existing data which we need to override here, for which the check to .tree is for
          if (typeof useObject[keyPart] === 'undefined' || typeof useObject[keyPart].tree === 'undefined') {
            useObject[keyPart] = { 'type': 'nested', 'tree': {} }
          }
          useObject = useObject[keyPart].tree
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
  private static isObject (arg: any): boolean {
    return arg && typeof arg === 'object' && Object.prototype.toString.call(arg) !== '[object Array]'
  }

  /**
   * Check if arg is arr
   * @param {*} arg
   * @return {boolean}
   * @private
   */
  private static isArray (arg: any): boolean {
    return Array.isArray(arg)
  }

  /**
   * Get html element out of given parameter
   * @param {HTMLElement|JQuery|$|string} param
   * @return {HTMLElement|null}
   * @private
   */
  private static getElement (param: any): HTMLElement | null {
    if (typeof param === 'string') {
      return document.querySelector(param)
    }
    if (param instanceof HTMLElement) {
      return param
    }
    // @ts-ignore
    if (typeof jQuery !== 'undefined' && param instanceof jQuery) {
      return param[0]
    }
    // @ts-ignore
    if (typeof $ !== 'undefined' && param instanceof $) {
      return param[0]
    }
    console.warn('FormDataJson: Unsupported element passed. Supported is HTMLElement, a string query selector, JQuery or $ object')
    return null
  }

  /**
   * Merge from left to right and return a new object
   * @param {Object} a
   * @param {Object} b
   * @return {Object}
   * @private
   */
  static merge (a: any, b: any): any {
    let c = {}
    for (let key in a) {
      c[key] = a[key]
    }
    for (let key in b) {
      c[key] = b[key]
    }
    return c
  }
}