"use strict";

/**
 * The helpers used while making Definitions.
 * They are mostly used to simplify code of Definitions and accelerate development.
 * Whether these helpers make code easier to read depends on whether the reader
 * has a good understanding of the helper methods. In most cases, is the documentation
 * of the helper methods are carefully read, the reader should be able to understand
 * Definitions without great difficulties, and, considering the reduced code length
 * and the improved coercion, readability should be better. However, exceptions might
 * exist.
 * Meanwhile, both the helpers and the Definition code are considered internal, that
 * is, one should rely on the project Wiki for reference and documentation instead of
 * in-code comments without good reasons.
 * For documentation about the concepts Definition, compile, Input, see compile.js.
 */
var _require = require('lodash'),
    isEmpty = _require.isEmpty,
    negate = _require.negate,
    isString = _require.isString,
    isFunction = _require.isFunction,
    isArray = _require.isArray,
    isObject = _require.isObject,
    fromPairs = _require.fromPairs,
    camelCase = _require.camelCase;

var compile = require('./compile');
/**
 * Boolify input.
 * As defined in the test, asFlag() should:
 * - return true for true.
 * - return false for false.
 * - return true for 1.
 * - return true for 0.
 * Otherwise, behavior is undefined and not tested.
 *
 * @param {any} input The input to boolify.
 * @returns {boolean} The boolified result.
 */


var asFlag = function asFlag(input) {
  return !!input;
};
/**
 * Return an Definition that executes the specified Definition on the Input mapped with mapper.
 *
 * @param {Function} mapper The function used to map Input.
 * @param {any} def The Definition.
 * @returns {Function} The returned Definition.
 */


var on = function on(mapper, def) {
  var compiled = compile(def);
  return function (input) {
    return compiled(mapper(input));
  };
};
/**
 * Return an Definition that:
 * - if predicate(mapper(input)) returns true, execute def1 on the Input mapped with mapper.
 * - otherwise, execute def2 on the input mapper with mapper.
 *
 * @param {Function} mapper The function used to map input.
 * @param {Function} predicate The functino used to decide whether the Definition should be
 *   executed or not.
 * @param {any} def1 The Definition used when predicate(mapper(input)) is true.
 * @param {any} def2 The Definitino used when predicate(mapper(input)) is false. Default to
 *   null.
 * @returns {Function} The returned Definition.
 */


var onWhen = function onWhen(mapper, predicate, def1, def2) {
  if (def2 === void 0) {
    def2 = null;
  }

  var compiled1 = compile(def1);
  var compiled2 = compile(def2);
  return on(mapper, function (input) {
    return predicate(input) ? compiled1(input) : compiled2(null);
  });
};
/**
 * Return onWhen(mapper, _.negate(_.isEmpty), def).
 * See documentation of lodash for details.
 *
 * The typical usage of onExist is:
 * onExist(a => a.data, { foo: d => d.foo });
 * Which ensures that, if a.data is undefined or {}, d => d.foo will not even be executed
 * and no Error is thrown.
 * However _.isEmpty() is just a very simple check, so use this method only when applicable.
 *
 * @param {Function} mapper The function used to map input.e
 * @param {any} def1 The Definition used when predicate(mapper(input)) is true.
 * @param {any} def2 The Definitino used when predicate(mapper(input)) is false. Default to
 *   null.
 * @returns The returned Definition.
 */


var onExist = function onExist(mapper, def1, def2) {
  return onWhen(mapper, negate(isEmpty), def1, def2);
};
/**
 * Turn input into a function that maps input value to desired value.
 * Used only in coonvertNames().
 * As defined in the test, toMapVal() should:
 * - return unchanged for a function.
 * - return v => v otherwise.
 *
 * @param {any} input The input to turn into a function.
 * @returns {Function} The returned function.
 */


var toMapVal = function toMapVal(input) {
  if (isFunction(input)) return input;
  return function (v) {
    return v;
  };
};
/**
 * Turn input into a function that maps key to desired key.
 * Used only in convertNames().
 * As defined in the test. toMapKey() should:
 * - return unchanged for a function.
 * - return () => src for a string str.
 * - return _.camelCase otherwise.
 * _.camelCase is used only for the convenience of Definitions in definitions.js,
 * and is due to change as the Definitions evolves.
 *
 * @param {any} input The input to turn into a function.
 * @returns {Function} The returned function.
 */


var toMapKey = function toMapKey(input) {
  if (isFunction(input)) return input;
  if (isString(input)) return function () {
    return input;
  };
  return camelCase;
};
/**
 * Turn array of input into an { name: string, mapVal: Function, mapKey: Function }.
 * This method is implements the common logics in spread() and spreadObj().
 * The behavior of this method is the convenience of Definitions in definitions.js,
 * and is due to change as the Definitions evolves.
 * In short, it supports a convenient way to extract data from Input arrays or objects,
 * probably changing the value and the key with a mapper function, and using the
 * mapped key and value to create a Property Definition.
 * In the meanwhile, convertNames() provides default values to enable creating Property
 * Definitions simply and shortly.
 * Its detailed behavior is, map each name of names with:
 * - If name is a string, map [name, undefined, undefined] instead.
 * - If name is an Array, return { name: name[0], mapVal: toMapVal(name[1]), mapKey: name[2] }.
 * - Otherwise, return null.
 * The return value is an array, each element being either:
 * - An object with { name: string, mapVal: Function, mapKey: Function }.
 * - Or null.
 * Each element of the return value corresponds to the element in names of the same index,
 * which enables the funcionality of spread().
 *
 * @param {(string | Array | *)[]} names The names to convert.
 * @returns {(Object | null)[]} The converted names.
 * @see #toMapKey
 * @see #toMapVal
 * @see #spread
 * @see #spreadObj
 */


