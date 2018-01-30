module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/


class Hook {
  constructor(args) {
    if (!Array.isArray(args)) args = [];
    this._args = args;
    this.taps = [];
    this.interceptors = [];
    this.call = this._call = this._createCompileDelegate("call", "sync");
    this.promise = this._promise = this._createCompileDelegate("promise", "promise");
    this.callAsync = this._callAsync = this._createCompileDelegate("callAsync", "async");
    this._x = undefined;
  }

  compile(options) {
    throw new Error("Abstract: should be overriden");
  }

  _createCall(type) {
    return this.compile({
      taps: this.taps,
      interceptors: this.interceptors,
      args: this._args,
      type: type
    });
  }

  _createCompileDelegate(name, type) {
    const lazyCompileHook = (...args) => {
      this[name] = this._createCall(type);
      return this[name](...args);
    };

    return lazyCompileHook;
  }

  tap(options, fn) {
    if (typeof options === "string") options = {
      name: options
    };
    if (typeof options !== "object" || options === null) throw new Error("Invalid arguments to tap(options: Object, fn: function)");
    options = Object.assign({
      type: "sync",
      fn: fn
    }, options);
    if (typeof options.name !== "string" || options.name === "") throw new Error("Missing name for tap");
    options = this._runRegisterInterceptors(options);

    this._insert(options);
  }

  tapAsync(options, fn) {
    if (typeof options === "string") options = {
      name: options
    };
    if (typeof options !== "object" || options === null) throw new Error("Invalid arguments to tapAsync(options: Object, fn: function)");
    options = Object.assign({
      type: "async",
      fn: fn
    }, options);
    if (typeof options.name !== "string" || options.name === "") throw new Error("Missing name for tapAsync");
    options = this._runRegisterInterceptors(options);

    this._insert(options);
  }

  tapPromise(options, fn) {
    if (typeof options === "string") options = {
      name: options
    };
    if (typeof options !== "object" || options === null) throw new Error("Invalid arguments to tapPromise(options: Object, fn: function)");
    options = Object.assign({
      type: "promise",
      fn: fn
    }, options);
    if (typeof options.name !== "string" || options.name === "") throw new Error("Missing name for tapPromise");
    options = this._runRegisterInterceptors(options);

    this._insert(options);
  }

  _runRegisterInterceptors(options) {
    for (const interceptor of this.interceptors) {
      if (interceptor.register) {
        const newOptions = interceptor.register(options);
        if (newOptions !== undefined) options = newOptions;
      }
    }

    return options;
  }

  withOptions(options) {
    const mergeOptions = opt => Object.assign({}, options, typeof opt === "string" ? {
      name: opt
    } : opt); // Prevent creating endless prototype chains


    options = Object.assign({}, options, this._withOptions);
    const base = this._withOptionsBase || this;
    const newHook = Object.create(base);
    newHook.tapAsync = (opt, fn) => base.tapAsync(mergeOptions(opt), fn), newHook.tap = (opt, fn) => base.tap(mergeOptions(opt), fn);

    newHook.tapPromise = (opt, fn) => base.tapPromise(mergeOptions(opt), fn);

    newHook._withOptions = options;
    newHook._withOptionsBase = base;
    return newHook;
  }

  isUsed() {
    return this.taps.length > 0 || this.interceptors.length > 0;
  }

  intercept(interceptor) {
    this._resetCompilation();

    this.interceptors.push(Object.assign({}, interceptor));

    if (interceptor.register) {
      for (let i = 0; i < this.taps.length; i++) this.taps[i] = interceptor.register(this.taps[i]);
    }
  }

  _resetCompilation() {
    this.call = this._call;
    this.callAsync = this._callAsync;
    this.promise = this._promise;
  }

  _insert(item) {
    this._resetCompilation();

    let before;
    if (typeof item.before === "string") before = new Set([item.before]);else if (Array.isArray(item.before)) {
      before = new Set(item.before);
    }
    let stage = 0;
    if (typeof item.stage === "number") stage = item.stage;
    let i = this.taps.length;

    while (i > 0) {
      i--;
      const x = this.taps[i];
      this.taps[i + 1] = x;
      const xStage = x.stage || 0;

      if (before) {
        if (before.has(x.name)) {
          before.delete(x.name);
          continue;
        }

        if (before.size > 0) {
          continue;
        }
      }

      if (xStage > stage) {
        continue;
      }

      i++;
      break;
    }

    this.taps[i] = item;
  }

}

module.exports = Hook;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/


class HookCodeFactory {
  constructor(config) {
    this.config = config;
    this.options = undefined;
  }

  create(options) {
    this.init(options);

    switch (this.options.type) {
      case "sync":
        return new Function(this.args(), "\"use strict\";\n" + this.header() + this.content({
          onError: err => `throw ${err};\n`,
          onResult: result => `return ${result};\n`,
          onDone: () => "",
          rethrowIfPossible: true
        }));

      case "async":
        return new Function(this.args({
          after: "_callback"
        }), "\"use strict\";\n" + this.header() + this.content({
          onError: err => `_callback(${err});\n`,
          onResult: result => `_callback(null, ${result});\n`,
          onDone: () => "_callback();\n"
        }));

      case "promise":
        let code = "";
        code += "\"use strict\";\n";
        code += "return new Promise((_resolve, _reject) => {\n";
        code += "var _sync = true;\n";
        code += this.header();
        code += this.content({
          onError: err => {
            let code = "";
            code += "if(_sync)\n";
            code += `_resolve(Promise.resolve().then(() => { throw ${err}; }));\n`;
            code += "else\n";
            code += `_reject(${err});\n`;
            return code;
          },
          onResult: result => `_resolve(${result});\n`,
          onDone: () => "_resolve();\n"
        });
        code += "_sync = false;\n";
        code += "});\n";
        return new Function(this.args(), code);
    }
  }

  setup(instance, options) {
    instance._x = options.taps.map(t => t.fn);
  }
  /**
   * @param {{ type: "sync" | "promise" | "async", taps: Array<Tap>, interceptors: Array<Interceptor> }} options
   */


  init(options) {
    this.options = options;
    this._args = options.args.slice();
  }

  header() {
    let code = "";

    if (this.needContext()) {
      code += "var _context = {};\n";
    } else {
      code += "var _context;\n";
    }

    code += "var _x = this._x;\n";

    if (this.options.interceptors.length > 0) {
      code += "var _taps = this.taps;\n";
      code += "var _interceptors = this.interceptors;\n";
    }

    for (let i = 0; i < this.options.interceptors.length; i++) {
      const interceptor = this.options.interceptors[i];

      if (interceptor.call) {
        code += `${this.getInterceptor(i)}.call(${this.args({
          before: interceptor.context ? "_context" : undefined
        })});\n`;
      }
    }

    return code;
  }

  needContext() {
    for (const tap of this.options.taps) if (tap.context) return true;

    return false;
  }

  callTap(tapIndex, {
    onError,
    onResult,
    onDone,
    rethrowIfPossible
  }) {
    let code = "";
    let hasTapCached = false;

    for (let i = 0; i < this.options.interceptors.length; i++) {
      const interceptor = this.options.interceptors[i];

      if (interceptor.tap) {
        if (!hasTapCached) {
          code += `var _tap${tapIndex} = ${this.getTap(tapIndex)};\n`;
          hasTapCached = true;
        }

        code += `${this.getInterceptor(i)}.tap(${interceptor.context ? "_context, " : ""}_tap${tapIndex});\n`;
      }
    }

    code += `var _fn${tapIndex} = ${this.getTapFn(tapIndex)};\n`;
    const tap = this.options.taps[tapIndex];

    switch (tap.type) {
      case "sync":
        if (!rethrowIfPossible) {
          code += `var _hasError${tapIndex} = false;\n`;
          code += "try {\n";
        }

        if (onResult) {
          code += `var _result${tapIndex} = _fn${tapIndex}(${this.args({
            before: tap.context ? "_context" : undefined
          })});\n`;
        } else {
          code += `_fn${tapIndex}(${this.args({
            before: tap.context ? "_context" : undefined
          })});\n`;
        }

        if (!rethrowIfPossible) {
          code += "} catch(_err) {\n";
          code += `_hasError${tapIndex} = true;\n`;
          code += onError("_err");
          code += "}\n";
          code += `if(!_hasError${tapIndex}) {\n`;
        }

        if (onResult) {
          code += onResult(`_result${tapIndex}`);
        }

        if (onDone) {
          code += onDone();
        }

        if (!rethrowIfPossible) {
          code += "}\n";
        }

        break;

      case "async":
        let cbCode = "";
        if (onResult) cbCode += `(_err${tapIndex}, _result${tapIndex}) => {\n`;else cbCode += `_err${tapIndex} => {\n`;
        cbCode += `if(_err${tapIndex}) {\n`;
        cbCode += onError(`_err${tapIndex}`);
        cbCode += "} else {\n";

        if (onResult) {
          cbCode += onResult(`_result${tapIndex}`);
        }

        if (onDone) {
          cbCode += onDone();
        }

        cbCode += "}\n";
        cbCode += "}";
        code += `_fn${tapIndex}(${this.args({
          before: tap.context ? "_context" : undefined,
          after: cbCode
        })});\n`;
        break;

      case "promise":
        code += `var _hasResult${tapIndex} = false;\n`;
        code += `_fn${tapIndex}(${this.args({
          before: tap.context ? "_context" : undefined
        })}).then(_result${tapIndex} => {\n`;
        code += `_hasResult${tapIndex} = true;\n`;

        if (onResult) {
          code += onResult(`_result${tapIndex}`);
        }

        if (onDone) {
          code += onDone();
        }

        code += `}, _err${tapIndex} => {\n`;
        code += `if(_hasResult${tapIndex}) throw _err${tapIndex};\n`;
        code += onError(`_err${tapIndex}`);
        code += "});\n";
        break;
    }

    return code;
  }

  callTapsSeries({
    onError,
    onResult,
    onDone,
    rethrowIfPossible
  }) {
    if (this.options.taps.length === 0) return onDone();
    const firstAsync = this.options.taps.findIndex(t => t.type !== "sync");

    const next = i => {
      if (i >= this.options.taps.length) {
        return onDone();
      }

      const done = () => next(i + 1);

      const doneBreak = skipDone => {
        if (skipDone) return "";
        return onDone();
      };

      return this.callTap(i, {
        onError: error => onError(i, error, done, doneBreak),
        onResult: onResult && (result => {
          return onResult(i, result, done, doneBreak);
        }),
        onDone: !onResult && (() => {
          return done();
        }),
        rethrowIfPossible: rethrowIfPossible && (firstAsync < 0 || i < firstAsync)
      });
    };

    return next(0);
  }

