/* eslint-disable no-var -- intentionally plain ES5: this file must run untranspiled-safe on old Safari */
/**
 * Web-only runtime polyfills for older iPhone Safari (iOS 12–15.3).
 *
 * Imported FIRST by the app entry (`index.js`, before `expo-router/entry`) so
 * it runs before any library code — several libraries call these at
 * import / first-render time (React Navigation + expo-router use
 * `Array#findLast[Index]` while building navigation state; Reanimated uses
 * `structuredClone`). On Safari < 15.4 those throw → the app never mounts →
 * blank white page. Every shim is feature-detected: modern browsers keep their
 * native implementations untouched. Plain ES5 on purpose (no imports, no
 * syntax that itself needs transpiling). Never shipped to iOS/Android (Hermes).
 */
// (Metro's `serializer.getPolyfills` can't be used: Expo's CLI replaces it with
// a fixed list on web, silently dropping custom entries.) Module scope already
// isolates these locals.
var g =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
      ? window
      : typeof self !== 'undefined'
        ? self
        : this;

// Safari 12.1
if (typeof g.globalThis === 'undefined') {
  g.globalThis = g;
}

function define(target, name, value) {
  if (target[name]) return;
  Object.defineProperty(target, name, {
    value: value,
    configurable: true,
    writable: true,
    enumerable: false,
  });
}

function toInt(n) {
  n = Number(n);
  if (n !== n) return 0; // NaN
  return n < 0 ? Math.ceil(n) : Math.floor(n);
}

// Safari 15.4
function at(index) {
  var len = this.length >>> 0;
  var i = toInt(index);
  if (i < 0) i += len;
  return i < 0 || i >= len ? undefined : this[i];
}
define(Array.prototype, 'at', at);
define(String.prototype, 'at', function (index) {
  var s = String(this);
  var r = at.call(s, index);
  return r;
});

// Safari 15.4
define(Array.prototype, 'findLast', function (predicate, thisArg) {
  for (var i = (this.length >>> 0) - 1; i >= 0; i--) {
    if (predicate.call(thisArg, this[i], i, this)) return this[i];
  }
  return undefined;
});
define(Array.prototype, 'findLastIndex', function (predicate, thisArg) {
  for (var i = (this.length >>> 0) - 1; i >= 0; i--) {
    if (predicate.call(thisArg, this[i], i, this)) return i;
  }
  return -1;
});

// Safari 15.4
define(Object, 'hasOwn', function (obj, key) {
  if (obj == null) throw new TypeError('Cannot convert undefined or null to object');
  return Object.prototype.hasOwnProperty.call(Object(obj), key);
});

// Safari 12 — Array#flat / flatMap
define(Array.prototype, 'flat', function flat(depth) {
  var d = depth === undefined ? 1 : toInt(depth);
  var out = [];
  (function walk(arr, level) {
    for (var i = 0; i < arr.length; i++) {
      if (Array.isArray(arr[i]) && level > 0) walk(arr[i], level - 1);
      else out.push(arr[i]);
    }
  })(this, d);
  return out;
});
define(Array.prototype, 'flatMap', function (fn, thisArg) {
  return Array.prototype.map.call(this, fn, thisArg).flat(1);
});

// Safari 12 — Object.fromEntries
define(Object, 'fromEntries', function (entries) {
  var o = {};
  var arr = Array.from(entries);
  for (var i = 0; i < arr.length; i++) o[arr[i][0]] = arr[i][1];
  return o;
});

// Safari 13.1
define(String.prototype, 'replaceAll', function (search, replacement) {
  if (search instanceof RegExp) {
    if (!search.global) throw new TypeError('replaceAll must be called with a global RegExp');
    return String(this).replace(search, replacement);
  }
  return String(this).split(String(search)).join(String(replacement));
});

// Safari 13
if (typeof Promise !== 'undefined') {
  define(Promise, 'allSettled', function (items) {
    var P = this;
    return P.all(
      Array.from(items).map(function (item) {
        return P.resolve(item).then(
          function (value) {
            return { status: 'fulfilled', value: value };
          },
          function (reason) {
            return { status: 'rejected', reason: reason };
          },
        );
      }),
    );
  });
}

// Safari 12.1
if (typeof g.queueMicrotask !== 'function') {
  g.queueMicrotask = function (cb) {
    Promise.resolve()
      .then(cb)
      .catch(function (e) {
        setTimeout(function () {
          throw e;
        }, 0);
      });
  };
}

// Safari (any) has no requestIdleCallback.
if (typeof g.requestIdleCallback !== 'function') {
  g.requestIdleCallback = function (cb) {
    var start = Date.now();
    return setTimeout(function () {
      cb({
        didTimeout: false,
        timeRemaining: function () {
          return Math.max(0, 50 - (Date.now() - start));
        },
      });
    }, 1);
  };
  g.cancelIdleCallback = function (id) {
    clearTimeout(id);
  };
}

// Safari 15.4 — good-enough deep clone for plain data (what libraries pass).
if (typeof g.structuredClone !== 'function') {
  g.structuredClone = function clone(value) {
    if (value === null || typeof value !== 'object') return value;
    if (value instanceof Date) return new Date(value.getTime());
    if (value instanceof RegExp) return new RegExp(value.source, value.flags);
    if (typeof Map !== 'undefined' && value instanceof Map) {
      var m = new Map();
      value.forEach(function (v, k) {
        m.set(clone(k), clone(v));
      });
      return m;
    }
    if (typeof Set !== 'undefined' && value instanceof Set) {
      var s = new Set();
      value.forEach(function (v) {
        s.add(clone(v));
      });
      return s;
    }
    if (Array.isArray(value)) return value.map(clone);
    var out = {};
    for (var k in value) {
      if (Object.prototype.hasOwnProperty.call(value, k)) out[k] = clone(value[k]);
    }
    return out;
  };
}