var convertNames = function convertNames() {
  for (var _len = arguments.length, names = new Array(_len), _key = 0; _key < _len; _key++) {
    names[_key] = arguments[_key];
  }

  return names.map(function (name) {
    return isString(name) ? [name] : name;
  }).map(compile(onWhen(function (a) {
    return a;
  }, isArray, {
    name: function name(a) {
      return a[0];
    },
    mapVal: function mapVal(a) {
      return toMapVal(a[1]);
    },
    mapKey: function mapKey(a) {
      return toMapKey(a[2]);
    }
  })));
};
/**
 * Return a Definition which spread the given names.
 * The behavior of this method is the convenience of Definitions in definitions.js,
 * and is due to change as the Definitions evolves.
 * The name spread comes from the spread syntax of ECMAScript, since this method
 * vaguely expresses the same idea.
 * This method spreads the given names into an object to create an Definition.
 * Typically, it is used as follows:
 * const def = spread('foo', ['bar', parseInt], 0, ['baz', 0, 'fooBar'], ['bad_case', 0]);
 * And using def to parse:
 * ['1', '2', '3', '4', '5']
 * you will get:
 * { foo: '1', bar: 2, fooBar: '4', badCase: '5' }
 * Explanations.
 * The arguments are used like mappers. When the returned Definition gets an array input,
 * it maps the elements and return an object.
 * As you can see, giving a simple 'foo' sets the 'foo' property with the value of input[0],
 * Giving ['bar', parseInt] sets the 'bar' property with parseInt(input[1]).
 * Giving 0 ignores the input element, that is, input[2]. (0 is used only because it is short)
 * Giving ['baz', 0, 'fooBar'] sets the 'fooBar' property with input[3], where 0 specifies
 * input[3] is not mapped and returned directly, 'fooBar' is the final property name, and
 * 'foo' is ignored. (But this will be different in spreadObj()).
 * Giving ['bad_case', 0] sets the 'badCase' property with input[4], where 0 specifies
 * that input[4] is not mapped, 'bad_case' is used to produce the property name 'badCase'
 * (by converting it into camelCase when no convert function is specified, see toMapKey()).
 * When using spread(), the last 2 syntaxes are rarely used, but they do have their reason
 * of existence in spreadObj().
 * In short, it uses convertNames(), ignores null return elements, and returns a Definiton
 * that maps every input element into a property of the returned object.
 *
 * @param {any[]} names The names to spread.
 * @returns {Function} The returned Definition.
 * @see #convertNames
 * @see #spreadObj
 */


var spread = function spread() {
  return fromPairs(convertNames.apply(void 0, arguments).map(function (converted, index) {
    if (!isObject(converted)) return undefined;
    var name = converted.name,
        mapVal = converted.mapVal,
        mapKey = converted.mapKey;
    return [mapKey(name), function (a) {
      return mapVal(a[index]);
    }];
  }).filter(isArray));
};
/**
 * Return a Definition which spread the given names.
 * The behavior of this method is the convenience of Definitions in definitions.js,
 * and is due to change as the Definitions evolves.
 * The name spread comes from the object spread syntax of ECMAScript, since this method
 * vaguely expresses the same idea.
 * This method spreads the given names into an object to create an Definition.
 * Typically, it is used as follows:
 * const def = spreadObj('foo', ['bar', parseInt], 0, ['baz', 0, 'fooBar'], ['bad_case', 0]);
 * And using def to parse:
 * { foo: '1', bar: '2', baa: '3', baz: '4', bad_case: '5' }
 * you will get:
 * { foo: '1', bar: 2, fooBar: '4', badCase: '5' }
 * Explanations.
 * The arguments are used like mappers. When the returned Definition gets an object input,
 * it maps the properties and return another object.
 * As you can see, giving a simple 'foo' sets the 'foo' property with the value of input.foo,
 * Giving ['bar', parseInt] sets the 'bar' property with parseInt(input.bar).
 * Giving 0 will be meaningless, this syntax is only available in spread().
 * Giving ['baz', 0, 'fooBar'] sets the 'fooBar' property with input.baz, where 0 specifies
 * input.baz is not mapped and returned directly. (0 is used only because it is short, any
 * non-string and non-Array value will have the same effect) 'fooBar' is the final property
 * name, and 'baz' is the property name in input.
 * Giving ['bad_case', 0] sets the 'badCase' property with input.bad_case, where 0 specifies
 * that input.foo_bar is not mapped, 'bad_case' the property name in input and 'badCase' is
 * the camelCase of 'bad_case'. (This is the default behavior since the key mapper is not
 * specified. See toMapKey() for details).
 * When using spread(), the third syntax is rarely used, but it is useful in spreadObj().
 * In short, it uses convertNames(), and returns a Definiton that maps every input property
 * into a property of the returned object.
 *
 * @param {any[]} names The names to spread.
 * @returns {Function} The returned Definition.
 * @see #convertNames
 * @see #spread
 */


var spreadObj = function spreadObj() {
  return fromPairs(convertNames.apply(void 0, arguments).filter(isObject).map(function (_ref) {
    var name = _ref.name,
        mapVal = _ref.mapVal,
        mapKey = _ref.mapKey;
    return [mapKey(name), function (o) {
      return mapVal(o[name]);
    }];
  }));
};