  callTapsLooping({
    onError,
    onDone,
    rethrowIfPossible
  }) {
    if (this.options.taps.length === 0) return onDone();
    const syncOnly = this.options.taps.every(t => t.type === "sync");
    let code = "";

    if (!syncOnly) {
      code += "var _looper = () => {\n";
      code += "var _loopAsync = false;\n";
    }

    code += "var _loop;\n";
    code += "do {\n";
    code += "_loop = false;\n";

    for (let i = 0; i < this.options.interceptors.length; i++) {
      const interceptor = this.options.interceptors[i];

      if (interceptor.loop) {
        code += `${this.getInterceptor(i)}.loop(${this.args({
          before: interceptor.context ? "_context" : undefined
        })});\n`;
      }
    }

    code += this.callTapsSeries({
      onError,
      onResult: (i, result, next, doneBreak) => {
        let code = "";
        code += `if(${result} !== undefined) {\n`;
        code += "_loop = true;\n";
        if (!syncOnly) code += "if(_loopAsync) _looper();\n";
        code += doneBreak(true);
        code += `} else {\n`;
        code += next();
        code += `}\n`;
        return code;
      },
      onDone: onDone && (() => {
        let code = "";
        code += "if(!_loop) {\n";
        code += onDone();
        code += "}\n";
        return code;
      }),
      rethrowIfPossible: rethrowIfPossible && syncOnly
    });
    code += "} while(_loop);\n";

    if (!syncOnly) {
      code += "_loopAsync = true;\n";
      code += "};\n";
      code += "_looper();\n";
    }

    return code;
  }

  callTapsParallel({
    onError,
    onResult,
    onDone,
    rethrowIfPossible,
    onTap = (i, run) => run()
  }) {
    if (this.options.taps.length <= 1) {
      return this.callTapsSeries({
        onError,
        onResult,
        onDone,
        rethrowIfPossible
      });
    }

    let code = "";
    code += "do {\n";
    code += `var _counter = ${this.options.taps.length};\n`;

    if (onDone) {
      code += "var _done = () => {\n";
      code += onDone();
      code += "};\n";
    }

    for (let i = 0; i < this.options.taps.length; i++) {
      const done = () => {
        if (onDone) return "if(--_counter === 0) _done();\n";else return "--_counter;";
      };

      const doneBreak = skipDone => {
        if (skipDone || !onDone) return "_counter = 0;\n";else return "_counter = 0;\n_done();\n";
      };

      code += "if(_counter <= 0) break;\n";
      code += onTap(i, () => this.callTap(i, {
        onError: error => {
          let code = "";
          code += "if(_counter > 0) {\n";
          code += onError(i, error, done, doneBreak);
          code += "}\n";
          return code;
        },
        onResult: onResult && (result => {
          let code = "";
          code += "if(_counter > 0) {\n";
          code += onResult(i, result, done, doneBreak);
          code += "}\n";
          return code;
        }),
        onDone: !onResult && (() => {
          return done();
        }),
        rethrowIfPossible
      }), done, doneBreak);
    }

    code += "} while(false);\n";
    return code;
  }

  args({
    before,
    after
  } = {}) {
    let allArgs = this._args;
    if (before) allArgs = [before].concat(allArgs);
    if (after) allArgs = allArgs.concat(after);

    if (allArgs.length === 0) {
      return "";
    } else {
      return allArgs.join(", ");
    }
  }

  getTapFn(idx) {
    return `_x[${idx}]`;
  }

  getTap(idx) {
    return `_taps[${idx}]`;
  }

  getInterceptor(idx) {
    return `_interceptors[${idx}]`;
  }

}

module.exports = HookCodeFactory;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/


const Hook = __webpack_require__(0);

const HookCodeFactory = __webpack_require__(1);

class SyncBailHookCodeFactory extends HookCodeFactory {
  content({
    onError,
    onResult,
    onDone,
    rethrowIfPossible
  }) {
    return this.callTapsSeries({
      onError: (i, err) => onError(err),
      onResult: (i, result, next) => `if(${result} !== undefined) {\n${onResult(result)};\n} else {\n${next()}}\n`,
      onDone,
      rethrowIfPossible
    });
  }

}

const factory = new SyncBailHookCodeFactory();

class SyncBailHook extends Hook {
  tapAsync() {
    throw new Error("tapAsync is not supported on a SyncBailHook");
  }

  tapPromise() {
    throw new Error("tapPromise is not supported on a SyncBailHook");
  }

  compile(options) {
    factory.setup(this, options);
    return factory.create(options);
  }

}

module.exports = SyncBailHook;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

/* MIT license */
var cssKeywords = __webpack_require__(25); // NOTE: conversions should only return primitive values (i.e. arrays, or
//       values that give correct `typeof` results).
//       do not use box values types (i.e. Number(), String(), etc.)


var reverseKeywords = {};

for (var key in cssKeywords) {
  if (cssKeywords.hasOwnProperty(key)) {
    reverseKeywords[cssKeywords[key]] = key;
  }
}

var convert = module.exports = {
  rgb: {
    channels: 3,
    labels: 'rgb'
  },
  hsl: {
    channels: 3,
    labels: 'hsl'
  },
  hsv: {
    channels: 3,
    labels: 'hsv'
  },
  hwb: {
    channels: 3,
    labels: 'hwb'
  },
  cmyk: {
    channels: 4,
    labels: 'cmyk'
  },
  xyz: {
    channels: 3,
    labels: 'xyz'
  },
  lab: {
    channels: 3,
    labels: 'lab'
  },
  lch: {
    channels: 3,
    labels: 'lch'
  },
  hex: {
    channels: 1,
    labels: ['hex']
  },
  keyword: {
    channels: 1,
    labels: ['keyword']
  },
  ansi16: {
    channels: 1,
    labels: ['ansi16']
  },
  ansi256: {
    channels: 1,
    labels: ['ansi256']
  },
  hcg: {
    channels: 3,
    labels: ['h', 'c', 'g']
  },
  apple: {
    channels: 3,
    labels: ['r16', 'g16', 'b16']
  },
  gray: {
    channels: 1,
    labels: ['gray']
  }
}; // hide .channels and .labels properties

for (var model in convert) {
  if (convert.hasOwnProperty(model)) {
    if (!('channels' in convert[model])) {
      throw new Error('missing channels property: ' + model);
    }

    if (!('labels' in convert[model])) {
      throw new Error('missing channel labels property: ' + model);
    }

    if (convert[model].labels.length !== convert[model].channels) {
      throw new Error('channel and label counts mismatch: ' + model);
    }

    var channels = convert[model].channels;
    var labels = convert[model].labels;
    delete convert[model].channels;
    delete convert[model].labels;
    Object.defineProperty(convert[model], 'channels', {
      value: channels
    });
    Object.defineProperty(convert[model], 'labels', {
      value: labels
    });
  }
}

convert.rgb.hsl = function (rgb) {
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255;
  var min = Math.min(r, g, b);
  var max = Math.max(r, g, b);
  var delta = max - min;
  var h;
  var s;
  var l;

  if (max === min) {
    h = 0;
  } else if (r === max) {
    h = (g - b) / delta;
  } else if (g === max) {
    h = 2 + (b - r) / delta;
  } else if (b === max) {
    h = 4 + (r - g) / delta;
  }

  h = Math.min(h * 60, 360);

  if (h < 0) {
    h += 360;
  }

  l = (min + max) / 2;

  if (max === min) {
    s = 0;
  } else if (l <= 0.5) {
    s = delta / (max + min);
  } else {
    s = delta / (2 - max - min);
  }

  return [h, s * 100, l * 100];
};

convert.rgb.hsv = function (rgb) {
  var r = rgb[0];
  var g = rgb[1];
  var b = rgb[2];
  var min = Math.min(r, g, b);
  var max = Math.max(r, g, b);
  var delta = max - min;
  var h;
  var s;
  var v;

  if (max === 0) {
    s = 0;
  } else {
    s = delta / max * 1000 / 10;
  }

  if (max === min) {
    h = 0;
  } else if (r === max) {
    h = (g - b) / delta;
  } else if (g === max) {
    h = 2 + (b - r) / delta;
  } else if (b === max) {
    h = 4 + (r - g) / delta;
  }

  h = Math.min(h * 60, 360);

  if (h < 0) {
    h += 360;
  }

  v = max / 255 * 1000 / 10;
  return [h, s, v];
};

convert.rgb.hwb = function (rgb) {
  var r = rgb[0];
  var g = rgb[1];
  var b = rgb[2];
  var h = convert.rgb.hsl(rgb)[0];
  var w = 1 / 255 * Math.min(r, Math.min(g, b));
  b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));
  return [h, w * 100, b * 100];
};

convert.rgb.cmyk = function (rgb) {
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255;
  var c;
  var m;
  var y;
  var k;
  k = Math.min(1 - r, 1 - g, 1 - b);
  c = (1 - r - k) / (1 - k) || 0;
  m = (1 - g - k) / (1 - k) || 0;
  y = (1 - b - k) / (1 - k) || 0;
  return [c * 100, m * 100, y * 100, k * 100];
};
/**
 * See https://en.m.wikipedia.org/wiki/Euclidean_distance#Squared_Euclidean_distance
 * */


function comparativeDistance(x, y) {
  return Math.pow(x[0] - y[0], 2) + Math.pow(x[1] - y[1], 2) + Math.pow(x[2] - y[2], 2);
}

convert.rgb.keyword = function (rgb) {
  var reversed = reverseKeywords[rgb];

  if (reversed) {
    return reversed;
  }

  var currentClosestDistance = Infinity;
  var currentClosestKeyword;

  for (var keyword in cssKeywords) {
    if (cssKeywords.hasOwnProperty(keyword)) {
      var value = cssKeywords[keyword]; // Compute comparative distance

      var distance = comparativeDistance(rgb, value); // Check if its less, if so set as closest

      if (distance < currentClosestDistance) {
        currentClosestDistance = distance;
        currentClosestKeyword = keyword;
      }
    }
  }

  return currentClosestKeyword;
};

convert.keyword.rgb = function (keyword) {
  return cssKeywords[keyword];
};

convert.rgb.xyz = function (rgb) {
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255; // assume sRGB

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  var x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  var y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  var z = r * 0.0193 + g * 0.1192 + b * 0.9505;
  return [x * 100, y * 100, z * 100];
};

convert.rgb.lab = function (rgb) {
  var xyz = convert.rgb.xyz(rgb);
  var x = xyz[0];
  var y = xyz[1];
  var z = xyz[2];
  var l;
  var a;
  var b;
  x /= 95.047;
  y /= 100;
  z /= 108.883;
  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
  l = 116 * y - 16;
  a = 500 * (x - y);
  b = 200 * (y - z);
  return [l, a, b];
};

convert.hsl.rgb = function (hsl) {
  var h = hsl[0] / 360;
  var s = hsl[1] / 100;
  var l = hsl[2] / 100;
  var t1;
  var t2;
  var t3;
  var rgb;
  var val;

  if (s === 0) {
    val = l * 255;
    return [val, val, val];
  }

  if (l < 0.5) {
    t2 = l * (1 + s);
  } else {
    t2 = l + s - l * s;
  }

  t1 = 2 * l - t2;
  rgb = [0, 0, 0];

  for (var i = 0; i < 3; i++) {
    t3 = h + 1 / 3 * -(i - 1);

    if (t3 < 0) {
      t3++;
    }

    if (t3 > 1) {
      t3--;
    }

    if (6 * t3 < 1) {
      val = t1 + (t2 - t1) * 6 * t3;
    } else if (2 * t3 < 1) {
      val = t2;
    } else if (3 * t3 < 2) {
      val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
    } else {
      val = t1;
    }

    rgb[i] = val * 255;
  }

  return rgb;
};

