// form-data-json-convert | version: 2.2.3 | url: https://github.com/brainfoolong/form-data-json
"use strict";

/**
 * Form Data Json Converter
 * @link https://github.com/brainfoolong/form-data-json
 * @licence MIT
 */
var FormDataJson = /*#__PURE__*/function () {
  function FormDataJson() {}
  /**
   * Get values from all form elements inside the given element
   * @param {*} el
   * @param {Object=} options
   * @return {Object|Array}
   */
  FormDataJson.toJson = function toJson(el, options) {
    options = FormDataJson.merge(FormDataJson.defaultOptionsToJson, options);

    /**
     * Check if given input is valid for given filters based on given options
     * @param {HTMLElement} input
     * @return {boolean}
     */
    function isValidInput(input) {
      // filter elements by input filter
      if (typeof options.inputFilter === 'function' && options.inputFilter(input) !== true) {
        return false;
      }

      // ignore disabled fields
      if (!options.includeDisabled && input.disabled) {
        return false;
      }
      var inputType = (input.type || 'text').toLowerCase();

      // ignore button values
      if (!options.includeButtonValues && (input instanceof HTMLButtonElement || FormDataJson.buttonInputTypes.indexOf(inputType) > -1)) {
        return false;
      }

      // ignore unchecked fields when no value is given
      if (typeof options.uncheckedValue === 'undefined' && FormDataJson.checkedInputTypes.indexOf(inputType) > -1 && !input.checked) {
        return false;
      }
      return true;
    }
    var tree = FormDataJson.getFieldTree(el, isValidInput);
    var returnObject = options.flatList ? [] : {};
    var files = [];

    /**
     * Recursive get values
     * @param {Object} inputs
     * @param {Object} values
     */
    function recursiveGetInputValues(inputs, values) {
      for (var key in inputs) {
        var row = inputs[key];
        var objectKey = options.flatList ? row.name : key;
        // next level
        if (row.type === 'nested') {
          if (options.flatList) {
            recursiveGetInputValues(row.tree, values);
          } else {
            values[key] = {};
            recursiveGetInputValues(row.tree, values[key]);
          }
          continue;
        }
        var input = row.input;
        var inputType = row.inputType;
        if (inputType === 'file') {
          if (options.filesCallback) {
            files.push({
              'object': values,
              'key': objectKey,
              'input': input
            });
          }
          continue;
        }
        var value = null;
        if (row.type === 'radio') {
          for (var i = 0; i < row.inputs.length; i++) {
            var radioInput = row.inputs[i];
            if (radioInput.checked) {
              value = radioInput.value;
              break;
            }
          }
          if (value === null) {
            value = options.uncheckedValue;
          }
        } else if (inputType === 'checkbox') {
          value = input.checked ? input.value : options.uncheckedValue;
        } else if (input instanceof HTMLSelectElement) {
          var arr = [];
          for (var _i = 0; _i < input.options.length; _i++) {
            var option = input.options[_i];
            if (option.selected) {
              arr.push((typeof option.value !== 'undefined' ? option.value : option.text).toString());
            }
          }
          if (input.multiple) {
            value = arr;
          } else {
            value = arr.length ? arr[0] : null;
          }
        } else {
          value = input.value;
        }
        if (options.flatList) {
          values.push([row.name, value]);
        } else {
          values[objectKey] = value;
        }
      }
    }

    /**
     * Make an object to array if possible
     * @param {Object} object
     * @return {*}
     * @private
     */
    function arrayify(object) {
      if (FormDataJson.isObject(object)) {
        var count = 0;
        var valid = true;
        for (var key in object) {
          if (FormDataJson.isObject(object[key]) && !(object[key] instanceof Element)) {
            object[key] = arrayify(object[key]);
          }
          if (parseInt(key) !== count) {
            valid = false;
          }
          count++;
        }
        if (valid) {
          var arr = [];
          for (var i in object) {
            arr.push(object[i]);
          }
          return arr;
        }
      }
      return object;
    }

    /**
     * Does some final cleanup before output data
     * @return {*}
     */
    function output() {
      if (options.arrayify) {
        returnObject = arrayify(returnObject);
      }
      if (options.skipEmpty) {
        returnObject = removeEmpty(returnObject) || (options.flatList ? [] : {});
      }
      return returnObject;
    }

    /**
     * Recursively remove empty keys
     * @param {Object} object
     * @param {number} depth
     * @return {Object|Array}
     */
    function removeEmpty(object, depth) {
      var isArray = FormDataJson.isArray(object);
      var newObject = isArray ? [] : {};
      var count = 0;
      for (var key in object) {
        var value = object[key];
        if (options.flatList && !depth) {
          value = value[1];
        }
        if (value === null || value === undefined || value === '') {
          continue;
        }
        if (FormDataJson.isObject(value) || FormDataJson.isArray(value)) {
          value = removeEmpty(value, (depth || 0) + 1) || '';
        }
        if (typeof value !== 'object' && FormDataJson.stringify(value) === '') {
          continue;
        }
        if (isArray) {
          newObject.push(options.flatList && !depth ? [object[key][0], value] : value);
        } else {
          newObject[key] = value;
        }
        count++;
      }
      return count ? newObject : null;
    }
    recursiveGetInputValues(tree, returnObject);
    if (files.length) {
      var filesDone = 0;
      var filesRequired = 0;
      var _loop = function _loop() {
        var row = files[i];
        var useObject = row.object;
        filesRequired += row.input.files.length;
        var _loop2 = function _loop2() {
          var file = row.input.files[j];
          var reader = new FileReader();
          reader.onload = function () {
            if (row.input.multiple) {
              if (!FormDataJson.isArray(useObject[row.key])) {
                useObject[row.key] = [];
              }
              useObject[row.key].push(reader.result);
            } else {
              useObject[row.key] = reader.result;
            }
            filesDone++;
            if (filesDone === filesRequired) {
              options.filesCallback(output());
            }
          };
          reader[options.fileReaderFunction](file);
        };
        for (var j = 0; j < row.input.files.length; j++) {
          _loop2();
        }
      };
      for (var i = 0; i < files.length; i++) {
        _loop();
      }
      return null;
    } else if (options.filesCallback) {
      options.filesCallback(output());
      return null;
    }
    return output();
  }

  /**
   * Fill given form values into all form elements inside given element
   * @param {*} el
   * @param {Object|Array} values
   * @param {Object=} options
   * @param {string=} keyPrefix Internal only
   */;
  FormDataJson.fromJson = function fromJson(el, values, options, keyPrefix) {
    if (!FormDataJson.isObject(values) && !FormDataJson.isArray(values)) {
      return;
    }
    options = FormDataJson.merge(FormDataJson.defaultOptionsFromJson, options);
    var tree = FormDataJson.getFieldTree(el);
    var lastUsedFlatListIndex = {};
    if (options.clearOthers) {
      FormDataJson.clear(el);
    }
    if (options.resetOthers) {
      FormDataJson.reset(el);
    }

    /**
     * Recursive set values
     * @param {*} inputs
     * @param {*} newValues
     */
    function resursiveSetInputValues(inputs, newValues) {
      if (!FormDataJson.isObject(newValues) && !FormDataJson.isArray(newValues)) {
        return;
      }
      for (var key in inputs) {
        var row = inputs[key];
        var objectKey = options.flatList ? row.name : key;
        // next level
        if (row.type === 'nested') {
          if (options.flatList) {
            resursiveSetInputValues(row.tree, newValues);
          } else if (typeof newValues[objectKey] === 'object') {
            // check for a very special case of array checkbox values using autoIncrement names and value to set is given an array
            // the array contains the values to be checked in a random order, that's because we need to check this specially
            var newSubValues = newValues[objectKey];
            var newTree = row.tree;
            if (FormDataJson.isArray(newSubValues)) {
              newTree = {};
              for (var subTreeKey in row.tree) {
                var subRow = row.tree[subTreeKey];
                if (subRow.autoIncrementInputs) {
                  if (subRow.input.type.toLowerCase() === 'checkbox' && newSubValues.indexOf(subRow.input.value) > -1) {
                    subRow.input.checked = true;
                    continue;
                  }
                }
                newTree[subTreeKey] = subRow;
              }
            }
            resursiveSetInputValues(newTree, newSubValues);
          }
          continue;
        }
        // flat list must search correct entry for given input name
        if (options.flatList) {
          for (var i in newValues) {
            var value = newValues[i];
            if (value && value[0] === row.name) {
              if (lastUsedFlatListIndex[row.name] !== i) {
                lastUsedFlatListIndex[row.name] = i;
                FormDataJson.setInputValue(row, value[1], options.triggerChangeEvent);
                break;
              }
            }
          }
          continue;
        }
        // skip fields that are not presented in the value list
        if (typeof newValues[objectKey] === 'undefined') {
          continue;
        }
        FormDataJson.setInputValue(row, newValues[objectKey] || null, options.triggerChangeEvent);
      }
    }
    resursiveSetInputValues(tree, values);
  }

  /**
   * Reset all input fields in the given element to their default values
   * @param {*} el
   */;
  FormDataJson.reset = function reset(el) {
    var tree = FormDataJson.getFieldTree(el);

    /**
     * Recursive reset
     * @param {*} inputs
     */
    function recursiveResetInputValues(inputs) {
      for (var key in inputs) {
        var row = inputs[key];
        // next level
        if (row.type === 'nested') {
          recursiveResetInputValues(row.tree);
          continue;
        }
        if (row.type === 'radio') {
          for (var i = 0; i < row.inputs.length; i++) {
            var radioInput = row.inputs[i];
            radioInput.checked = radioInput.defaultChecked;
          }
          continue;
        }

        // ignore button elements, as reset would reset button labels, which is mostly not that what anybody want
        if (row.inputType && FormDataJson.buttonInputTypes.indexOf(row.inputType) > -1) {
          continue;
        }
        var input = row.input;
        if (FormDataJson.checkedInputTypes.indexOf(row.inputType) > -1) {
          input.checked = input.defaultChecked;
        } else if (input instanceof HTMLSelectElement) {
          var options = input.querySelectorAll('option');
          for (var _i2 = 0; _i2 < options.length; _i2++) {
            var option = options[_i2];
            option.selected = option.defaultSelected;
          }
        } else if (input.getAttribute('value')) {
          input.value = input.getAttribute('value');
        } else if (typeof input.defaultValue === 'string' || typeof input.defaultValue === 'number') {
          input.value = input.defaultValue;
        }
      }
    }
    recursiveResetInputValues(tree);
  }

  /**
   * Clear all input fields (to empty, unchecked, unselected) in the given element
   * @param {*} el
   */;
  FormDataJson.clear = function clear(el) {
    var tree = FormDataJson.getFieldTree(el);

    /**
     * Recursive clear
     * @param {*} inputs
     */
    function recursiveClearInputValues(inputs) {
      for (var key in inputs) {
        var row = inputs[key];
        // next level
        if (row.type === 'nested') {
          recursiveClearInputValues(row.tree);
          continue;
        }
        if (row.input) {
          // ignore button elements, as clear would unset button labels, which is mostly not that what anybody want
          if (FormDataJson.buttonInputTypes.indexOf(row.inputType) > -1) {
            continue;
          }
        }
        FormDataJson.setInputValue(row, null);
      }
    }
    recursiveClearInputValues(tree);
  }

  /**
   * Set input value
   * @param {*} row
   * @param {*|null} newValue Null will unset the value
   * @param {boolean=} triggerChangeEvent
   * @private
   */;
  FormDataJson.setInputValue = function setInputValue(row, newValue, triggerChangeEvent) {
    var triggerChange = triggerChangeEvent ? function (el) {
      var ev = null;
      if (typeof Event === 'function') {
        ev = new Event('change', {
          'bubbles': true
        });
      } else {
        ev = document.createEvent('Event');
        ev.initEvent('change', true, true);
      }
      el.dispatchEvent(ev);
    } : null;
    if (row.type === 'radio') {
      var _changed = [];
      for (var i = 0; i < row.inputs.length; i++) {
        var radioInput = row.inputs[i];
        if (radioInput.checked) {
          _changed.push(radioInput);
        }
        radioInput.checked = false;
        if (newValue !== null && FormDataJson.stringify(radioInput.value) === FormDataJson.stringify(newValue)) {
          if (!radioInput.checked) {
            _changed.push(radioInput);
          }
          radioInput.checked = true;
          break;
        }
      }
      if (triggerChange) {
        for (var _i3 in _changed) {
          triggerChange(_changed[_i3]);
        }
      }
      return;
    }
    var input = row.input;
    var inputType = row.inputType;

    // ignore file input, they cannot be set
    if (inputType === 'file') {
      return;
    }
    var changed = false;
    if (inputType === 'checkbox') {
      newValue = newValue === true || newValue !== null && FormDataJson.stringify(input.value) === FormDataJson.stringify(newValue);
      if (newValue !== input.checked) {
        changed = true;
      }
      input.checked = newValue;
    } else if (input instanceof HTMLSelectElement) {
      var newValueArr = newValue;
      if (newValueArr === null || newValueArr === undefined) {
        newValueArr = [];
      } else if (FormDataJson.isObject(newValueArr)) {
        newValueArr = Object.values(newValueArr);
      } else if (!FormDataJson.isArray(newValueArr)) {
        newValueArr = [newValueArr];
      }
      var oldSelectedOptionIds = [];
      var newSelectedOptionIds = [];
      for (var _i4 = 0; _i4 < input.options.length; _i4++) {
        var option = input.options[_i4];
        var optionValue = (typeof option.value !== 'undefined' ? option.value : option.text).toString();
        if (option.selected !== false) {
          oldSelectedOptionIds.push(_i4);
        }
        option.selected = false;
        for (var j = 0; j < newValueArr.length; j++) {
          if (optionValue === FormDataJson.stringify(newValueArr[j])) {
            option.selected = true;
            break;
          }
        }
        if (option.selected !== false) {
          newSelectedOptionIds.push(_i4);
        }
      }
      changed = JSON.stringify(oldSelectedOptionIds) !== JSON.stringify(newSelectedOptionIds);
    } else {
      if (input.value !== newValue) {
        changed = true;
      }
      input.value = newValue;
    }
    if (changed && triggerChange) {
      triggerChange(input);
    }
  }

  /**
   * Convert any value to a string
   * A object/array/undefined will be an ampty string
   * Boolean will be 1 or 0
   * @param {*} value
   * @private
   */;
  FormDataJson.stringify = function stringify(value) {
    if (value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      return '';
    }
    if (typeof value === 'boolean') {
      return value ? '1' : '0';
    }
    return value + '';
  }

  /**
   * Get all input fields as a multidimensional tree, as it would later appear in json data, but with input elements as values
   * @param {*} el
   * @param {function=} isValidInput A function to check for valid input
   * @return {Object}
   * @private
   */;
  FormDataJson.getFieldTree = function getFieldTree(el, isValidInput) {
    el = FormDataJson.getElement(el);
    if (!el) {
      return [];
    }
    var inputs = el.querySelectorAll('select, textarea, input, button');
    var inputTree = {};
    var autoIncrementCounts = {};
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      if (!input.name || input.name.length === 0) {
        continue;
      }
      if (isValidInput && isValidInput(input) !== true) {
        continue;
      }
      var inputType = (input.type || 'text').toLowerCase();
      var name = input.name;
      var keyParts = input.name.replace(/\]/g, '').split('[');
      var isAutoIncrement = name.substr(-2) === '[]';
      if (isAutoIncrement) {
        if (input instanceof HTMLSelectElement && input.multiple) {
          // special for multiple selects, we skip the last empty part to fix double nested arrays
          keyParts.pop();
        } else if (inputType === 'radio') {
          // special for radio buttons, as they group multiple inputs to the same name
          // so a radio could never be an auto increment array name
          keyParts.pop();
        }
      }
      var keyPartsLength = keyParts.length;
      var useObject = inputTree;
      var currentName = '';
      for (var j = 0; j < keyPartsLength; j++) {
        var keyPart = keyParts[j];
        var newCurrentName = currentName ? currentName + '[' + keyPart + ']' : keyPart;
        // auto increment key part
        if (keyPart === '') {
          if (typeof autoIncrementCounts[newCurrentName] === 'undefined') {
            autoIncrementCounts[newCurrentName] = 0;
          }
          keyPart = autoIncrementCounts[newCurrentName].toString();
          autoIncrementCounts[newCurrentName]++;
        }
        currentName = currentName ? currentName + '[' + keyPart + ']' : keyPart;
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
              };
            }
            if (isAutoIncrement) {
              useObject[keyPart].autoIncrementInputs = 1;
            }
            useObject[keyPart].inputs.push(input);
          } else {
            useObject[keyPart] = {
              'type': 'default',
              'name': input.name,
              'inputType': inputType,
              'input': input,
              'autoIncrementInputs': isAutoIncrement ? 1 : 0
            };
          }
        } else {
          // it could be possible, then really weird a non-standard conform input names result in already
          // existing data which we need to override here, for which the check to .tree is for
          if (typeof useObject[keyPart] === 'undefined' || typeof useObject[keyPart].tree === 'undefined') {
            useObject[keyPart] = {
              'type': 'nested',
              'tree': {}
            };
          }
          useObject = useObject[keyPart].tree;
        }
      }
    }
    return inputTree;
  }

  /**
   * Check if arg is a real object (not null) and no array
   * @param {*} arg
   * @return {boolean}
   * @private
   */;
  FormDataJson.isObject = function isObject(arg) {
    return arg && typeof arg === 'object' && Object.prototype.toString.call(arg) !== '[object Array]';
  }

  /**
   * Check if arg is arr
   * @param {*} arg
   * @return {boolean}
   * @private
   */;
  FormDataJson.isArray = function isArray(arg) {
    return Array.isArray(arg);
  }

  /**
   * Get html element out of given parameter
   * @param {HTMLElement|JQuery|$|string} param
   * @return {HTMLElement|null}
   * @private
   */;
  FormDataJson.getElement = function getElement(param) {
    if (typeof param === 'string') {
      return document.querySelector(param);
    }
    if (param instanceof HTMLElement) {
      return param;
    }
    if (typeof jQuery !== 'undefined' && param instanceof jQuery) {
      return param[0];
    }
    if (typeof $ !== 'undefined' && param instanceof $) {
      return param[0];
    }
    console.warn('FormDataJson: Unsupported element passed. Supported is HTMLElement, a string query selector, JQuery or $ object');
    return null;
  }

  /**
   * Merge from left to right and return a new object
   * @param {Object} a
   * @param {Object} b
   * @return {Object}
   * @private
   */;
  FormDataJson.merge = function merge(a, b) {
    var c = {};
    for (var key in a) {
      c[key] = a[key];
    }
    for (var _key in b) {
      c[_key] = b[_key];
    }
    return c;
  };
  return FormDataJson;
}();
/**
 * Default options for toJson()
 * @type {{}}
 */
