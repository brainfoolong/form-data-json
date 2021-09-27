'use strict';
// form-data-json-convert | version: 2.0.2beta | url: https://github.com/brainfoolong/form-data-json

/**
 * Form Data Json Converter
 * @link https://github.com/brainfoolong/form-data-json
 * @licence MIT
 */

var FormDataJson = /*#__PURE__*/function () {
  function FormDataJson() {}

  /**
   * Default options for toJson()
   * @type {{}}
   */

  /**
   * Default options for fromJson()
   * @type {{}}
   */

  /**
   * All input types that are buttons
   * @type {string[]}
   */

  /**
   * All input types that have a checked status
   * @type {string[]}
   */

  /**
   * Get values from all form elements inside the given element
   * @param {*} el
   * @param {Object=} options
   * @return {Object}
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
      } // ignore disabled fields


      if (!options.includeDisabled && input.disabled) {
        return false;
      }

      var inputType = (input.type || 'text').toLowerCase(); // ignore button values

      if (!options.includeButtonValues && (input instanceof HTMLButtonElement || FormDataJson.buttonInputTypes.indexOf(inputType) > -1)) {
        return false;
      } // ignore unchecked fields when no value is given


      if (typeof options.uncheckedValue === 'undefined' && FormDataJson.checkedInputTypes.indexOf(inputType) > -1 && !input.checked) {
        return false;
      }

      return true;
    }

    var tree = FormDataJson.getFieldTree(el, isValidInput);
    var returnObject = {};
    var files = [];
    /**
     * Recursive get values
     * @param {Object} inputs
     * @param {Object} values
     */

    function recursion(inputs, values) {
      for (var key in inputs) {
        var row = inputs[key];
        var objectKey = options.flatList ? row.name : key; // next level

        if (row.type === 'nested') {
          if (options.flatList) {
            recursion(row.tree, values);
          } else {
            values[key] = {};
            recursion(row.tree, values[key]);
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

          if (options.skipEmpty && FormDataJson.stringify(value) === '') {
            continue;
          }
        }

        values[objectKey] = value;
      }
    }

    recursion(tree, returnObject);

    if (files.length) {
      (function () {
        var filesDone = 0;
        var filesRequired = 0;

        var _loop = function _loop(i) {
          var row = files[i];
          var useObject = row.object;
          filesRequired += row.input.files.length;

          var _loop2 = function _loop2(j) {
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
                options.filesCallback(FormDataJson.arrayfy(returnObject));
              }
            };

            reader[options.fileReaderFunction](file);
          };

          for (var j = 0; j < row.input.files.length; j++) {
            _loop2(j);
          }
        };

        for (var i = 0; i < files.length; i++) {
          _loop(i);
        }
      })();
    } else if (options.filesCallback) {
      options.filesCallback(FormDataJson.arrayfy(returnObject));
    }

    return FormDataJson.arrayfy(returnObject);
  }
  /**
   * Fill given form values into all form elements inside given element
   * @param {*} el
   * @param {Object} values
   * @param {Object=} options
   * @param {string=} keyPrefix Internal only
   */
  ;

  FormDataJson.fromJson = function fromJson(el, values, options, keyPrefix) {
    if (!FormDataJson.isObject(values)) return;
    options = FormDataJson.merge(FormDataJson.defaultOptionsFromJson, options);
    var tree = FormDataJson.getFieldTree(el);

    if (options.clearOthers) {
      FormDataJson.clear(el);
    }
    /**
     * Recursive set values
     * @param {*} inputs
     * @param {*} newValues
     */


    function recursion(inputs, newValues) {
      for (var key in inputs) {
        var row = inputs[key];
        var objectKey = options.flatList ? row.name : key; // next level

        if (row.type === 'nested') {
          if (options.flatList) {
            recursion(row.tree, newValues);
          } else if (typeof newValues[objectKey] === 'object') {
            recursion(row.tree, newValues[objectKey]);
          }

          continue;
        } // skip fields that are not presented in the


        if (!options.clearOthers && typeof newValues[objectKey] === 'undefined') {
          continue;
        }

        FormDataJson.setInputValue(row, newValues[objectKey] || null, options.triggerChangeEvent);
      }
    }

    recursion(tree, values);
  }
  /**
   * Reset all input fields in the given element to their default values
   * @param {*} el
   */
  ;

  FormDataJson.reset = function reset(el) {
    var tree = FormDataJson.getFieldTree(el);
    /**
     * Recursive reset
     * @param {*} inputs
     */

    function recursion(inputs) {
      for (var key in inputs) {
        var row = inputs[key]; // next level

        if (row.type === 'nested') {
          recursion(row.tree);
          continue;
        }

        if (row.type === 'radio') {
          for (var i = 0; i < row.inputs.length; i++) {
            var radioInput = row.inputs[i];
            radioInput.checked = radioInput.defaultChecked;
          }

          continue;
        } // ignore button elements, as reset would reset button labels, which is mostly not that what anybody want


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

    recursion(tree);
  }
  /**
   * Clear all input fields (to empty, unchecked, unselected) in the given element
   * @param {*} el
   */
  ;

  FormDataJson.clear = function clear(el) {
    var tree = FormDataJson.getFieldTree(el);
    /**
     * Recursive clear
     * @param {*} inputs
     */

    function recursion(inputs) {
      for (var key in inputs) {
        var row = inputs[key]; // next level

        if (row.type === 'nested') {
          recursion(row.tree);
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

    recursion(tree);
  }
  /**
   * Make an object to array if possible
   * @param {Object} object
   * @return {*}
   * @private
   */
  ;

  FormDataJson.arrayfy = function arrayfy(object) {
    if (FormDataJson.isObject(object)) {
      var count = 0;
      var valid = true;

      for (var key in object) {
        if (FormDataJson.isObject(object[key]) && !(object[key] instanceof Element)) {
          object[key] = FormDataJson.arrayfy(object[key]);
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
   * Set input value
   * @param {*} row
   * @param {*|null} newValue Null will unset the value
   * @param {boolean=} triggerChangeEvent
   * @private
   */
  ;

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
        if (radioInput.checked) _changed.push(radioInput);
        radioInput.checked = false;

        if (newValue !== null && FormDataJson.stringify(radioInput.value) === FormDataJson.stringify(newValue)) {
          if (!radioInput.checked) _changed.push(radioInput);
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
    var inputType = row.inputType; // ignore file input, they cannot be set

    if (inputType === 'file') {
      return;
    }

    var changed = false;

    if (inputType === 'checkbox') {
      newValue = newValue === true || newValue !== null && FormDataJson.stringify(input.value) === FormDataJson.stringify(newValue);
      if (newValue !== input.checked) changed = true;
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

      for (var _i4 = 0; _i4 < input.options.length; _i4++) {
        var option = input.options[_i4];
        var optionValue = (typeof option.value !== 'undefined' ? option.value : option.text).toString();
        if (option.selected !== false) changed = true;
        option.selected = false;

        for (var j = 0; j < newValueArr.length; j++) {
          if (optionValue === FormDataJson.stringify(newValueArr[j])) {
            if (option.selected !== true) changed = true;
            option.selected = true;
            break;
          }
        }
      }
    } else {
      if (input.value !== newValue) changed = true;
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
   */
  ;

  FormDataJson.stringify = function stringify(value) {
    if (value === undefined) return '';
    if (typeof value === 'object') return '';
    if (typeof value === 'boolean') return value ? '1' : '0';
    return value + '';
  }
  /**
   * Get all input fields as a multidimensional tree, as it would later appear in json data, but with input elements as values
   * @param {*} el
   * @param {function=} isValidInput A function to check for valid input
   * @return {Object}
   * @private
   */
  ;

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
      if (!input.name || input.name.length === 0) continue;
      if (isValidInput && isValidInput(input) !== true) continue;
      var inputType = (input.type || 'text').toLowerCase();
      var name = input.name;
      var keyParts = input.name.replace(/\]/g, '').split('[');

      if (name.substr(-2) === '[]') {
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
        currentName = currentName ? currentName + '[' + keyPart + ']' : keyPart; // auto increment key part

        if (keyPart === '') {
          if (typeof autoIncrementCounts[currentName] === 'undefined') {
            autoIncrementCounts[currentName] = 0;
          }

          keyPart = autoIncrementCounts[currentName].toString();
          autoIncrementCounts[currentName]++;
        } // last level


        if (keyPartsLength - 1 === j) {
          // radio elements are special
          if ((input.type || 'text').toLowerCase() === 'radio') {
            if (typeof useObject[keyPart] === 'undefined') {
              useObject[keyPart] = {
                'type': 'radio',
                'name': input.name,
                'inputType': inputType,
                'inputs': []
              };
            }

            useObject[keyPart].inputs.push(input);
          } else {
            useObject[keyPart] = {
              'type': 'default',
              'name': input.name,
              'inputType': inputType,
              'input': input
            };
          }
        } else {
          // it could be possible, than really weird a non standard conform input names result in already
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
   */
  ;

  FormDataJson.isObject = function isObject(arg) {
    return arg && typeof arg === 'object' && Object.prototype.toString.call(arg) !== '[object Array]';
  }
  /**
   * Check if arg is arr
   * @param {*} arg
   * @return {boolean}
   * @private
   */
  ;

  FormDataJson.isArray = function isArray(arg) {
    return typeof arg === 'object' && Object.prototype.toString.call(arg) === '[object Array]';
  }
  /**
   * Get html element out of given parameter
   * @param {HTMLElement|JQuery|string} param
   * @return {HTMLElement|null}
   * @private
   */
  ;

  FormDataJson.getElement = function getElement(param) {
    if (typeof param === 'string') return document.querySelector(param);
    if (param instanceof HTMLElement) return param;
    if (typeof jQuery !== 'undefined' && param instanceof jQuery) return param[0];
    console.warn('FormDataJson: Unsupported element passed. Supported is HTMLElement, a string query selector or JQuery object');
    return null;
  }
  /**
   * Merge from left to right and return a new object
   * @param {Object} a
   * @param {Object} b
   * @return {Object}
   * @private
   */
  ;

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
}(); // module exports


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
   * A function, where first parameter is the input field to check for, that must return true if the field should be included
   * All other return values, as well as no return value, will skip the input field in the progress
   * @type {function|null}
   */
  'inputFilter': null,

  /**
   * Does return a flat key/value list of values instead of multiple dimensions
   * This will use the original input names as key, doesn't matter how weird they are
   * Exepected keys are similar to FormData() keys
   * @type {boolean}
   */
  'flatList': false,

  /**
   * If true, than this does skip empty fields from the output
   * @type {boolean}
   */
  'skipEmpty': false,

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
};
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
   * If true, when a fields value has changed, a "change" event will be fired
   * @type {boolean}
   */
  'triggerChangeEvent': false
};
FormDataJson.buttonInputTypes = ['button', 'submit', 'reset', 'image'];
FormDataJson.checkedInputTypes = ['checkbox', 'radio'];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormDataJson;
}