convert.hsl.hsv = function (hsl) {
  var h = hsl[0];
  var s = hsl[1] / 100;
  var l = hsl[2] / 100;
  var smin = s;
  var lmin = Math.max(l, 0.01);
  var sv;
  var v;
  l *= 2;
  s *= l <= 1 ? l : 2 - l;
  smin *= lmin <= 1 ? lmin : 2 - lmin;
  v = (l + s) / 2;
  sv = l === 0 ? 2 * smin / (lmin + smin) : 2 * s / (l + s);
  return [h, sv * 100, v * 100];
};

convert.hsv.rgb = function (hsv) {
  var h = hsv[0] / 60;
  var s = hsv[1] / 100;
  var v = hsv[2] / 100;
  var hi = Math.floor(h) % 6;
  var f = h - Math.floor(h);
  var p = 255 * v * (1 - s);
  var q = 255 * v * (1 - s * f);
  var t = 255 * v * (1 - s * (1 - f));
  v *= 255;

  switch (hi) {
    case 0:
      return [v, t, p];

    case 1:
      return [q, v, p];

    case 2:
      return [p, v, t];

    case 3:
      return [p, q, v];

    case 4:
      return [t, p, v];

    case 5:
      return [v, p, q];
  }
};

convert.hsv.hsl = function (hsv) {
  var h = hsv[0];
  var s = hsv[1] / 100;
  var v = hsv[2] / 100;
  var vmin = Math.max(v, 0.01);
  var lmin;
  var sl;
  var l;
  l = (2 - s) * v;
  lmin = (2 - s) * vmin;
  sl = s * vmin;
  sl /= lmin <= 1 ? lmin : 2 - lmin;
  sl = sl || 0;
  l /= 2;
  return [h, sl * 100, l * 100];
}; // http://dev.w3.org/csswg/css-color/#hwb-to-rgb


convert.hwb.rgb = function (hwb) {
  var h = hwb[0] / 360;
  var wh = hwb[1] / 100;
  var bl = hwb[2] / 100;
  var ratio = wh + bl;
  var i;
  var v;
  var f;
  var n; // wh + bl cant be > 1

  if (ratio > 1) {
    wh /= ratio;
    bl /= ratio;
  }

  i = Math.floor(6 * h);
  v = 1 - bl;
  f = 6 * h - i;

  if ((i & 0x01) !== 0) {
    f = 1 - f;
  }

  n = wh + f * (v - wh); // linear interpolation

  var r;
  var g;
  var b;

  switch (i) {
    default:
    case 6:
    case 0:
      r = v;
      g = n;
      b = wh;
      break;

    case 1:
      r = n;
      g = v;
      b = wh;
      break;

    case 2:
      r = wh;
      g = v;
      b = n;
      break;

    case 3:
      r = wh;
      g = n;
      b = v;
      break;

    case 4:
      r = n;
      g = wh;
      b = v;
      break;

    case 5:
      r = v;
      g = wh;
      b = n;
      break;
  }

  return [r * 255, g * 255, b * 255];
};

convert.cmyk.rgb = function (cmyk) {
  var c = cmyk[0] / 100;
  var m = cmyk[1] / 100;
  var y = cmyk[2] / 100;
  var k = cmyk[3] / 100;
  var r;
  var g;
  var b;
  r = 1 - Math.min(1, c * (1 - k) + k);
  g = 1 - Math.min(1, m * (1 - k) + k);
  b = 1 - Math.min(1, y * (1 - k) + k);
  return [r * 255, g * 255, b * 255];
};

convert.xyz.rgb = function (xyz) {
  var x = xyz[0] / 100;
  var y = xyz[1] / 100;
  var z = xyz[2] / 100;
  var r;
  var g;
  var b;
  r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  b = x * 0.0557 + y * -0.2040 + z * 1.0570; // assume sRGB

  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1.0 / 2.4) - 0.055 : r * 12.92;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1.0 / 2.4) - 0.055 : g * 12.92;
  b = b > 0.0031308 ? 1.055 * Math.pow(b, 1.0 / 2.4) - 0.055 : b * 12.92;
  r = Math.min(Math.max(0, r), 1);
  g = Math.min(Math.max(0, g), 1);
  b = Math.min(Math.max(0, b), 1);
  return [r * 255, g * 255, b * 255];
};

convert.xyz.lab = function (xyz) {
  var x = xyz[0];
  var y = xyz[1];
  var z = xyz[2];
  var l;
  var a;
  var b;
  x /= 95.047;
  y /= 100;
  z /= 108.883;
  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
  l = 116 * y - 16;
  a = 500 * (x - y);
  b = 200 * (y - z);
  return [l, a, b];
};

convert.lab.xyz = function (lab) {
  var l = lab[0];
  var a = lab[1];
  var b = lab[2];
  var x;
  var y;
  var z;
  y = (l + 16) / 116;
  x = a / 500 + y;
  z = y - b / 200;
  var y2 = Math.pow(y, 3);
  var x2 = Math.pow(x, 3);
  var z2 = Math.pow(z, 3);
  y = y2 > 0.008856 ? y2 : (y - 16 / 116) / 7.787;
  x = x2 > 0.008856 ? x2 : (x - 16 / 116) / 7.787;
  z = z2 > 0.008856 ? z2 : (z - 16 / 116) / 7.787;
  x *= 95.047;
  y *= 100;
  z *= 108.883;
  return [x, y, z];
};

convert.lab.lch = function (lab) {
  var l = lab[0];
  var a = lab[1];
  var b = lab[2];
  var hr;
  var h;
  var c;
  hr = Math.atan2(b, a);
  h = hr * 360 / 2 / Math.PI;

  if (h < 0) {
    h += 360;
  }

  c = Math.sqrt(a * a + b * b);
  return [l, c, h];
};

convert.lch.lab = function (lch) {
  var l = lch[0];
  var c = lch[1];
  var h = lch[2];
  var a;
  var b;
  var hr;
  hr = h / 360 * 2 * Math.PI;
  a = c * Math.cos(hr);
  b = c * Math.sin(hr);
  return [l, a, b];
};

convert.rgb.ansi16 = function (args) {
  var r = args[0];
  var g = args[1];
  var b = args[2];
  var value = 1 in arguments ? arguments[1] : convert.rgb.hsv(args)[2]; // hsv -> ansi16 optimization

  value = Math.round(value / 50);

  if (value === 0) {
    return 30;
  }

  var ansi = 30 + (Math.round(b / 255) << 2 | Math.round(g / 255) << 1 | Math.round(r / 255));

  if (value === 2) {
    ansi += 60;
  }

  return ansi;
};

convert.hsv.ansi16 = function (args) {
  // optimization here; we already know the value and don't need to get
  // it converted for us.
  return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
};

convert.rgb.ansi256 = function (args) {
  var r = args[0];
  var g = args[1];
  var b = args[2]; // we use the extended greyscale palette here, with the exception of
  // black and white. normal palette only has 4 greyscale shades.

  if (r === g && g === b) {
    if (r < 8) {
      return 16;
    }

    if (r > 248) {
      return 231;
    }

    return Math.round((r - 8) / 247 * 24) + 232;
  }

  var ansi = 16 + 36 * Math.round(r / 255 * 5) + 6 * Math.round(g / 255 * 5) + Math.round(b / 255 * 5);
  return ansi;
};

convert.ansi16.rgb = function (args) {
  var color = args % 10; // handle greyscale

  if (color === 0 || color === 7) {
    if (args > 50) {
      color += 3.5;
    }

    color = color / 10.5 * 255;
    return [color, color, color];
  }

  var mult = (~~(args > 50) + 1) * 0.5;
  var r = (color & 1) * mult * 255;
  var g = (color >> 1 & 1) * mult * 255;
  var b = (color >> 2 & 1) * mult * 255;
  return [r, g, b];
};

convert.ansi256.rgb = function (args) {
  // handle greyscale
  if (args >= 232) {
    var c = (args - 232) * 10 + 8;
    return [c, c, c];
  }

  args -= 16;
  var rem;
  var r = Math.floor(args / 36) / 5 * 255;
  var g = Math.floor((rem = args % 36) / 6) / 5 * 255;
  var b = rem % 6 / 5 * 255;
  return [r, g, b];
};

convert.rgb.hex = function (args) {
  var integer = ((Math.round(args[0]) & 0xFF) << 16) + ((Math.round(args[1]) & 0xFF) << 8) + (Math.round(args[2]) & 0xFF);
  var string = integer.toString(16).toUpperCase();
  return '000000'.substring(string.length) + string;
};

convert.hex.rgb = function (args) {
  var match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);

  if (!match) {
    return [0, 0, 0];
  }

  var colorString = match[0];

  if (match[0].length === 3) {
    colorString = colorString.split('').map(function (char) {
      return char + char;
    }).join('');
  }

  var integer = parseInt(colorString, 16);
  var r = integer >> 16 & 0xFF;
  var g = integer >> 8 & 0xFF;
  var b = integer & 0xFF;
  return [r, g, b];
};

convert.rgb.hcg = function (rgb) {
  var r = rgb[0] / 255;
  var g = rgb[1] / 255;
  var b = rgb[2] / 255;
  var max = Math.max(Math.max(r, g), b);
  var min = Math.min(Math.min(r, g), b);
  var chroma = max - min;
  var grayscale;
  var hue;

  if (chroma < 1) {
    grayscale = min / (1 - chroma);
  } else {
    grayscale = 0;
  }

  if (chroma <= 0) {
    hue = 0;
  } else if (max === r) {
    hue = (g - b) / chroma % 6;
  } else if (max === g) {
    hue = 2 + (b - r) / chroma;
  } else {
    hue = 4 + (r - g) / chroma + 4;
  }

  hue /= 6;
  hue %= 1;
  return [hue * 360, chroma * 100, grayscale * 100];
};

convert.hsl.hcg = function (hsl) {
  var s = hsl[1] / 100;
  var l = hsl[2] / 100;
  var c = 1;
  var f = 0;

  if (l < 0.5) {
    c = 2.0 * s * l;
  } else {
    c = 2.0 * s * (1.0 - l);
  }

  if (c < 1.0) {
    f = (l - 0.5 * c) / (1.0 - c);
  }

  return [hsl[0], c * 100, f * 100];
};

convert.hsv.hcg = function (hsv) {
  var s = hsv[1] / 100;
  var v = hsv[2] / 100;
  var c = s * v;
  var f = 0;

  if (c < 1.0) {
    f = (v - c) / (1 - c);
  }

  return [hsv[0], c * 100, f * 100];
};