FormDataJson.defaultOptionsToJson = {
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
   * Include all unchecked radio/checkboxes as given value when they are unchecked
   * If undefined, than the unchecked field will be ignored in output
   * @type {*}
   */
  'uncheckedValue': undefined,
  /**
   * A function, where first parameter is the input field to check for
   * Must return true if the field should be included
   * All other return values, as well as no return value, will skip the input field in the progress
   * @type {function|null}
   */
  'inputFilter': null,
  /**
   * Does return an array list, with same values as native Array.from(new FormData(form))
   * A list will look like [["inputName", "inputValue"], ["inputName", "inputValue"]]
   * The input name will not be changed and the list can contain multiple equal names
   * @type {boolean}
   */
  'flatList': false,
  /**
   * If true, then this does skip empty fields from the output
   * Empty is considered to be:
   * An empty array (for multiple selects/checkboxes)
   * An empty input field (length = 0 or null)
   * This does recursively remove keys
   * Example: {"agb":"1", "user" : [{"name" : ""},{"name" : ""}]} will be {"agb":"1"}
   * @type {boolean}
   */
  'skipEmpty': false,
  /**
   * A function that will be called when all file fields are read as base64 data uri
   * First passed parameter to this function are the form values including all file data
   * Note: If set, the original return value from toJson() returns null
   * @type {function|null}
   */
  'filesCallback': null,
  /**
   * By default, files are read as base64 data url
   * Possible values are: readAsDataURL, readAsBinaryString, readAsText, readAsArrayBuffer
   * @type {string}
   */
  'fileReaderFunction': 'readAsDataURL',
  /**
   * If true than values try to be a real Array instead of Object where possible
   * If false than all values that are multiple (multiple select, same input names checkboxes, unnamed array indexes, etc...) will be objects
   * @type {boolean}
   */
  'arrayify': true
};
/**
 * Default options for fromJson()
 * @type {{}}
 */
FormDataJson.defaultOptionsFromJson = {
  /**
   * Does expect the given values are in a flatList, previously exported with toJson
   * Instead of the default bevhiour with nested objects
   * @type {boolean}
   */
  'flatList': false,
  /**
   * If true, than all fields that are not exist in the passed values object, will be cleared/emptied
   * Not exist means, the value must be undefined
   * @type {boolean}
   */
  'clearOthers': false,
  /**
   * If true, than all fields that are not exist in the passed values object, will be reset
   * Not exist means, the value must be undefined
   * @type {boolean}
   */
  'resetOthers': false,
  /**
   * If true, when a fields value has changed, a "change" event will be fired
   * @type {boolean}
   */
  'triggerChangeEvent': false
};
/**
 * All input types that are buttons
 * @type {string[]}
 */
FormDataJson.buttonInputTypes = ['button', 'submit', 'reset', 'image'];
/**
 * All input types that have a checked status
 * @type {string[]}
 */
FormDataJson.checkedInputTypes = ['checkbox', 'radio'];

// module exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormDataJson
}