module.exports = {
  asFlag,
  onWhen,
  on,
  onExist,
  toMapVal,
  toMapKey,
  convertNames,
  spread,
  spreadObj
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL2hlbHBlcnMuanMiXSwibmFtZXMiOlsicmVxdWlyZSIsImlzRW1wdHkiLCJuZWdhdGUiLCJpc1N0cmluZyIsImlzRnVuY3Rpb24iLCJpc0FycmF5IiwiaXNPYmplY3QiLCJmcm9tUGFpcnMiLCJjYW1lbENhc2UiLCJjb21waWxlIiwiYXNGbGFnIiwiaW5wdXQiLCJvbiIsIm1hcHBlciIsImRlZiIsImNvbXBpbGVkIiwib25XaGVuIiwicHJlZGljYXRlIiwiZGVmMSIsImRlZjIiLCJjb21waWxlZDEiLCJjb21waWxlZDIiLCJvbkV4aXN0IiwidG9NYXBWYWwiLCJ2IiwidG9NYXBLZXkiLCJjb252ZXJ0TmFtZXMiLCJuYW1lcyIsIm1hcCIsIm5hbWUiLCJhIiwibWFwVmFsIiwibWFwS2V5Iiwic3ByZWFkIiwiY29udmVydGVkIiwiaW5kZXgiLCJ1bmRlZmluZWQiLCJmaWx0ZXIiLCJzcHJlYWRPYmoiLCJvIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7Ozs7Ozs7Ozs7ZUF3QklBLE9BQU8sQ0FBQyxRQUFELEM7SUFSUEMsTyxZQUFBQSxPO0lBQ0FDLE0sWUFBQUEsTTtJQUNBQyxRLFlBQUFBLFE7SUFDQUMsVSxZQUFBQSxVO0lBQ0FDLE8sWUFBQUEsTztJQUNBQyxRLFlBQUFBLFE7SUFDQUMsUyxZQUFBQSxTO0lBQ0FDLFMsWUFBQUEsUzs7QUFHSixJQUFNQyxPQUFPLEdBQUdULE9BQU8sQ0FBQyxXQUFELENBQXZCO0FBRUE7Ozs7Ozs7Ozs7Ozs7O0FBWUEsSUFBTVUsTUFBTSxHQUFHLFNBQVRBLE1BQVMsQ0FBQUMsS0FBSztBQUFBLFNBQUksQ0FBQyxDQUFDQSxLQUFOO0FBQUEsQ0FBcEI7QUFFQTs7Ozs7Ozs7O0FBT0EsSUFBTUMsRUFBRSxHQUFHLFNBQUxBLEVBQUssQ0FBQ0MsTUFBRCxFQUFTQyxHQUFULEVBQWlCO0FBQ3hCLE1BQU1DLFFBQVEsR0FBR04sT0FBTyxDQUFDSyxHQUFELENBQXhC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QSxRQU5hO0FBT2JDLEVBQUFBLFlBUGE7QUFRYk8sRUFBQUEsTUFSYTtBQVNiSyxFQUFBQTtBQVRhLENBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIFRoZSBoZWxwZXJzIHVzZWQgd2hpbGUgbWFraW5nIERlZmluaXRpb25zLlxyXG4gKiBUaGV5IGFyZSBtb3N0bHkgdXNlZCB0byBzaW1wbGlmeSBjb2RlIG9mIERlZmluaXRpb25zIGFuZCBhY2NlbGVyYXRlIGRldmVsb3BtZW50LlxyXG4gKiBXaGV0aGVyIHRoZXNlIGhlbHBlcnMgbWFrZSBjb2RlIGVhc2llciB0byByZWFkIGRlcGVuZHMgb24gd2hldGhlciB0aGUgcmVhZGVyXHJcbiAqIGhhcyBhIGdvb2QgdW5kZXJzdGFuZGluZyBvZiB0aGUgaGVscGVyIG1ldGhvZHMuIEluIG1vc3QgY2FzZXMsIGlzIHRoZSBkb2N1bWVudGF0aW9uXHJcbiAqIG9mIHRoZSBoZWxwZXIgbWV0aG9kcyBhcmUgY2FyZWZ1bGx5IHJlYWQsIHRoZSByZWFkZXIgc2hvdWxkIGJlIGFibGUgdG8gdW5kZXJzdGFuZFxyXG4gKiBEZWZpbml0aW9ucyB3aXRob3V0IGdyZWF0IGRpZmZpY3VsdGllcywgYW5kLCBjb25zaWRlcmluZyB0aGUgcmVkdWNlZCBjb2RlIGxlbmd0aFxyXG4gKiBhbmQgdGhlIGltcHJvdmVkIGNvZXJjaW9uLCByZWFkYWJpbGl0eSBzaG91bGQgYmUgYmV0dGVyLiBIb3dldmVyLCBleGNlcHRpb25zIG1pZ2h0XHJcbiAqIGV4aXN0LlxyXG4gKiBNZWFud2hpbGUsIGJvdGggdGhlIGhlbHBlcnMgYW5kIHRoZSBEZWZpbml0aW9uIGNvZGUgYXJlIGNvbnNpZGVyZWQgaW50ZXJuYWwsIHRoYXRcclxuICogaXMsIG9uZSBzaG91bGQgcmVseSBvbiB0aGUgcHJvamVjdCBXaWtpIGZvciByZWZlcmVuY2UgYW5kIGRvY3VtZW50YXRpb24gaW5zdGVhZCBvZlxyXG4gKiBpbi1jb2RlIGNvbW1lbnRzIHdpdGhvdXQgZ29vZCByZWFzb25zLlxyXG4gKiBGb3IgZG9jdW1lbnRhdGlvbiBhYm91dCB0aGUgY29uY2VwdHMgRGVmaW5pdGlvbiwgY29tcGlsZSwgSW5wdXQsIHNlZSBjb21waWxlLmpzLlxyXG4gKi9cclxuXHJcbmNvbnN0IHtcclxuICAgIGlzRW1wdHksXHJcbiAgICBuZWdhdGUsXHJcbiAgICBpc1N0cmluZyxcclxuICAgIGlzRnVuY3Rpb24sXHJcbiAgICBpc0FycmF5LFxyXG4gICAgaXNPYmplY3QsXHJcbiAgICBmcm9tUGFpcnMsXHJcbiAgICBjYW1lbENhc2UsXHJcbn0gPSByZXF1aXJlKCdsb2Rhc2gnKTtcclxuXHJcbmNvbnN0IGNvbXBpbGUgPSByZXF1aXJlKCcuL2NvbXBpbGUnKTtcclxuXHJcbi8qKlxyXG4gKiBCb29saWZ5IGlucHV0LlxyXG4gKiBBcyBkZWZpbmVkIGluIHRoZSB0ZXN0LCBhc0ZsYWcoKSBzaG91bGQ6XHJcbiAqIC0gcmV0dXJuIHRydWUgZm9yIHRydWUuXHJcbiAqIC0gcmV0dXJuIGZhbHNlIGZvciBmYWxzZS5cclxuICogLSByZXR1cm4gdHJ1ZSBmb3IgMS5cclxuICogLSByZXR1cm4gdHJ1ZSBmb3IgMC5cclxuICogT3RoZXJ3aXNlLCBiZWhhdmlvciBpcyB1bmRlZmluZWQgYW5kIG5vdCB0ZXN0ZWQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7YW55fSBpbnB1dCBUaGUgaW5wdXQgdG8gYm9vbGlmeS5cclxuICogQHJldHVybnMge2Jvb2xlYW59IFRoZSBib29saWZpZWQgcmVzdWx0LlxyXG4gKi9cclxuY29uc3QgYXNGbGFnID0gaW5wdXQgPT4gISFpbnB1dDtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm4gYW4gRGVmaW5pdGlvbiB0aGF0IGV4ZWN1dGVzIHRoZSBzcGVjaWZpZWQgRGVmaW5pdGlvbiBvbiB0aGUgSW5wdXQgbWFwcGVkIHdpdGggbWFwcGVyLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBtYXBwZXIgVGhlIGZ1bmN0aW9uIHVzZWQgdG8gbWFwIElucHV0LlxyXG4gKiBAcGFyYW0ge2FueX0gZGVmIFRoZSBEZWZpbml0aW9uLlxyXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFRoZSByZXR1cm5lZCBEZWZpbml0aW9uLlxyXG4gKi9cclxuY29uc3Qgb24gPSAobWFwcGVyLCBkZWYpID0+IHtcclxuICAgIGNvbnN0IGNvbXBpbGVkID0gY29tcGlsZShkZWYpO1xyXG4gICAgcmV0dXJuIGlucHV0ID0+IGNvbXBpbGVkKG1hcHBlcihpbnB1dCkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJldHVybiBhbiBEZWZpbml0aW9uIHRoYXQ6XHJcbiAqIC0gaWYgcHJlZGljYXRlKG1hcHBlcihpbnB1dCkpIHJldHVybnMgdHJ1ZSwgZXhlY3V0ZSBkZWYxIG9uIHRoZSBJbnB1dCBtYXBwZWQgd2l0aCBtYXBwZXIuXHJcbiAqIC0gb3RoZXJ3aXNlLCBleGVjdXRlIGRlZjIgb24gdGhlIGlucHV0IG1hcHBlciB3aXRoIG1hcHBlci5cclxuICpcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gbWFwcGVyIFRoZSBmdW5jdGlvbiB1c2VkIHRvIG1hcCBpbnB1dC5cclxuICogQHBhcmFtIHtGdW5jdGlvbn0gcHJlZGljYXRlIFRoZSBmdW5jdGlubyB1c2VkIHRvIGRlY2lkZSB3aGV0aGVyIHRoZSBEZWZpbml0aW9uIHNob3VsZCBiZVxyXG4gKiAgIGV4ZWN1dGVkIG9yIG5vdC5cclxuICogQHBhcmFtIHthbnl9IGRlZjEgVGhlIERlZmluaXRpb24gdXNlZCB3aGVuIHByZWRpY2F0ZShtYXBwZXIoaW5wdXQpKSBpcyB0cnVlLlxyXG4gKiBAcGFyYW0ge2FueX0gZGVmMiBUaGUgRGVmaW5pdGlubyB1c2VkIHdoZW4gcHJlZGljYXRlKG1hcHBlcihpbnB1dCkpIGlzIGZhbHNlLiBEZWZhdWx0IHRvXHJcbiAqICAgbnVsbC5cclxuICogQHJldHVybnMge0Z1bmN0aW9ufSBUaGUgcmV0dXJuZWQgRGVmaW5pdGlvbi5cclxuICovXHJcbmNvbnN0IG9uV2hlbiA9IChtYXBwZXIsIHByZWRpY2F0ZSwgZGVmMSwgZGVmMiA9IG51bGwpID0+IHtcclxuICAgIGNvbnN0IGNvbXBpbGVkMSA9IGNvbXBpbGUoZGVmMSk7XHJcbiAgICBjb25zdCBjb21waWxlZDIgPSBjb21waWxlKGRlZjIpO1xyXG4gICAgcmV0dXJuIG9uKG1hcHBlciwgaW5wdXQgPT4gKHByZWRpY2F0ZShpbnB1dCkgPyBjb21waWxlZDEoaW5wdXQpIDogY29tcGlsZWQyKG51bGwpKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmV0dXJuIG9uV2hlbihtYXBwZXIsIF8ubmVnYXRlKF8uaXNFbXB0eSksIGRlZikuXHJcbiAqIFNlZSBkb2N1bWVudGF0aW9uIG9mIGxvZGFzaCBmb3IgZGV0YWlscy5cclxuICpcclxuICogVGhlIHR5cGljYWwgdXNhZ2Ugb2Ygb25FeGlzdCBpczpcclxuICogb25FeGlzdChhID0+IGEuZGF0YSwgeyBmb286IGQgPT4gZC5mb28gfSk7XHJcbiAqIFdoaWNoIGVuc3VyZXMgdGhhdCwgaWYgYS5kYXRhIGlzIHVuZGVmaW5lZCBvciB7fSwgZCA9PiBkLmZvbyB3aWxsIG5vdCBldmVuIGJlIGV4ZWN1dGVkXHJcbiAqIGFuZCBubyBFcnJvciBpcyB0aHJvd24uXHJcbiAqIEhvd2V2ZXIgXy5pc0VtcHR5KCkgaXMganVzdCBhIHZlcnkgc2ltcGxlIGNoZWNrLCBzbyB1c2UgdGhpcyBtZXRob2Qgb25seSB3aGVuIGFwcGxpY2FibGUuXHJcbiAqXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG1hcHBlciBUaGUgZnVuY3Rpb24gdXNlZCB0byBtYXAgaW5wdXQuZVxyXG4gKiBAcGFyYW0ge2FueX0gZGVmMSBUaGUgRGVmaW5pdGlvbiB1c2VkIHdoZW4gcHJlZGljYXRlKG1hcHBlcihpbnB1dCkpIGlzIHRydWUuXHJcbiAqIEBwYXJhbSB7YW55fSBkZWYyIFRoZSBEZWZpbml0aW5vIHVzZWQgd2hlbiBwcmVkaWNhdGUobWFwcGVyKGlucHV0KSkgaXMgZmFsc2UuIERlZmF1bHQgdG9cclxuICogICBudWxsLlxyXG4gKiBAcmV0dXJucyBUaGUgcmV0dXJuZWQgRGVmaW5pdGlvbi5cclxuICovXHJcbmNvbnN0IG9uRXhpc3QgPSAobWFwcGVyLCBkZWYxLCBkZWYyKSA9PiBvbldoZW4obWFwcGVyLCBuZWdhdGUoaXNFbXB0eSksIGRlZjEsIGRlZjIpO1xyXG5cclxuLyoqXHJcbiAqIFR1cm4gaW5wdXQgaW50byBhIGZ1bmN0aW9uIHRoYXQgbWFwcyBpbnB1dCB2YWx1ZSB0byBkZXNpcmVkIHZhbHVlLlxyXG4gKiBVc2VkIG9ubHkgaW4gY29vbnZlcnROYW1lcygpLlxyXG4gKiBBcyBkZWZpbmVkIGluIHRoZSB0ZXN0LCB0b01hcFZhbCgpIHNob3VsZDpcclxuICogLSByZXR1cm4gdW5jaGFuZ2VkIGZvciBhIGZ1bmN0aW9uLlxyXG4gKiAtIHJldHVybiB2ID0+IHYgb3RoZXJ3aXNlLlxyXG4gKlxyXG4gKiBAcGFyYW0ge2FueX0gaW5wdXQgVGhlIGlucHV0IHRvIHR1cm4gaW50byBhIGZ1bmN0aW9uLlxyXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259IFRoZSByZXR1cm5lZCBmdW5jdGlvbi5cclxuICovXHJcbmNvbnN0IHRvTWFwVmFsID0gKGlucHV0KSA9PiB7XHJcbiAgICBpZiAoaXNGdW5jdGlvbihpbnB1dCkpIHJldHVybiBpbnB1dDtcclxuICAgIHJldHVybiB2ID0+IHY7XHJcbn07XHJcblxyXG4vKipcclxuICogVHVybiBpbnB1dCBpbnRvIGEgZnVuY3Rpb24gdGhhdCBtYXBzIGtleSB0byBkZXNpcmVkIGtleS5cclxuICogVXNlZCBvbmx5IGluIGNvbnZlcnROYW1lcygpLlxyXG4gKiBBcyBkZWZpbmVkIGluIHRoZSB0ZXN0LiB0b01hcEtleSgpIHNob3VsZDpcclxuICogLSByZXR1cm4gdW5jaGFuZ2VkIGZvciBhIGZ1bmN0aW9uLlxyXG4gKiAtIHJldHVybiAoKSA9PiBzcmMgZm9yIGEgc3RyaW5nIHN0ci5cclxuICogLSByZXR1cm4gXy5jYW1lbENhc2Ugb3RoZXJ3aXNlLlxyXG4gKiBfLmNhbWVsQ2FzZSBpcyB1c2VkIG9ubHkgZm9yIHRoZSBjb252ZW5pZW5jZSBvZiBEZWZpbml0aW9ucyBpbiBkZWZpbml0aW9ucy5qcyxcclxuICogYW5kIGlzIGR1ZSB0byBjaGFuZ2UgYXMgdGhlIERlZmluaXRpb25zIGV2b2x2ZXMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7YW55fSBpbnB1dCBUaGUgaW5wdXQgdG8gdHVybiBpbnRvIGEgZnVuY3Rpb24uXHJcbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gVGhlIHJldHVybmVkIGZ1bmN0aW9uLlxyXG4gKi9cclxuY29uc3QgdG9NYXBLZXkgPSAoaW5wdXQpID0+IHtcclxuICAgIGlmIChpc0Z1bmN0aW9uKGlucHV0KSkgcmV0dXJuIGlucHV0O1xyXG4gICAgaWYgKGlzU3RyaW5nKGlucHV0KSkgcmV0dXJuICgpID0+IGlucHV0O1xyXG4gICAgcmV0dXJuIGNhbWVsQ2FzZTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBUdXJuIGFycmF5IG9mIGlucHV0IGludG8gYW4geyBuYW1lOiBzdHJpbmcsIG1hcFZhbDogRnVuY3Rpb24sIG1hcEtleTogRnVuY3Rpb24gfS5cclxuICogVGhpcyBtZXRob2QgaXMgaW1wbGVtZW50cyB0aGUgY29tbW9uIGxvZ2ljcyBpbiBzcHJlYWQoKSBhbmQgc3ByZWFkT2JqKCkuXHJcbiAqIFRoZSBiZWhhdmlvciBvZiB0aGlzIG1ldGhvZCBpcyB0aGUgY29udmVuaWVuY2Ugb2YgRGVmaW5pdGlvbnMgaW4gZGVmaW5pdGlvbnMuanMsXHJcbiAqIGFuZCBpcyBkdWUgdG8gY2hhbmdlIGFzIHRoZSBEZWZpbml0aW9ucyBldm9sdmVzLlxyXG4gKiBJbiBzaG9ydCwgaXQgc3VwcG9ydHMgYSBjb252ZW5pZW50IHdheSB0byBleHRyYWN0IGRhdGEgZnJvbSBJbnB1dCBhcnJheXMgb3Igb2JqZWN0cyxcclxuICogcHJvYmFibHkgY2hhbmdpbmcgdGhlIHZhbHVlIGFuZCB0aGUga2V5IHdpdGggYSBtYXBwZXIgZnVuY3Rpb24sIGFuZCB1c2luZyB0aGVcclxuICogbWFwcGVkIGtleSBhbmQgdmFsdWUgdG8gY3JlYXRlIGEgUHJvcGVydHkgRGVmaW5pdGlvbi5cclxuICogSW4gdGhlIG1lYW53aGlsZSwgY29udmVydE5hbWVzKCkgcHJvdmlkZXMgZGVmYXVsdCB2YWx1ZXMgdG8gZW5hYmxlIGNyZWF0aW5nIFByb3BlcnR5XHJcbiAqIERlZmluaXRpb25zIHNpbXBseSBhbmQgc2hvcnRseS5cclxuICogSXRzIGRldGFpbGVkIGJlaGF2aW9yIGlzLCBtYXAgZWFjaCBuYW1lIG9mIG5hbWVzIHdpdGg6XHJcbiAqIC0gSWYgbmFtZSBpcyBhIHN0cmluZywgbWFwIFtuYW1lLCB1bmRlZmluZWQsIHVuZGVmaW5lZF0gaW5zdGVhZC5cclxuICogLSBJZiBuYW1lIGlzIGFuIEFycmF5LCByZXR1cm4geyBuYW1lOiBuYW1lWzBdLCBtYXBWYWw6IHRvTWFwVmFsKG5hbWVbMV0pLCBtYXBLZXk6IG5hbWVbMl0gfS5cclxuICogLSBPdGhlcndpc2UsIHJldHVybiBudWxsLlxyXG4gKiBUaGUgcmV0dXJuIHZhbHVlIGlzIGFuIGFycmF5LCBlYWNoIGVsZW1lbnQgYmVpbmcgZWl0aGVyOlxyXG4gKiAtIEFuIG9iamVjdCB3aXRoIHsgbmFtZTogc3RyaW5nLCBtYXBWYWw6IEZ1bmN0aW9uLCBtYXBLZXk6IEZ1bmN0aW9uIH0uXHJcbiAqIC0gT3IgbnVsbC5cclxuICogRWFjaCBlbGVtZW50IG9mIHRoZSByZXR1cm4gdmFsdWUgY29ycmVzcG9uZHMgdG8gdGhlIGVsZW1lbnQgaW4gbmFtZXMgb2YgdGhlIHNhbWUgaW5kZXgsXHJcbiAqIHdoaWNoIGVuYWJsZXMgdGhlIGZ1bmNpb25hbGl0eSBvZiBzcHJlYWQoKS5cclxuICpcclxuICogQHBhcmFtIHsoc3RyaW5nIHwgQXJyYXkgfCAqKVtdfSBuYW1lcyBUaGUgbmFtZXMgdG8gY29udmVydC5cclxuICogQHJldHVybnMgeyhPYmplY3QgfCBudWxsKVtdfSBUaGUgY29udmVydGVkIG5hbWVzLlxyXG4gKiBAc2VlICN0b01hcEtleVxyXG4gKiBAc2VlICN0b01hcFZhbFxyXG4gKiBAc2VlICNzcHJlYWRcclxuICogQHNlZSAjc3ByZWFkT2JqXHJcbiAqL1xyXG5jb25zdCBjb252ZXJ0TmFtZXMgPSAoLi4ubmFtZXMpID0+IG5hbWVzXHJcbiAgICAubWFwKG5hbWUgPT4gKGlzU3RyaW5nKG5hbWUpID8gW25hbWVdIDogbmFtZSkpXHJcbiAgICAubWFwKGNvbXBpbGUob25XaGVuKGEgPT4gYSwgaXNBcnJheSwge1xyXG4gICAgICAgIG5hbWU6IGEgPT4gYVswXSxcclxuICAgICAgICBtYXBWYWw6IGEgPT4gdG9NYXBWYWwoYVsxXSksXHJcbiAgICAgICAgbWFwS2V5OiBhID0+IHRvTWFwS2V5KGFbMl0pLFxyXG4gICAgfSkpKTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm4gYSBEZWZpbml0aW9uIHdoaWNoIHNwcmVhZCB0aGUgZ2l2ZW4gbmFtZXMuXHJcbiAqIFRoZSBiZWhhdmlvciBvZiB0aGlzIG1ldGhvZCBpcyB0aGUgY29udmVuaWVuY2Ugb2YgRGVmaW5pdGlvbnMgaW4gZGVmaW5pdGlvbnMuanMsXHJcbiAqIGFuZCBpcyBkdWUgdG8gY2hhbmdlIGFzIHRoZSBEZWZpbml0aW9ucyBldm9sdmVzLlxyXG4gKiBUaGUgbmFtZSBzcHJlYWQgY29tZXMgZnJvbSB0aGUgc3ByZWFkIHN5bnRheCBvZiBFQ01BU2NyaXB0LCBzaW5jZSB0aGlzIG1ldGhvZFxyXG4gKiB2YWd1ZWx5IGV4cHJlc3NlcyB0aGUgc2FtZSBpZGVhLlxyXG4gKiBUaGlzIG1ldGhvZCBzcHJlYWRzIHRoZSBnaXZlbiBuYW1lcyBpbnRvIGFuIG9iamVjdCB0byBjcmVhdGUgYW4gRGVmaW5pdGlvbi5cclxuICogVHlwaWNhbGx5LCBpdCBpcyB1c2VkIGFzIGZvbGxvd3M6XHJcbiAqIGNvbnN0IGRlZiA9IHNwcmVhZCgnZm9vJywgWydiYXInLCBwYXJzZUludF0sIDAsIFsnYmF6JywgMCwgJ2Zvb0JhciddLCBbJ2JhZF9jYXNlJywgMF0pO1xyXG4gKiBBbmQgdXNpbmcgZGVmIHRvIHBhcnNlOlxyXG4gKiBbJzEnLCAnMicsICczJywgJzQnLCAnNSddXHJcbiAqIHlvdSB3aWxsIGdldDpcclxuICogeyBmb286ICcxJywgYmFyOiAyLCBmb29CYXI6ICc0JywgYmFkQ2FzZTogJzUnIH1cclxuICogRXhwbGFuYXRpb25zLlxyXG4gKiBUaGUgYXJndW1lbnRzIGFyZSB1c2VkIGxpa2UgbWFwcGVycy4gV2hlbiB0aGUgcmV0dXJuZWQgRGVmaW5pdGlvbiBnZXRzIGFuIGFycmF5IGlucHV0LFxyXG4gKiBpdCBtYXBzIHRoZSBlbGVtZW50cyBhbmQgcmV0dXJuIGFuIG9iamVjdC5cclxuICogQXMgeW91IGNhbiBzZWUsIGdpdmluZyBhIHNpbXBsZSAnZm9vJyBzZXRzIHRoZSAnZm9vJyBwcm9wZXJ0eSB3aXRoIHRoZSB2YWx1ZSBvZiBpbnB1dFswXSxcclxuICogR2l2aW5nIFsnYmFyJywgcGFyc2VJbnRdIHNldHMgdGhlICdiYXInIHByb3BlcnR5IHdpdGggcGFyc2VJbnQoaW5wdXRbMV0pLlxyXG4gKiBHaXZpbmcgMCBpZ25vcmVzIHRoZSBpbnB1dCBlbGVtZW50LCB0aGF0IGlzLCBpbnB1dFsyXS4gKDAgaXMgdXNlZCBvbmx5IGJlY2F1c2UgaXQgaXMgc2hvcnQpXHJcbiAqIEdpdmluZyBbJ2JheicsIDAsICdmb29CYXInXSBzZXRzIHRoZSAnZm9vQmFyJyBwcm9wZXJ0eSB3aXRoIGlucHV0WzNdLCB3aGVyZSAwIHNwZWNpZmllc1xyXG4gKiBpbnB1dFszXSBpcyBub3QgbWFwcGVkIGFuZCByZXR1cm5lZCBkaXJlY3RseSwgJ2Zvb0JhcicgaXMgdGhlIGZpbmFsIHByb3BlcnR5IG5hbWUsIGFuZFxyXG4gKiAnZm9vJyBpcyBpZ25vcmVkLiAoQnV0IHRoaXMgd2lsbCBiZSBkaWZmZXJlbnQgaW4gc3ByZWFkT2JqKCkpLlxyXG4gKiBHaXZpbmcgWydiYWRfY2FzZScsIDBdIHNldHMgdGhlICdiYWRDYXNlJyBwcm9wZXJ0eSB3aXRoIGlucHV0WzRdLCB3aGVyZSAwIHNwZWNpZmllc1xyXG4gKiB0aGF0IGlucHV0WzRdIGlzIG5vdCBtYXBwZWQsICdiYWRfY2FzZScgaXMgdXNlZCB0byBwcm9kdWNlIHRoZSBwcm9wZXJ0eSBuYW1lICdiYWRDYXNlJ1xyXG4gKiAoYnkgY29udmVydGluZyBpdCBpbnRvIGNhbWVsQ2FzZSB3aGVuIG5vIGNvbnZlcnQgZnVuY3Rpb24gaXMgc3BlY2lmaWVkLCBzZWUgdG9NYXBLZXkoKSkuXHJcbiAqIFdoZW4gdXNpbmcgc3ByZWFkKCksIHRoZSBsYXN0IDIgc3ludGF4ZXMgYXJlIHJhcmVseSB1c2VkLCBidXQgdGhleSBkbyBoYXZlIHRoZWlyIHJlYXNvblxyXG4gKiBvZiBleGlzdGVuY2UgaW4gc3ByZWFkT2JqKCkuXHJcbiAqIEluIHNob3J0LCBpdCB1c2VzIGNvbnZlcnROYW1lcygpLCBpZ25vcmVzIG51bGwgcmV0dXJuIGVsZW1lbnRzLCBhbmQgcmV0dXJucyBhIERlZmluaXRvblxyXG4gKiB0aGF0IG1hcHMgZXZlcnkgaW5wdXQgZWxlbWVudCBpbnRvIGEgcHJvcGVydHkgb2YgdGhlIHJldHVybmVkIG9iamVjdC5cclxuICpcclxuICogQHBhcmFtIHthbnlbXX0gbmFtZXMgVGhlIG5hbWVzIHRvIHNwcmVhZC5cclxuICogQHJldHVybnMge0Z1bmN0aW9ufSBUaGUgcmV0dXJuZWQgRGVmaW5pdGlvbi5cclxuICogQHNlZSAjY29udmVydE5hbWVzXHJcbiAqIEBzZWUgI3NwcmVhZE9ialxyXG4gKi9cclxuY29uc3Qgc3ByZWFkID0gKC4uLm5hbWVzKSA9PlxyXG4gICAgZnJvbVBhaXJzKGNvbnZlcnROYW1lcyguLi5uYW1lcylcclxuICAgICAgICAubWFwKChjb252ZXJ0ZWQsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghaXNPYmplY3QoY29udmVydGVkKSkgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgY29uc3QgeyBuYW1lLCBtYXBWYWwsIG1hcEtleSB9ID0gY29udmVydGVkO1xyXG4gICAgICAgICAgICByZXR1cm4gW21hcEtleShuYW1lKSwgYSA9PiBtYXBWYWwoYVtpbmRleF0pXTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5maWx0ZXIoaXNBcnJheSkpO1xyXG5cclxuLyoqXHJcbiAqIFJldHVybiBhIERlZmluaXRpb24gd2hpY2ggc3ByZWFkIHRoZSBnaXZlbiBuYW1lcy5cclxuICogVGhlIGJlaGF2aW9yIG9mIHRoaXMgbWV0aG9kIGlzIHRoZSBjb252ZW5pZW5jZSBvZiBEZWZpbml0aW9ucyBpbiBkZWZpbml0aW9ucy5qcyxcclxuICogYW5kIGlzIGR1ZSB0byBjaGFuZ2UgYXMgdGhlIERlZmluaXRpb25zIGV2b2x2ZXMuXHJcbiAqIFRoZSBuYW1lIHNwcmVhZCBjb21lcyBmcm9tIHRoZSBvYmplY3Qgc3ByZWFkIHN5bnRheCBvZiBFQ01BU2NyaXB0LCBzaW5jZSB0aGlzIG1ldGhvZFxyXG4gKiB2YWd1ZWx5IGV4cHJlc3NlcyB0aGUgc2FtZSBpZGVhLlxyXG4gKiBUaGlzIG1ldGhvZCBzcHJlYWRzIHRoZSBnaXZlbiBuYW1lcyBpbnRvIGFuIG9iamVjdCB0byBjcmVhdGUgYW4gRGVmaW5pdGlvbi5cclxuICogVHlwaWNhbGx5LCBpdCBpcyB1c2VkIGFzIGZvbGxvd3M6XHJcbiAqIGNvbnN0IGRlZiA9IHNwcmVhZE9iaignZm9vJywgWydiYXInLCBwYXJzZUludF0sIDAsIFsnYmF6JywgMCwgJ2Zvb0JhciddLCBbJ2JhZF9jYXNlJywgMF0pO1xyXG4gKiBBbmQgdXNpbmcgZGVmIHRvIHBhcnNlOlxyXG4gKiB7IGZvbzogJzEnLCBiYXI6ICcyJywgYmFhOiAnMycsIGJhejogJzQnLCBiYWRfY2FzZTogJzUnIH1cclxuICogeW91IHdpbGwgZ2V0OlxyXG4gKiB7IGZvbzogJzEnLCBiYXI6IDIsIGZvb0JhcjogJzQnLCBiYWRDYXNlOiAnNScgfVxyXG4gKiBFeHBsYW5hdGlvbnMuXHJcbiAqIFRoZSBhcmd1bWVudHMgYXJlIHVzZWQgbGlrZSBtYXBwZXJzLiBXaGVuIHRoZSByZXR1cm5lZCBEZWZpbml0aW9uIGdldHMgYW4gb2JqZWN0IGlucHV0LFxyXG4gKiBpdCBtYXBzIHRoZSBwcm9wZXJ0aWVzIGFuZCByZXR1cm4gYW5vdGhlciBvYmplY3QuXHJcbiAqIEFzIHlvdSBjYW4gc2VlLCBnaXZpbmcgYSBzaW1wbGUgJ2Zvbycgc2V0cyB0aGUgJ2ZvbycgcHJvcGVydHkgd2l0aCB0aGUgdmFsdWUgb2YgaW5wdXQuZm9vLFxyXG4gKiBHaXZpbmcgWydiYXInLCBwYXJzZUludF0gc2V0cyB0aGUgJ2JhcicgcHJvcGVydHkgd2l0aCBwYXJzZUludChpbnB1dC5iYXIpLlxyXG4gKiBHaXZpbmcgMCB3aWxsIGJlIG1lYW5pbmdsZXNzLCB0aGlzIHN5bnRheCBpcyBvbmx5IGF2YWlsYWJsZSBpbiBzcHJlYWQoKS5cclxuICogR2l2aW5nIFsnYmF6JywgMCwgJ2Zvb0JhciddIHNldHMgdGhlICdmb29CYXInIHByb3BlcnR5IHdpdGggaW5wdXQuYmF6LCB3aGVyZSAwIHNwZWNpZmllc1xyXG4gKiBpbnB1dC5iYXogaXMgbm90IG1hcHBlZCBhbmQgcmV0dXJuZWQgZGlyZWN0bHkuICgwIGlzIHVzZWQgb25seSBiZWNhdXNlIGl0IGlzIHNob3J0LCBhbnlcclxuICogbm9uLXN0cmluZyBhbmQgbm9uLUFycmF5IHZhbHVlIHdpbGwgaGF2ZSB0aGUgc2FtZSBlZmZlY3QpICdmb29CYXInIGlzIHRoZSBmaW5hbCBwcm9wZXJ0eVxyXG4gKiBuYW1lLCBhbmQgJ2JheicgaXMgdGhlIHByb3BlcnR5IG5hbWUgaW4gaW5wdXQuXHJcbiAqIEdpdmluZyBbJ2JhZF9jYXNlJywgMF0gc2V0cyB0aGUgJ2JhZENhc2UnIHByb3BlcnR5IHdpdGggaW5wdXQuYmFkX2Nhc2UsIHdoZXJlIDAgc3BlY2lmaWVzXHJcbiAqIHRoYXQgaW5wdXQuZm9vX2JhciBpcyBub3QgbWFwcGVkLCAnYmFkX2Nhc2UnIHRoZSBwcm9wZXJ0eSBuYW1lIGluIGlucHV0IGFuZCAnYmFkQ2FzZScgaXNcclxuICogdGhlIGNhbWVsQ2FzZSBvZiAnYmFkX2Nhc2UnLiAoVGhpcyBpcyB0aGUgZGVmYXVsdCBiZWhhdmlvciBzaW5jZSB0aGUga2V5IG1hcHBlciBpcyBub3RcclxuICogc3BlY2lmaWVkLiBTZWUgdG9NYXBLZXkoKSBmb3IgZGV0YWlscykuXHJcbiAqIFdoZW4gdXNpbmcgc3ByZWFkKCksIHRoZSB0aGlyZCBzeW50YXggaXMgcmFyZWx5IHVzZWQsIGJ1dCBpdCBpcyB1c2VmdWwgaW4gc3ByZWFkT2JqKCkuXHJcbiAqIEluIHNob3J0LCBpdCB1c2VzIGNvbnZlcnROYW1lcygpLCBhbmQgcmV0dXJucyBhIERlZmluaXRvbiB0aGF0IG1hcHMgZXZlcnkgaW5wdXQgcHJvcGVydHlcclxuICogaW50byBhIHByb3BlcnR5IG9mIHRoZSByZXR1cm5lZCBvYmplY3QuXHJcbiAqXHJcbiAqIEBwYXJhbSB7YW55W119IG5hbWVzIFRoZSBuYW1lcyB0byBzcHJlYWQuXHJcbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gVGhlIHJldHVybmVkIERlZmluaXRpb24uXHJcbiAqIEBzZWUgI2NvbnZlcnROYW1lc1xyXG4gKiBAc2VlICNzcHJlYWRcclxuICovXHJcbmNvbnN0IHNwcmVhZE9iaiA9ICguLi5uYW1lcykgPT5cclxuICAgIGZyb21QYWlycyhjb252ZXJ0TmFtZXMoLi4ubmFtZXMpXHJcbiAgICAgICAgLmZpbHRlcihpc09iamVjdClcclxuICAgICAgICAubWFwKCh7IG5hbWUsIG1hcFZhbCwgbWFwS2V5IH0pID0+IFttYXBLZXkobmFtZSksIG8gPT4gbWFwVmFsKG9bbmFtZV0pXSkpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBhc0ZsYWcsXHJcbiAgICBvbldoZW4sXHJcbiAgICBvbixcclxuICAgIG9uRXhpc3QsXHJcbiAgICB0b01hcFZhbCxcclxuICAgIHRvTWFwS2V5LFxyXG4gICAgY29udmVydE5hbWVzLFxyXG4gICAgc3ByZWFkLFxyXG4gICAgc3ByZWFkT2JqLFxyXG59O1xyXG4iXX0=