convert.hcg.rgb = function (hcg) {
  var h = hcg[0] / 360;
  var c = hcg[1] / 100;
  var g = hcg[2] / 100;

  if (c === 0.0) {
    return [g * 255, g * 255, g * 255];
  }

  var pure = [0, 0, 0];
  var hi = h % 1 * 6;
  var v = hi % 1;
  var w = 1 - v;
  var mg = 0;

  switch (Math.floor(hi)) {
    case 0:
      pure[0] = 1;
      pure[1] = v;
      pure[2] = 0;
      break;

    case 1:
      pure[0] = w;
      pure[1] = 1;
      pure[2] = 0;
      break;

    case 2:
      pure[0] = 0;
      pure[1] = 1;
      pure[2] = v;
      break;

    case 3:
      pure[0] = 0;
      pure[1] = w;
      pure[2] = 1;
      break;

    case 4:
      pure[0] = v;
      pure[1] = 0;
      pure[2] = 1;
      break;

    default:
      pure[0] = 1;
      pure[1] = 0;
      pure[2] = w;
  }

  mg = (1.0 - c) * g;
  return [(c * pure[0] + mg) * 255, (c * pure[1] + mg) * 255, (c * pure[2] + mg) * 255];
};

convert.hcg.hsv = function (hcg) {
  var c = hcg[1] / 100;
  var g = hcg[2] / 100;
  var v = c + g * (1.0 - c);
  var f = 0;

  if (v > 0.0) {
    f = c / v;
  }

  return [hcg[0], f * 100, v * 100];
};

convert.hcg.hsl = function (hcg) {
  var c = hcg[1] / 100;
  var g = hcg[2] / 100;
  var l = g * (1.0 - c) + 0.5 * c;
  var s = 0;

  if (l > 0.0 && l < 0.5) {
    s = c / (2 * l);
  } else if (l >= 0.5 && l < 1.0) {
    s = c / (2 * (1 - l));
  }

  return [hcg[0], s * 100, l * 100];
};

convert.hcg.hwb = function (hcg) {
  var c = hcg[1] / 100;
  var g = hcg[2] / 100;
  var v = c + g * (1.0 - c);
  return [hcg[0], (v - c) * 100, (1 - v) * 100];
};

convert.hwb.hcg = function (hwb) {
  var w = hwb[1] / 100;
  var b = hwb[2] / 100;
  var v = 1 - b;
  var c = v - w;
  var g = 0;

  if (c < 1) {
    g = (v - c) / (1 - c);
  }

  return [hwb[0], c * 100, g * 100];
};

convert.apple.rgb = function (apple) {
  return [apple[0] / 65535 * 255, apple[1] / 65535 * 255, apple[2] / 65535 * 255];
};

convert.rgb.apple = function (rgb) {
  return [rgb[0] / 255 * 65535, rgb[1] / 255 * 65535, rgb[2] / 255 * 65535];
};

convert.gray.rgb = function (args) {
  return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
};

convert.gray.hsl = convert.gray.hsv = function (args) {
  return [0, 0, args[0]];
};

convert.gray.hwb = function (gray) {
  return [0, 100, gray[0]];
};

convert.gray.cmyk = function (gray) {
  return [0, 0, 0, gray[0]];
};

convert.gray.lab = function (gray) {
  return [gray[0], 0, 0];
};

convert.gray.hex = function (gray) {
  var val = Math.round(gray[0] / 100 * 255) & 0xFF;
  var integer = (val << 16) + (val << 8) + val;
  var string = integer.toString(16).toUpperCase();
  return '000000'.substring(string.length) + string;
};

convert.rgb.gray = function (rgb) {
  var val = (rgb[0] + rgb[1] + rgb[2]) / 3;
  return [val / 255 * 100];
};

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopDefault(ex) {
  return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
}

var webpack = _interopDefault(__webpack_require__(5));

var tapable = __webpack_require__(6);

var webpackSources = __webpack_require__(19);

var chalk = _interopDefault(__webpack_require__(20));

var path = _interopDefault(__webpack_require__(31));

var fs = _interopDefault(__webpack_require__(32));
/**
 * autodll-webpack-plugin
 *
 * Auto make webpack DLL
 *
 * 
 */


class AutoDllPlugin extends tapable.Tapable {
  constructor(options = {}) {
    super();
    this.depkey = options.depkey || 'dependencies';
    this.name = options.name || 'vendor';
    this.manifest = options.manifest || this.name + '.manifest.json';
    this.output = options.output || '.dll';

    this.ignore = options.ignore || (() => true);

    this.cachename = options.cachename || this.name + '.cache.json';
    this.debug = process.env.DEBUG || false;
    this.description = 'AutoDllPlugin';
    this.flag = chalk.blue('[AutoDLL]');
    this.hooks = {
      beforeBuild: new tapable.SyncHook(),
      build: new tapable.SyncHook(),
      afterBuild: new tapable.SyncHook()
    };
  }

  apply(compiler) {
    this.compiler = compiler;
    this.context = compiler.context;
    this.webpackOptions = compiler.options;
    this.pkgpath = path.resolve(this.context, 'package.json');
    this.deps = this.resolve();
    /**
     * inject pkg to entry, let watch it
     */

    compiler.options.entry = this.injectEntry();
    this.webpack4 = Boolean(compiler.hooks);

    if (this.webpack4) {
      /**
       * register webpack `run` hook, assert watch mode
       */
      compiler.hooks.run.tapAsync(this.description, this.assertWarning.bind(this));
      /**
       * register webpack `watchRun` hook
       */

      compiler.hooks.watchRun.tapAsync(this.description, this.plugin.bind(this));
      /**
       * register webpack `afterPlugins` hook
       */

      compiler.hooks.afterPlugins.tap(this.description, this.applyRefPlugin.bind(this));
      /**
       * register webpack `compilation` hook, for html-webpack-plugin
       */

      compiler.hooks.compilation.tap(this.description, this.applyRefPlugin.bind(this));
    } else {
      compiler.plugin('run', this.assertWarning.bind(this));

      if (!this.runWithoutWatch) {
        compiler.plugin('watch-run', this.plugin.bind(this));
        compiler.plugin('after-plugins', this.applyRefPlugin.bind(this));
        compiler.plugin('compilation', this.applyHtmlPlugin.bind(this));
      }
    }
  }
  /**
   * main process
   */


  plugin(compiler, callback) {
    /**
     * check cache before make dll.
     */
    const timestamp = compiler.contextTimestamps && compiler.contextTimestamps[this.pkgpath];

    if (!timestamp) {
      /**
       * first run, check the cache was exists
       */
      const result = this.check();

      if (!result) {
        this.log('%s, generate new DLL', null === result ? 'Cache not found' : 'Cache was out of date');
        webpack(this.make()).run((err, data) => {
          if (err) {
            callback(err, null);
            return;
          }

          this.log('Create DLL successed');

          if (this.debug) {
            console.log(this.renderDeps(), '\n'); // console.log(data.toString())
          }
          /**
           * update manifest file mtimes
           *
           * @link webpack/watchpack#25
           */


          const manifest = path.resolve(this.context, this.output, this.manifest);
          const now = Date.now() / 1000 - 10;
          fs.utimesSync(manifest, now, now);
          callback(null, null);
        });
      } else {
        this.log('Cache was found');
        callback(null, null);
      }
    } else if (timestamp && !this.timestamp) {
      /**
       * this case used for save timestamp, just hack
       */
      this.timestamp = timestamp;
      callback(null, null);
    } else if (this.timestamp !== timestamp) {
      /**
       * refetch deps
       */
      this.deps = this.resolve();
      /**
       * recheck
       */

      const result = this.check();

      if (!result) {
        /**
         * should rebuild DLL
         */
        this.log('Detected deps was update. Rebuild DLL');
        webpack(this.make()).run((err, data) => {
          if (err) {
            callback(err, null);
            return;
          }

          this.log('Create DLL successed');

          if (this.debug) {
            console.log(this.renderDeps(), '\n'); // console.log(data.toString())
          }

          this.timestamp = timestamp;
          callback(null, null);
        });
      } else {
        /**
         * the deps not changed, no need to rebuild
         */
        this.timestamp = timestamp;
        callback(null, null);
      }
    } else {
      /**
       * no update
       */
      this.log('No update');
      callback(null, null);
    }
  }
  /**
   * log
   */


  log(str, ...args) {
    if (this.debug) {
      console.log.apply(console, ['%s ' + str, this.flag, ...args]);
    }
  }
  /**
   * Inject pkg to entry, let watchable
   */


  injectEntry() {
    const entry = this.webpackOptions.entry;

    if (typeof entry === 'string') {
      return [this.pkgpath, entry];
    } else if (Array.isArray(entry)) {
      entry.unshift(this.pkgpath);
      return entry;
    } else {
      return entry;
    }
    /**
     * @TODO hold other type.
     */

  }
  /**
   * call webpack.DllReferencePlugin
   */


  applyRefPlugin(compiler) {
    new webpack.DllReferencePlugin({
      context: this.context,
      manifest: path.resolve(this.context, this.output, this.manifest)
    }).apply(compiler);
  }
  /**
   * push vendor.js to html scripts assets.
   */


  applyHtmlPlugin(compilation) {
    const mfs = this.compiler.outputFileSystem;
    const isMemoryFS = Boolean(mfs.data);

    if (isMemoryFS) {
      const outputPath = this.webpackOptions.output.path;
      const fileName = this.name + '.js';
      const dllFileRelativePath = path.resolve(outputPath, fileName);
      const dllFilePath = path.resolve(this.context, this.output, fileName);
      mfs.mkdirpSync(outputPath);
      mfs.writeFileSync(dllFileRelativePath, fs.readFileSync(dllFilePath, 'utf-8'));
      /**
       * apply to HtmlWebpackPlugin
       */

      if (this.webpack4 && compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration) {
        compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapAsync(this.description, (data, callback) => {
          data.assets.js.unshift(fileName);
          callback(null, data);
        });
      } else {
        const htmlPluginHook = 'html-webpack-plugin-before-html-generation';
        compilation.plugin(htmlPluginHook, (data, callback) => {
          data.assets.js.unshift('/' + fileName);
          callback(null, data);
        });
      }
    }
  }

  assertWarning(compiler, callback) {
    this.log('The plugin only works on watch mode, skip generate dll.');
    this.runWithoutWatch = true;
    callback(null);
  }
  /**
   * render packaged deps.
   */


  renderDeps() {
    return this.deps.map(dep => '  - ' + dep).join('\n');
  }
  /**
   * check for dependencies was updated.
   */


