'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

try {
  require("babel-polyfill");
} catch (e) {
  if (e.message.indexOf('only one instance of babel-polyfill is allowed') === -1) {
    console.error(e);
  }
}

var ecc = require('eosjs-ecc');
var json = {
  api: require('eosjs-api').api,
  schema: require('./schema')
};

var Fcbuffer = require('fcbuffer');
var api = require('eosjs-api');

var Structs = require('./structs');
var AbiCache = require('./abi-cache');
var writeApiGen = require('./write-api');
var assert = require('assert');
var format = require('./format');

var pkg = require('../package.json');
var Eos = {
  version: pkg.version
};

module.exports = Eos;

Eos.modules = {
  json: json,
  ecc: ecc,
  api: api,
  Fcbuffer: Fcbuffer,
  format: format
};

var configDefaults = {
  broadcast: true,
  debug: false,
  sign: true
};

function development(Network) {
  Network.schema = json.schema;
  return function () {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    config = Object.assign({}, configDefaults, config);
    var network = Network(Object.assign({}, {
      apiLog: consoleObjCallbackLog(config.verbose) }, config));
    var eosConfig = Object.assign({}, {
      transactionLog: consoleObjCallbackLog(config.verbose) }, config);
    return createEos(eosConfig, Network, network);
  };
}

Eos.Testnet = development(api.Testnet);
Eos.Localnet = development(api.Localnet);
// Eos.Mainnet = config => ..

function createEos(config, Network, network) {
  var abiCache = AbiCache(network, config);
  config = Object.assign({}, config, { network: network, abiCache: abiCache });

  if (!config.chainId) {
    config.chainId = '00'.repeat(32);
  }

  if (config.mockTransactions != null) {
    if (typeof config.mockTransactions === 'string') {
      var mock = config.mockTransactions;
      config.mockTransactions = function () {
        return mock;
      };
    }
    assert.equal(_typeof(config.mockTransactions), 'function', 'config.mockTransactions');
  }

  var _Structs = Structs(config),
      structs = _Structs.structs,
      types = _Structs.types,
      fromBuffer = _Structs.fromBuffer,
      toBuffer = _Structs.toBuffer;

  var eos = mergeWriteFunctions(config, Network, structs);

  Object.assign(eos, { fc: {
      structs: structs,
      types: types,
      fromBuffer: fromBuffer,
      toBuffer: toBuffer
    } });

  if (!config.signProvider) {
    config.signProvider = defaultSignProvider(eos, config);
  }

  return eos;
}

function consoleObjCallbackLog() {
  var verbose = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

  return function (error, result, name) {
    if (error) {
      if (name) {
        console.error(name, 'error');
      }
      console.error(error);
    } else if (verbose) {
      if (name) {
        console.log(name, 'reply:');
      }
      console.log(JSON.stringify(result, null, 4));
    }
  };
}

/**
  Merge in write functions (operations).  Tested against existing methods for
  name conflicts.

  @arg {object} config.network - read-only api calls
  @arg {object} Network - api[Network] read-only api calls
  @return {object} - read and write method calls (create and sign transactions)
  @throw {TypeError} if a funciton name conflicts
*/
function mergeWriteFunctions(config, Network, structs) {
  assert(config.network, 'network instance required');
  var network = config.network;


  var merge = Object.assign({}, network);

  var writeApi = writeApiGen(Network, network, structs, config);
  throwOnDuplicate(merge, writeApi, 'Conflicting methods in Network Api and Transaction Api');
  Object.assign(merge, writeApi);

  return merge;
}

function throwOnDuplicate(o1, o2, msg) {
  for (var key in o1) {
    if (o2[key]) {
      throw new TypeError(msg + ': ' + key);
    }
  }
}

/**
  The default sign provider is designed to interact with the available public
  keys (maybe just one), the transaction, and the blockchain to figure out
  the minimum set of signing keys.

  If only one key is available, the blockchain API calls are skipped and that
  key is used to sign the transaction.
*/
var defaultSignProvider = function defaultSignProvider(eos, config) {
  return function (_ref) {
    var sign = _ref.sign,
        buf = _ref.buf,
        transaction = _ref.transaction;
    var keyProvider = config.keyProvider;


    if (!keyProvider) {
      throw new TypeError('This transaction requires a config.keyProvider for signing');
    }

    var keys = keyProvider;
    if (typeof keyProvider === 'function') {
      keys = keyProvider({ transaction: transaction });
    }

    if (!Array.isArray(keys)) {
      keys = [keys];
    }

    if (!keys.length) {
      throw new Error('missing key, check your keyProvider');
    }

    // simplify default signing #17
    if (keys.length === 1 && ecc.isValidPrivate(keys[0])) {
      var wif = keys[0];
      return sign(buf, wif);
    }

    var keyMap = new Map();

    // keys are either public or private keys
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = keys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var key = _step.value;

        var isPrivate = ecc.isValidPrivate(key);
        var isPublic = ecc.isValidPublic(key);

        assert(isPrivate || isPublic, 'expecting public or private keys from keyProvider');

        if (isPrivate) {
          keyMap.set(ecc.privateToPublic(key), key);
        } else {
          keyMap.set(key, null);
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    var pubkeys = Array.from(keyMap.keys());

    return eos.getRequiredKeys(transaction, pubkeys).then(function (_ref2) {
      var required_keys = _ref2.required_keys;

      if (!required_keys.length) {
        throw new Error('missing required keys for ' + JSON.stringify(transaction));
      }

      var wifs = [],
          missingKeys = [];

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = required_keys[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var requiredKey = _step2.value;

          var _wif = keyMap.get(requiredKey);
          if (_wif) {
            wifs.push(_wif);
          } else {
            missingKeys.push(requiredKey);
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      if (missingKeys.length !== 0) {
        assert(typeof keyProvider === 'function', 'keyProvider function is needed for private key lookup');

        keyProvider({ pubkeys: missingKeys }).forEach(function (wif) {
          wifs.push(wif);
        });
      }

      var sigs = [];
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = wifs[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var _wif2 = _step3.value;

          sigs.push(sign(buf, _wif2));
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      return sigs;
    });
  };
};