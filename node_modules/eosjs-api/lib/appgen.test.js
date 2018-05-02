'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* eslint-env mocha */
var assert = require('assert');
var camelCase = require('camel-case');
var apiGen = require('./apigen');

var apiVersions = {
  v1: require('./api/v1')
};

describe('API Generator', function () {
  var _loop = function _loop(version) {
    describe(version, function () {
      var definitions = apiVersions[version];
      var api = apiGen(version, definitions);

      var _loop2 = function _loop2(apiGroup) {
        describe(apiGroup, function () {
          var _loop3 = function _loop3(apiMethod) {
            var methodName = camelCase(apiMethod);
            it(methodName, function () {
              assert.equal(_typeof(api[methodName]), 'function');
            });
          };

          for (var apiMethod in apiVersions[version][apiGroup]) {
            _loop3(apiMethod);
          }
        });
      };

      for (var apiGroup in definitions) {
        _loop2(apiGroup);
      }
    });
  };

  for (var version in apiVersions) {
    _loop(version);
  }
});

if (process.env['NODE_ENV'] === 'development') {
  describe('fetch', function () {
    var definitions = apiVersions.v1;
    var config = { fetchConfiguration: { credentials: 'same-origin' } };
    var api = apiGen('v1', definitions, config);

    it('getBlock', function (done) {
      api.getBlock({ block_num_or_id: 2 }, function (err, block) {
        if (err) {
          throw err;
        }
        assert(block.id, 'block.id');
        done();
      });
    });
  });
}