  check() {
    const cachepath = path.resolve(this.context, this.output, this.cachename);

    try {
      const cache = JSON.parse(fs.readFileSync(cachepath, 'utf-8')).sort();
      const cachelen = cache.length;
      this.log('Check cache "%s"', cachepath);
      /**
       * compare cache and dependencies
       */

      const deps = this.deps.sort();
      const depslen = deps.length;
      /**
       * @TODO if depslen less than cachelen, maybe also not rebuild at watching
       * it will build when next start up. so, the cache just includes deps was
       * ok
       */

      if (cachelen !== depslen) return false;
      /**
       * two array has the same length. compare each other.
       */

      for (let i = 0; i < cachelen; i++) {
        if (cache[i] !== deps[i]) return false;
      }

      return true;
    } catch (erro) {
      /**
       * can't find cache, should create a new one.
       */
      return null;
    }
  }
  /**
   * write cache to vendor.cache.json
   */


  cache() {
    const bundles = this.deps;
    const cachename = this.cachename;
    const webpack4 = this.webpack4;
    return class WriteCachePlugin {
      constructor() {
        this.description = 'WriteDllCachePlugin';
      }

      apply(compiler) {
        if (webpack4) {
          /**
           * register `emit` hook, generate cache file
           */
          compiler.hooks.emit.tap(this.description, compilation => {
            compilation.assets[cachename] = new webpackSources.RawSource(JSON.stringify(bundles));
          });
        } else {
          compiler.plugin('emit', (compilation, callback) => {
            compilation.assets[cachename] = new webpackSources.RawSource(JSON.stringify(bundles));
            callback(null, null);
          });
        }
      }

    };
  }
  /**
   * make dll use webpack
   */


  make() {
    const WriteCachePlugin = this.cache();
    const options = {
      entry: {
        [this.name]: this.deps
      },
      output: {
        path: path.resolve(this.context, this.output),
        filename: '[name].js',
        library: '[name]'
      },
      context: this.context,
      devtool: 'none',
      plugins: [new webpack.DllPlugin({
        context: this.context,
        path: path.resolve(this.context, this.output, this.manifest),
        name: '[name]'
      }), new WriteCachePlugin()]
    };

    if (this.webpack4) {
      options.mode = 'development';
    }

    return options;
  }
  /**
   * resolve package.json, get deps
   */


  resolve() {
    /**
     * @TODO package.json was not found will throw error
     * if deps was undefined or empty, need not build at first
     */
    const pkgconfig = JSON.parse(fs.readFileSync(this.pkgpath, 'utf-8'));
    return Object.keys(pkgconfig[this.depkey]).filter(this.ignore);
  }

}

exports['default'] = AutoDllPlugin;

/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = require("webpack");

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/


exports.__esModule = true;
exports.Tapable = __webpack_require__(7);
exports.SyncHook = __webpack_require__(9);
exports.SyncBailHook = __webpack_require__(2);
exports.SyncWaterfallHook = __webpack_require__(10);
exports.SyncLoopHook = __webpack_require__(11);
exports.AsyncParallelHook = __webpack_require__(12);
exports.AsyncParallelBailHook = __webpack_require__(13);
exports.AsyncSeriesHook = __webpack_require__(14);
exports.AsyncSeriesBailHook = __webpack_require__(15);
exports.AsyncSeriesWaterfallHook = __webpack_require__(16);
exports.HookMap = __webpack_require__(17);
exports.MultiHook = __webpack_require__(18);

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/


const util = __webpack_require__(8);

const SyncBailHook = __webpack_require__(2);

function Tapable() {
  this._pluginCompat = new SyncBailHook(["options"]);

  this._pluginCompat.tap({
    name: "Tapable camelCase",
    stage: 100
  }, options => {
    options.names.add(options.name.replace(/[- ]([a-z])/g, str => str.substr(1).toUpperCase()));
  });

  this._pluginCompat.tap({
    name: "Tapable this.hooks",
    stage: 200
  }, options => {
    let hook;

    for (const name of options.names) {
      hook = this.hooks[name];

      if (hook !== undefined) {
        break;
      }
    }

    if (hook !== undefined) {
      const tapOpt = {
        name: options.fn.name || "unnamed compat plugin",
        stage: options.stage || 0
      };
      if (options.async) hook.tapAsync(tapOpt, options.fn);else hook.tap(tapOpt, options.fn);
      return true;
    }
  });
}

module.exports = Tapable;

Tapable.addCompatLayer = function addCompatLayer(instance) {
  Tapable.call(instance);
  instance.plugin = Tapable.prototype.plugin;
  instance.apply = Tapable.prototype.apply;
};

Tapable.prototype.plugin = util.deprecate(function plugin(name, fn) {
  if (Array.isArray(name)) {
    name.forEach(function (name) {
      this.plugin(name, fn);
    }, this);
    return;
  }

  const result = this._pluginCompat.call({
    name: name,
    fn: fn,
    names: new Set([name])
  });

  if (!result) {
    throw new Error(`Plugin could not be registered at '${name}'. Hook was not found.\n` + "BREAKING CHANGE: There need to exist a hook at 'this.hooks'. " + "To create a compatiblity layer for this hook, hook into 'this._pluginCompat'.");
  }
}, "Tapable.plugin is deprecated. Use new API on `.hooks` instead");
Tapable.prototype.apply = util.deprecate(function apply() {
  for (var i = 0; i < arguments.length; i++) {
    arguments[i].apply(this);
  }
}, "Tapable.apply is deprecated. Call apply on the plugin directly instead");

/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = require("util");

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/


const Hook = __webpack_require__(0);

const HookCodeFactory = __webpack_require__(1);

class SyncHookCodeFactory extends HookCodeFactory {
  content({
    onError,
    onResult,
    onDone,
    rethrowIfPossible
  }) {
    return this.callTapsSeries({
      onError: (i, err) => onError(err),
      onDone,
      rethrowIfPossible
    });
  }

}

const factory = new SyncHookCodeFactory();

class SyncHook extends Hook {
  tapAsync() {
    throw new Error("tapAsync is not supported on a SyncHook");
  }

  tapPromise() {
    throw new Error("tapPromise is not supported on a SyncHook");
  }

  compile(options) {
    factory.setup(this, options);
    return factory.create(options);
  }

}

module.exports = SyncHook;

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/


const Hook = __webpack_require__(0);

const HookCodeFactory = __webpack_require__(1);

class SyncWaterfallHookCodeFactory extends HookCodeFactory {
  content({
    onError,
    onResult,
    onDone,
    rethrowIfPossible
  }) {
    return this.callTapsSeries({
      onError: (i, err) => onError(err),
      onResult: (i, result, next) => {
        let code = "";
        code += `if(${result} !== undefined) {\n`;
        code += `${this._args[0]} = ${result};\n`;
        code += `}\n`;
        code += next();
        return code;
      },
      onDone: () => onResult(this._args[0]),
      rethrowIfPossible
    });
  }

}

const factory = new SyncWaterfallHookCodeFactory();

class SyncWaterfallHook extends Hook {
  constructor(args) {
    super(args);
    if (args.length < 1) throw new Error("Waterfall hooks must have at least one argument");
  }

  tapAsync() {
    throw new Error("tapAsync is not supported on a SyncWaterfallHook");
  }

  tapPromise() {
    throw new Error("tapPromise is not supported on a SyncWaterfallHook");
  }

  compile(options) {
    factory.setup(this, options);
    return factory.create(options);
  }

}

module.exports = SyncWaterfallHook;

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/


const Hook = __webpack_require__(0);

const HookCodeFactory = __webpack_require__(1);

class SyncLoopHookCodeFactory extends HookCodeFactory {
  content({
    onError,
    onResult,
    onDone,
    rethrowIfPossible
  }) {
    return this.callTapsLooping({
      onError: (i, err) => onError(err),
      onDone,
      rethrowIfPossible
    });
  }

}

const factory = new SyncLoopHookCodeFactory();

class SyncLoopHook extends Hook {
  tapAsync() {
    throw new Error("tapAsync is not supported on a SyncLoopHook");
  }

  tapPromise() {
    throw new Error("tapPromise is not supported on a SyncLoopHook");
  }

  compile(options) {
    factory.setup(this, options);
    return factory.create(options);
  }

}

module.exports = SyncLoopHook;

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/


const Hook = __webpack_require__(0);

const HookCodeFactory = __webpack_require__(1);

class AsyncParallelHookCodeFactory extends HookCodeFactory {
  content({
    onError,
    onDone
  }) {
    return this.callTapsParallel({
      onError: (i, err, done, doneBreak) => onError(err) + doneBreak(true),
      onDone
    });
  }

}

const factory = new AsyncParallelHookCodeFactory();

class AsyncParallelHook extends Hook {
  constructor(args) {
    super(args);
    this.call = this._call = undefined;
  }

  compile(options) {
    factory.setup(this, options);
    return factory.create(options);
  }

}

module.exports = AsyncParallelHook;

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/


const Hook = __webpack_require__(0);

const HookCodeFactory = __webpack_require__(1);

class AsyncParallelBailHookCodeFactory extends HookCodeFactory {
  content({
    onError,
    onResult,
    onDone
  }) {
    let code = "";
    code += `var _results = new Array(${this.options.taps.length});\n`;
    code += "var _checkDone = () => {\n";
    code += "for(var i = 0; i < _results.length; i++) {\n";
    code += "var item = _results[i];\n";
    code += "if(item === undefined) return false;\n";
    code += "if(item.result !== undefined) {\n";
    code += onResult("item.result");
    code += "return true;\n";
    code += "}\n";
    code += "if(item.error) {\n";
    code += onError("item.error");
    code += "return true;\n";
    code += "}\n";
    code += "}\n";
    code += "return false;\n";
    code += "}\n";
    code += this.callTapsParallel({
      onError: (i, err, done, doneBreak) => {
        let code = "";
        code += `if(${i} < _results.length && ((_results.length = ${i + 1}), (_results[${i}] = { error: ${err} }), _checkDone())) {\n`;
        code += doneBreak(true);
        code += "} else {\n";
        code += done();
        code += "}\n";
        return code;
      },
      onResult: (i, result, done, doneBreak) => {
        let code = "";
        code += `if(${i} < _results.length && (${result} !== undefined && (_results.length = ${i + 1}), (_results[${i}] = { result: ${result} }), _checkDone())) {\n`;
        code += doneBreak(true);
        code += "} else {\n";
        code += done();
        code += "}\n";
        return code;
      },
      onTap: (i, run, done, doneBreak) => {
        let code = "";

        if (i > 0) {
          code += `if(${i} >= _results.length) {\n`;
          code += done();
          code += "} else {\n";
        }

        code += run();
        if (i > 0) code += "}\n";
        return code;
      },
      onDone
    });
    return code;
  }

}

const factory = new AsyncParallelBailHookCodeFactory();

class AsyncParallelBailHook extends Hook {
  constructor(args) {
    super(args);
    this.call = this._call = undefined;
  }

  compile(options) {
    factory.setup(this, options);
    return factory.create(options);
  }

}

module.exports = AsyncParallelBailHook;

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/


const Hook = __webpack_require__(0);

const HookCodeFactory = __webpack_require__(1);

class AsyncSeriesHookCodeFactory extends HookCodeFactory {
  content({
    onError,
    onDone
  }) {
    return this.callTapsSeries({
      onError: (i, err, next, doneBreak) => onError(err) + doneBreak(true),
      onDone
    });
  }

}

const factory = new AsyncSeriesHookCodeFactory();

class AsyncSeriesHook extends Hook {
  constructor(args) {
    super(args);
    this.call = this._call = undefined;
  }

  compile(options) {
    factory.setup(this, options);
    return factory.create(options);
  }

}

module.exports = AsyncSeriesHook;

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/


const Hook = __webpack_require__(0);

const HookCodeFactory = __webpack_require__(1);

class AsyncSeriesBailHookCodeFactory extends HookCodeFactory {
  content({
    onError,
    onResult,
    onDone
  }) {
    return this.callTapsSeries({
      onError: (i, err, next, doneBreak) => onError(err) + doneBreak(true),
      onResult: (i, result, next) => `if(${result} !== undefined) {\n${onResult(result)};\n} else {\n${next()}}\n`,
      onDone
    });
  }

}

const factory = new AsyncSeriesBailHookCodeFactory();

class AsyncSeriesBailHook extends Hook {
  constructor(args) {
    super(args);
    this.call = this._call = undefined;
  }

  compile(options) {
    factory.setup(this, options);
    return factory.create(options);
  }

}

module.exports = AsyncSeriesBailHook;

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/


const Hook = __webpack_require__(0);

const HookCodeFactory = __webpack_require__(1);

class AsyncSeriesWaterfallHookCodeFactory extends HookCodeFactory {
  content({
    onError,
    onResult,
    onDone
  }) {
    return this.callTapsSeries({
      onError: (i, err, next, doneBreak) => onError(err) + doneBreak(true),
      onResult: (i, result, next) => {
        let code = "";
        code += `if(${result} !== undefined) {\n`;
        code += `${this._args[0]} = ${result};\n`;
        code += `}\n`;
        code += next();
        return code;
      },
      onDone: () => onResult(this._args[0])
    });
  }

}

const factory = new AsyncSeriesWaterfallHookCodeFactory();

class AsyncSeriesWaterfallHook extends Hook {
  constructor(args) {
    super(args);
    if (args.length < 1) throw new Error("Waterfall hooks must have at least one argument");
    this.call = this._call = undefined;
  }

  compile(options) {
    factory.setup(this, options);
    return factory.create(options);
  }

}

module.exports = AsyncSeriesWaterfallHook;

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/


class HookMap {
  constructor(factory) {
    this._map = new Map();
    this._factory = factory;
    this._interceptors = [];
  }

  get(key) {
    return this._map.get(key);
  }

  for(key) {
    const hook = this.get(key);

    if (hook !== undefined) {
      return hook;
    }

    let newHook = this._factory(key);

    const interceptors = this._interceptors;

    for (let i = 0; i < interceptors.length; i++) {
      newHook = interceptors[i].factory(key, newHook);
    }

    this._map.set(key, newHook);

    return newHook;
  }

  intercept(interceptor) {
    this._interceptors.push(Object.assign({
      factory: (key, hook) => hook
    }, interceptor));
  }

  tap(key, options, fn) {
    return this.for(key).tap(options, fn);
  }

  tapAsync(key, options, fn) {
    return this.for(key).tapAsync(options, fn);
  }

  tapPromise(key, options, fn) {
    return this.for(key).tapPromise(options, fn);
  }

}

module.exports = HookMap;

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/


const Hook = __webpack_require__(0);

class MultiHook {
  constructor(hooks) {
    this.hooks = hooks;
  }

  tap(options, fn) {
    for (const hook of this.hooks) {
      hook.tap(options, fn);
    }
  }

  tapAsync(options, fn) {
    for (const hook of this.hooks) {
      hook.tapAsync(options, fn);
    }
  }

  tapPromise(options, fn) {
    for (const hook of this.hooks) {
      hook.tapPromise(options, fn);
    }
  }

  isUsed() {
    for (const hook of this.hooks) {
      if (hook.isUsed()) return true;
    }

    return false;
  }

  intercept(interceptor) {
    for (const hook of this.hooks) {
      hook.intercept(interceptor);
    }
  }

  withOptions(options) {
    return new MultiHook(this.hooks.map(h => h.withOptions(options)));
  }

}

module.exports = MultiHook;

/***/ }),
/* 19 */
/***/ (function(module, exports) {

module.exports = require("webpack-sources");

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const escapeStringRegexp = __webpack_require__(21);

const ansiStyles = __webpack_require__(22);

const supportsColor = __webpack_require__(27);

const template = __webpack_require__(30);

const isSimpleWindowsTerm = process.platform === 'win32' && !(process.env.TERM || '').toLowerCase().startsWith('xterm'); // `supportsColor.level` → `ansiStyles.color[name]` mapping

const levelMapping = ['ansi', 'ansi', 'ansi256', 'ansi16m']; // `color-convert` models to exclude from the Chalk API due to conflicts and such

const skipModels = new Set(['gray']);
const styles = Object.create(null);

function applyOptions(obj, options) {
  options = options || {}; // Detect level if not set manually

  const scLevel = supportsColor ? supportsColor.level : 0;
  obj.level = options.level === undefined ? scLevel : options.level;
  obj.enabled = 'enabled' in options ? options.enabled : obj.level > 0;
}

function Chalk(options) {
  // We check for this.template here since calling `chalk.constructor()`
  // by itself will have a `this` of a previously constructed chalk object
  if (!this || !(this instanceof Chalk) || this.template) {
    const chalk = {};
    applyOptions(chalk, options);

    chalk.template = function () {
      const args = [].slice.call(arguments);
      return chalkTag.apply(null, [chalk.template].concat(args));
    };

    Object.setPrototypeOf(chalk, Chalk.prototype);
    Object.setPrototypeOf(chalk.template, chalk);
    chalk.template.constructor = Chalk;
    return chalk.template;
  }

  applyOptions(this, options);
} // Use bright blue on Windows as the normal blue color is illegible


if (isSimpleWindowsTerm) {
  ansiStyles.blue.open = '\u001B[94m';
}

for (const key of Object.keys(ansiStyles)) {
  ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');
  styles[key] = {
    get() {
      const codes = ansiStyles[key];
      return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, key);
    }

  };
}

styles.visible = {
  get() {
    return build.call(this, this._styles || [], true, 'visible');
  }

};
ansiStyles.color.closeRe = new RegExp(escapeStringRegexp(ansiStyles.color.close), 'g');

for (const model of Object.keys(ansiStyles.color.ansi)) {
  if (skipModels.has(model)) {
    continue;
  }

  styles[model] = {
    get() {
      const level = this.level;
      return function () {
        const open = ansiStyles.color[levelMapping[level]][model].apply(null, arguments);
        const codes = {
          open,
          close: ansiStyles.color.close,
          closeRe: ansiStyles.color.closeRe
        };
        return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
      };
    }

  };
}

ansiStyles.bgColor.closeRe = new RegExp(escapeStringRegexp(ansiStyles.bgColor.close), 'g');

for (const model of Object.keys(ansiStyles.bgColor.ansi)) {
  if (skipModels.has(model)) {
    continue;
  }

  const bgModel = 'bg' + model[0].toUpperCase() + model.slice(1);
  styles[bgModel] = {
    get() {
      const level = this.level;
      return function () {
        const open = ansiStyles.bgColor[levelMapping[level]][model].apply(null, arguments);
        const codes = {
          open,
          close: ansiStyles.bgColor.close,
          closeRe: ansiStyles.bgColor.closeRe
        };
        return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
      };
    }

  };
}

const proto = Object.defineProperties(() => {}, styles);

function build(_styles, _empty, key) {
  const builder = function () {
    return applyStyle.apply(builder, arguments);
  };

  builder._styles = _styles;
  builder._empty = _empty;
  const self = this;
  Object.defineProperty(builder, 'level', {
    enumerable: true,

    get() {
      return self.level;
    },

    set(level) {
      self.level = level;
    }

  });
  Object.defineProperty(builder, 'enabled', {
    enumerable: true,

    get() {
      return self.enabled;
    },

    set(enabled) {
      self.enabled = enabled;
    }

  }); // See below for fix regarding invisible grey/dim combination on Windows

  builder.hasGrey = this.hasGrey || key === 'gray' || key === 'grey'; // `__proto__` is used because we must return a function, but there is
  // no way to create a function with a different prototype

  builder.__proto__ = proto; // eslint-disable-line no-proto

  return builder;
}

function applyStyle() {
  // Support varags, but simply cast to string in case there's only one arg
  const args = arguments;
  const argsLen = args.length;
  let str = String(arguments[0]);

  if (argsLen === 0) {
    return '';
  }

  if (argsLen > 1) {
    // Don't slice `arguments`, it prevents V8 optimizations
    for (let a = 1; a < argsLen; a++) {
      str += ' ' + args[a];
    }
  }

  if (!this.enabled || this.level <= 0 || !str) {
    return this._empty ? '' : str;
  } // Turns out that on Windows dimmed gray text becomes invisible in cmd.exe,
  // see https://github.com/chalk/chalk/issues/58
  // If we're on Windows and we're dealing with a gray color, temporarily make 'dim' a noop.


  const originalDim = ansiStyles.dim.open;

  if (isSimpleWindowsTerm && this.hasGrey) {
    ansiStyles.dim.open = '';
  }

  for (const code of this._styles.slice().reverse()) {
    // Replace any instances already present with a re-opening code
    // otherwise only the part of the string until said closing code
    // will be colored, and the rest will simply be 'plain'.
    str = code.open + str.replace(code.closeRe, code.open) + code.close; // Close the styling before a linebreak and reopen
    // after next line to fix a bleed issue on macOS
    // https://github.com/chalk/chalk/pull/92

    str = str.replace(/\r?\n/g, `${code.close}$&${code.open}`);
  } // Reset the original `dim` if we changed it to work around the Windows dimmed gray issue


  ansiStyles.dim.open = originalDim;
  return str;
}

function chalkTag(chalk, strings) {
  if (!Array.isArray(strings)) {
    // If chalk() was called by itself or with a string,
    // return the string itself as a string.
    return [].slice.call(arguments, 1).join(' ');
  }

  const args = [].slice.call(arguments, 2);
  const parts = [strings.raw[0]];

  for (let i = 1; i < strings.length; i++) {
    parts.push(String(args[i - 1]).replace(/[{}\\]/g, '\\$&'));
    parts.push(String(strings.raw[i]));
  }

  return template(chalk, parts.join(''));
}

Object.defineProperties(Chalk.prototype, styles);
module.exports = Chalk(); // eslint-disable-line new-cap

module.exports.supportsColor = supportsColor;
module.exports.default = module.exports; // For TypeScript

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

module.exports = function (str) {
  if (typeof str !== 'string') {
    throw new TypeError('Expected a string');
  }

  return str.replace(matchOperatorsRe, '\\$&');
};

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(module) {

const colorConvert = __webpack_require__(24);

const wrapAnsi16 = (fn, offset) => function () {
  const code = fn.apply(colorConvert, arguments);
  return `\u001B[${code + offset}m`;
};

const wrapAnsi256 = (fn, offset) => function () {
  const code = fn.apply(colorConvert, arguments);
  return `\u001B[${38 + offset};5;${code}m`;
};

const wrapAnsi16m = (fn, offset) => function () {
  const rgb = fn.apply(colorConvert, arguments);
  return `\u001B[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
};

function assembleStyles() {
  const codes = new Map();
  const styles = {
    modifier: {
      reset: [0, 0],
      // 21 isn't widely supported and 22 does the same thing
      bold: [1, 22],
      dim: [2, 22],
      italic: [3, 23],
      underline: [4, 24],
      inverse: [7, 27],
      hidden: [8, 28],
      strikethrough: [9, 29]
    },
    color: {
      black: [30, 39],
      red: [31, 39],
      green: [32, 39],
      yellow: [33, 39],
      blue: [34, 39],
      magenta: [35, 39],
      cyan: [36, 39],
      white: [37, 39],
      gray: [90, 39],
      // Bright color
      redBright: [91, 39],
      greenBright: [92, 39],
      yellowBright: [93, 39],
      blueBright: [94, 39],
      magentaBright: [95, 39],
      cyanBright: [96, 39],
      whiteBright: [97, 39]
    },
    bgColor: {
      bgBlack: [40, 49],
      bgRed: [41, 49],
      bgGreen: [42, 49],
      bgYellow: [43, 49],
      bgBlue: [44, 49],
      bgMagenta: [45, 49],
      bgCyan: [46, 49],
      bgWhite: [47, 49],
      // Bright color
      bgBlackBright: [100, 49],
      bgRedBright: [101, 49],
      bgGreenBright: [102, 49],
      bgYellowBright: [103, 49],
      bgBlueBright: [104, 49],
      bgMagentaBright: [105, 49],
      bgCyanBright: [106, 49],
      bgWhiteBright: [107, 49]
    }
  }; // Fix humans

  styles.color.grey = styles.color.gray;

  for (const groupName of Object.keys(styles)) {
    const group = styles[groupName];

    for (const styleName of Object.keys(group)) {
      const style = group[styleName];
      styles[styleName] = {
        open: `\u001B[${style[0]}m`,
        close: `\u001B[${style[1]}m`
      };
      group[styleName] = styles[styleName];
      codes.set(style[0], style[1]);
    }

    Object.defineProperty(styles, groupName, {
      value: group,
      enumerable: false
    });
    Object.defineProperty(styles, 'codes', {
      value: codes,
      enumerable: false
    });
  }

  const rgb2rgb = (r, g, b) => [r, g, b];

  styles.color.close = '\u001B[39m';
  styles.bgColor.close = '\u001B[49m';
  styles.color.ansi = {};
  styles.color.ansi256 = {};
  styles.color.ansi16m = {
    rgb: wrapAnsi16m(rgb2rgb, 0)
  };
  styles.bgColor.ansi = {};
  styles.bgColor.ansi256 = {};
  styles.bgColor.ansi16m = {
    rgb: wrapAnsi16m(rgb2rgb, 10)
  };

  for (const key of Object.keys(colorConvert)) {
    if (typeof colorConvert[key] !== 'object') {
      continue;
    }

    const suite = colorConvert[key];

    if ('ansi16' in suite) {
      styles.color.ansi[key] = wrapAnsi16(suite.ansi16, 0);
      styles.bgColor.ansi[key] = wrapAnsi16(suite.ansi16, 10);
    }

    if ('ansi256' in suite) {
      styles.color.ansi256[key] = wrapAnsi256(suite.ansi256, 0);
      styles.bgColor.ansi256[key] = wrapAnsi256(suite.ansi256, 10);
    }

    if ('rgb' in suite) {
      styles.color.ansi16m[key] = wrapAnsi16m(suite.rgb, 0);
      styles.bgColor.ansi16m[key] = wrapAnsi16m(suite.rgb, 10);
    }
  }

  return styles;
} // Make the export immutable


Object.defineProperty(module, 'exports', {
  enumerable: true,
  get: assembleStyles
});
/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(23)(module)))

/***/ }),
/* 23 */
/***/ (function(module, exports) {

module.exports = function (module) {
  if (!module.webpackPolyfill) {
    module.deprecate = function () {};

    module.paths = []; // module.parent = undefined by default

    if (!module.children) module.children = [];
    Object.defineProperty(module, "loaded", {
      enumerable: true,
      get: function () {
        return module.l;
      }
    });
    Object.defineProperty(module, "id", {
      enumerable: true,
      get: function () {
        return module.i;
      }
    });
    module.webpackPolyfill = 1;
  }

  return module;
};

/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

var conversions = __webpack_require__(3);

var route = __webpack_require__(26);

var convert = {};
var models = Object.keys(conversions);

function wrapRaw(fn) {
  var wrappedFn = function (args) {
    if (args === undefined || args === null) {
      return args;
    }

    if (arguments.length > 1) {
      args = Array.prototype.slice.call(arguments);
    }

    return fn(args);
  }; // preserve .conversion property if there is one


  if ('conversion' in fn) {
    wrappedFn.conversion = fn.conversion;
  }

  return wrappedFn;
}

function wrapRounded(fn) {
  var wrappedFn = function (args) {
    if (args === undefined || args === null) {
      return args;
    }

    if (arguments.length > 1) {
      args = Array.prototype.slice.call(arguments);
    }

    var result = fn(args); // we're assuming the result is an array here.
    // see notice in conversions.js; don't use box types
    // in conversion functions.

    if (typeof result === 'object') {
      for (var len = result.length, i = 0; i < len; i++) {
        result[i] = Math.round(result[i]);
      }
    }

    return result;
  }; // preserve .conversion property if there is one


  if ('conversion' in fn) {
    wrappedFn.conversion = fn.conversion;
  }

  return wrappedFn;
}

models.forEach(function (fromModel) {
  convert[fromModel] = {};
  Object.defineProperty(convert[fromModel], 'channels', {
    value: conversions[fromModel].channels
  });
  Object.defineProperty(convert[fromModel], 'labels', {
    value: conversions[fromModel].labels
  });
  var routes = route(fromModel);
  var routeModels = Object.keys(routes);
  routeModels.forEach(function (toModel) {
    var fn = routes[toModel];
    convert[fromModel][toModel] = wrapRounded(fn);
    convert[fromModel][toModel].raw = wrapRaw(fn);
  });
});
module.exports = convert;

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = {
  "aliceblue": [240, 248, 255],
  "antiquewhite": [250, 235, 215],
  "aqua": [0, 255, 255],
  "aquamarine": [127, 255, 212],
  "azure": [240, 255, 255],
  "beige": [245, 245, 220],
  "bisque": [255, 228, 196],
  "black": [0, 0, 0],
  "blanchedalmond": [255, 235, 205],
  "blue": [0, 0, 255],
  "blueviolet": [138, 43, 226],
  "brown": [165, 42, 42],
  "burlywood": [222, 184, 135],
  "cadetblue": [95, 158, 160],
  "chartreuse": [127, 255, 0],
  "chocolate": [210, 105, 30],
  "coral": [255, 127, 80],
  "cornflowerblue": [100, 149, 237],
  "cornsilk": [255, 248, 220],
  "crimson": [220, 20, 60],
  "cyan": [0, 255, 255],
  "darkblue": [0, 0, 139],
  "darkcyan": [0, 139, 139],
  "darkgoldenrod": [184, 134, 11],
  "darkgray": [169, 169, 169],
  "darkgreen": [0, 100, 0],
  "darkgrey": [169, 169, 169],
  "darkkhaki": [189, 183, 107],
  "darkmagenta": [139, 0, 139],
  "darkolivegreen": [85, 107, 47],
  "darkorange": [255, 140, 0],
  "darkorchid": [153, 50, 204],
  "darkred": [139, 0, 0],
  "darksalmon": [233, 150, 122],
  "darkseagreen": [143, 188, 143],
  "darkslateblue": [72, 61, 139],
  "darkslategray": [47, 79, 79],
  "darkslategrey": [47, 79, 79],
  "darkturquoise": [0, 206, 209],
  "darkviolet": [148, 0, 211],
  "deeppink": [255, 20, 147],
  "deepskyblue": [0, 191, 255],
  "dimgray": [105, 105, 105],
  "dimgrey": [105, 105, 105],
  "dodgerblue": [30, 144, 255],
  "firebrick": [178, 34, 34],
  "floralwhite": [255, 250, 240],
  "forestgreen": [34, 139, 34],
  "fuchsia": [255, 0, 255],
  "gainsboro": [220, 220, 220],
  "ghostwhite": [248, 248, 255],
  "gold": [255, 215, 0],
  "goldenrod": [218, 165, 32],
  "gray": [128, 128, 128],
  "green": [0, 128, 0],
  "greenyellow": [173, 255, 47],
  "grey": [128, 128, 128],
  "honeydew": [240, 255, 240],
  "hotpink": [255, 105, 180],
  "indianred": [205, 92, 92],
  "indigo": [75, 0, 130],
  "ivory": [255, 255, 240],
  "khaki": [240, 230, 140],
  "lavender": [230, 230, 250],
  "lavenderblush": [255, 240, 245],
  "lawngreen": [124, 252, 0],
  "lemonchiffon": [255, 250, 205],
  "lightblue": [173, 216, 230],
  "lightcoral": [240, 128, 128],
  "lightcyan": [224, 255, 255],
  "lightgoldenrodyellow": [250, 250, 210],
  "lightgray": [211, 211, 211],
  "lightgreen": [144, 238, 144],
  "lightgrey": [211, 211, 211],
  "lightpink": [255, 182, 193],
  "lightsalmon": [255, 160, 122],
  "lightseagreen": [32, 178, 170],
  "lightskyblue": [135, 206, 250],
  "lightslategray": [119, 136, 153],
  "lightslategrey": [119, 136, 153],
  "lightsteelblue": [176, 196, 222],
  "lightyellow": [255, 255, 224],
  "lime": [0, 255, 0],
  "limegreen": [50, 205, 50],
  "linen": [250, 240, 230],
  "magenta": [255, 0, 255],
  "maroon": [128, 0, 0],
  "mediumaquamarine": [102, 205, 170],
  "mediumblue": [0, 0, 205],
  "mediumorchid": [186, 85, 211],
  "mediumpurple": [147, 112, 219],
  "mediumseagreen": [60, 179, 113],
  "mediumslateblue": [123, 104, 238],
  "mediumspringgreen": [0, 250, 154],
  "mediumturquoise": [72, 209, 204],
  "mediumvioletred": [199, 21, 133],
  "midnightblue": [25, 25, 112],
  "mintcream": [245, 255, 250],
  "mistyrose": [255, 228, 225],
  "moccasin": [255, 228, 181],
  "navajowhite": [255, 222, 173],
  "navy": [0, 0, 128],
  "oldlace": [253, 245, 230],
  "olive": [128, 128, 0],
  "olivedrab": [107, 142, 35],
  "orange": [255, 165, 0],
  "orangered": [255, 69, 0],
  "orchid": [218, 112, 214],
  "palegoldenrod": [238, 232, 170],
  "palegreen": [152, 251, 152],
  "paleturquoise": [175, 238, 238],
  "palevioletred": [219, 112, 147],
  "papayawhip": [255, 239, 213],
  "peachpuff": [255, 218, 185],
  "peru": [205, 133, 63],
  "pink": [255, 192, 203],
  "plum": [221, 160, 221],
  "powderblue": [176, 224, 230],
  "purple": [128, 0, 128],
  "rebeccapurple": [102, 51, 153],
  "red": [255, 0, 0],
  "rosybrown": [188, 143, 143],
  "royalblue": [65, 105, 225],
  "saddlebrown": [139, 69, 19],
  "salmon": [250, 128, 114],
  "sandybrown": [244, 164, 96],
  "seagreen": [46, 139, 87],
  "seashell": [255, 245, 238],
  "sienna": [160, 82, 45],
  "silver": [192, 192, 192],
  "skyblue": [135, 206, 235],
  "slateblue": [106, 90, 205],
  "slategray": [112, 128, 144],
  "slategrey": [112, 128, 144],
  "snow": [255, 250, 250],
  "springgreen": [0, 255, 127],
  "steelblue": [70, 130, 180],
  "tan": [210, 180, 140],
  "teal": [0, 128, 128],
  "thistle": [216, 191, 216],
  "tomato": [255, 99, 71],
  "turquoise": [64, 224, 208],
  "violet": [238, 130, 238],
  "wheat": [245, 222, 179],
  "white": [255, 255, 255],
  "whitesmoke": [245, 245, 245],
  "yellow": [255, 255, 0],
  "yellowgreen": [154, 205, 50]
};

/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

var conversions = __webpack_require__(3);
/*
	this function routes a model to all other models.

	all functions that are routed have a property `.conversion` attached
	to the returned synthetic function. This property is an array
	of strings, each with the steps in between the 'from' and 'to'
	color models (inclusive).

	conversions that are not possible simply are not included.
*/


function buildGraph() {
  var graph = {}; // https://jsperf.com/object-keys-vs-for-in-with-closure/3

  var models = Object.keys(conversions);

  for (var len = models.length, i = 0; i < len; i++) {
    graph[models[i]] = {
      // http://jsperf.com/1-vs-infinity
      // micro-opt, but this is simple.
      distance: -1,
      parent: null
    };
  }

  return graph;
} // https://en.wikipedia.org/wiki/Breadth-first_search


function deriveBFS(fromModel) {
  var graph = buildGraph();
  var queue = [fromModel]; // unshift -> queue -> pop

  graph[fromModel].distance = 0;

  while (queue.length) {
    var current = queue.pop();
    var adjacents = Object.keys(conversions[current]);

    for (var len = adjacents.length, i = 0; i < len; i++) {
      var adjacent = adjacents[i];
      var node = graph[adjacent];

      if (node.distance === -1) {
        node.distance = graph[current].distance + 1;
        node.parent = current;
        queue.unshift(adjacent);
      }
    }
  }

  return graph;
}

function link(from, to) {
  return function (args) {
    return to(from(args));
  };
}

function wrapConversion(toModel, graph) {
  var path = [graph[toModel].parent, toModel];
  var fn = conversions[graph[toModel].parent][toModel];
  var cur = graph[toModel].parent;

  while (graph[cur].parent) {
    path.unshift(graph[cur].parent);
    fn = link(conversions[graph[cur].parent][cur], fn);
    cur = graph[cur].parent;
  }

  fn.conversion = path;
  return fn;
}

module.exports = function (fromModel) {
  var graph = deriveBFS(fromModel);
  var conversion = {};
  var models = Object.keys(graph);

  for (var len = models.length, i = 0; i < len; i++) {
    var toModel = models[i];
    var node = graph[toModel];

    if (node.parent === null) {
      // no possible conversion, or this node is the source model.
      continue;
    }

    conversion[toModel] = wrapConversion(toModel, graph);
  }

  return conversion;
};

/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const os = __webpack_require__(28);

const hasFlag = __webpack_require__(29);

const env = process.env;

const support = level => {
  if (level === 0) {
    return false;
  }

  return {
    level,
    hasBasic: true,
    has256: level >= 2,
    has16m: level >= 3
  };
};

let supportLevel = (() => {
  if (hasFlag('no-color') || hasFlag('no-colors') || hasFlag('color=false')) {
    return 0;
  }

  if (hasFlag('color=16m') || hasFlag('color=full') || hasFlag('color=truecolor')) {
    return 3;
  }

  if (hasFlag('color=256')) {
    return 2;
  }

  if (hasFlag('color') || hasFlag('colors') || hasFlag('color=true') || hasFlag('color=always')) {
    return 1;
  }

  if (process.stdout && !process.stdout.isTTY) {
    return 0;
  }

  if (process.platform === 'win32') {
    // Node.js 7.5.0 is the first version of Node.js to include a patch to
    // libuv that enables 256 color output on Windows. Anything earlier and it
    // won't work. However, here we target Node.js 8 at minimum as it is an LTS
    // release, and Node.js 7 is not. Windows 10 build 10586 is the first Windows
    // release that supports 256 colors.
    const osRelease = os.release().split('.');

    if (Number(process.versions.node.split('.')[0]) >= 8 && Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
      return 2;
    }

    return 1;
  }

  if ('CI' in env) {
    if (['TRAVIS', 'CIRCLECI', 'APPVEYOR', 'GITLAB_CI'].some(sign => sign in env) || env.CI_NAME === 'codeship') {
      return 1;
    }

    return 0;
  }

  if ('TEAMCITY_VERSION' in env) {
    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
  }

  if ('TERM_PROGRAM' in env) {
    const version = parseInt((env.TERM_PROGRAM_VERSION || '').split('.')[0], 10);

    switch (env.TERM_PROGRAM) {
      case 'iTerm.app':
        return version >= 3 ? 3 : 2;

      case 'Hyper':
        return 3;

      case 'Apple_Terminal':
        return 2;
      // No default
    }
  }

  if (/-256(color)?$/i.test(env.TERM)) {
    return 2;
  }

  if (/^screen|^xterm|^vt100|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
    return 1;
  }

  if ('COLORTERM' in env) {
    return 1;
  }

  if (env.TERM === 'dumb') {
    return 0;
  }

  return 0;
})();

if ('FORCE_COLOR' in env) {
  supportLevel = parseInt(env.FORCE_COLOR, 10) === 0 ? 0 : supportLevel || 1;
}

module.exports = process && support(supportLevel);

/***/ }),
/* 28 */
/***/ (function(module, exports) {

module.exports = require("os");

/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function (flag, argv) {
  argv = argv || process.argv;
  var terminatorPos = argv.indexOf('--');
  var prefix = /^-{1,2}/.test(flag) ? '' : '--';
  var pos = argv.indexOf(prefix + flag);
  return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos);
};

/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const TEMPLATE_REGEX = /(?:\\(u[a-f\d]{4}|x[a-f\d]{2}|.))|(?:\{(~)?(\w+(?:\([^)]*\))?(?:\.\w+(?:\([^)]*\))?)*)(?:[ \t]|(?=\r?\n)))|(\})|((?:.|[\r\n\f])+?)/gi;
const STYLE_REGEX = /(?:^|\.)(\w+)(?:\(([^)]*)\))?/g;
const STRING_REGEX = /^(['"])((?:\\.|(?!\1)[^\\])*)\1$/;
const ESCAPE_REGEX = /\\(u[a-f\d]{4}|x[a-f\d]{2}|.)|([^\\])/gi;
const ESCAPES = new Map([['n', '\n'], ['r', '\r'], ['t', '\t'], ['b', '\b'], ['f', '\f'], ['v', '\v'], ['0', '\0'], ['\\', '\\'], ['e', '\u001B'], ['a', '\u0007']]);

function unescape(c) {
  if (c[0] === 'u' && c.length === 5 || c[0] === 'x' && c.length === 3) {
    return String.fromCharCode(parseInt(c.slice(1), 16));
  }

  return ESCAPES.get(c) || c;
}

function parseArguments(name, args) {
  const results = [];
  const chunks = args.trim().split(/\s*,\s*/g);
  let matches;

  for (const chunk of chunks) {
    if (!isNaN(chunk)) {
      results.push(Number(chunk));
    } else if (matches = chunk.match(STRING_REGEX)) {
      results.push(matches[2].replace(ESCAPE_REGEX, (m, escape, chr) => escape ? unescape(escape) : chr));
    } else {
      throw new Error(`Invalid Chalk template style argument: ${chunk} (in style '${name}')`);
    }
  }

  return results;
}

function parseStyle(style) {
  STYLE_REGEX.lastIndex = 0;
  const results = [];
  let matches;

  while ((matches = STYLE_REGEX.exec(style)) !== null) {
    const name = matches[1];

    if (matches[2]) {
      const args = parseArguments(name, matches[2]);
      results.push([name].concat(args));
    } else {
      results.push([name]);
    }
  }

  return results;
}

function buildStyle(chalk, styles) {
  const enabled = {};

  for (const layer of styles) {
    for (const style of layer.styles) {
      enabled[style[0]] = layer.inverse ? null : style.slice(1);
    }
  }

  let current = chalk;

  for (const styleName of Object.keys(enabled)) {
    if (Array.isArray(enabled[styleName])) {
      if (!(styleName in current)) {
        throw new Error(`Unknown Chalk style: ${styleName}`);
      }

      if (enabled[styleName].length > 0) {
        current = current[styleName].apply(current, enabled[styleName]);
      } else {
        current = current[styleName];
      }
    }
  }

  return current;
}

module.exports = (chalk, tmp) => {
  const styles = [];
  const chunks = [];
  let chunk = []; // eslint-disable-next-line max-params

  tmp.replace(TEMPLATE_REGEX, (m, escapeChar, inverse, style, close, chr) => {
    if (escapeChar) {
      chunk.push(unescape(escapeChar));
    } else if (style) {
      const str = chunk.join('');
      chunk = [];
      chunks.push(styles.length === 0 ? str : buildStyle(chalk, styles)(str));
      styles.push({
        inverse,
        styles: parseStyle(style)
      });
    } else if (close) {
      if (styles.length === 0) {
        throw new Error('Found extraneous } in Chalk template literal');
      }

      chunks.push(buildStyle(chalk, styles)(chunk.join('')));
      chunk = [];
      styles.pop();
    } else {
      chunk.push(chr);
    }
  });
  chunks.push(chunk.join(''));

  if (styles.length > 0) {
    const errMsg = `Chalk template literal is missing ${styles.length} closing bracket${styles.length === 1 ? '' : 's'} (\`}\`)`;
    throw new Error(errMsg);
  }

  return chunks.join('');
};

/***/ }),
/* 31 */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),
/* 32 */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ })
/******/ ]);