'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* eslint-env mocha */
var assert = require('assert');
var fs = require('fs');

var Eos = require('.');
var ecc = Eos.modules.ecc;

var _require = require('eosjs-keygen'),
    Keystore = _require.Keystore;

var wif = '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3';

describe('version', function () {
  it('exposes a version number', function () {
    assert.ok(Eos.version);
  });
});

describe('offline', function () {
  var headers = {
    expiration: new Date().toISOString().split('.')[0],
    region: 0,
    ref_block_num: 1,
    ref_block_prefix: 452435776,
    max_net_usage_words: 0,
    max_kcpu_usage: 0,
    delay_sec: 0,
    context_free_actions: []
  };

  it('transaction', function _callee() {
    var privateKey, eos, memo, trx;
    return regeneratorRuntime.async(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return regeneratorRuntime.awrap(ecc.unsafeRandomKey());

          case 2:
            privateKey = _context.sent;
            eos = Eos.Localnet({
              keyProvider: privateKey,
              httpEndpoint: 'https://doesnotexist.example.org',
              transactionHeaders: function transactionHeaders(expireInSeconds, callback) {
                callback(null /*error*/, headers);
              },
              broadcast: false,
              sign: true
            });
            memo = '';
            _context.next = 7;
            return regeneratorRuntime.awrap(eos.transfer('bankers', 'people', '1000000 EOS', memo));

          case 7:
            trx = _context.sent;


            assert.deepEqual({
              expiration: trx.transaction.transaction.expiration,
              region: 0,
              ref_block_num: trx.transaction.transaction.ref_block_num,
              ref_block_prefix: trx.transaction.transaction.ref_block_prefix,
              max_net_usage_words: 0,
              max_kcpu_usage: 0,
              delay_sec: 0,
              context_free_actions: []
            }, headers);

            assert.equal(trx.transaction.signatures.length, 1, 'expecting 1 signature');

          case 10:
          case 'end':
            return _context.stop();
        }
      }
    }, null, this);
  });
});

// even transactions that don't broadcast require Api lookups
//  no testnet yet, avoid breaking travis-ci
if (process.env['NODE_ENV'] === 'development') {

  describe('networks', function () {
    it('testnet', function (done) {
      var eos = Eos.Localnet();
      eos.getBlock(1, function (err, block) {
        if (err) {
          throw err;
        }
        done();
      });
    });
  });

  describe('Contracts', function () {
    it('Messages do not sort', function _callee2() {
      var local, opts, tx;
      return regeneratorRuntime.async(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              local = Eos.Localnet();
              opts = { sign: false, broadcast: false };
              _context2.next = 4;
              return regeneratorRuntime.awrap(local.transaction(['currency', 'eosio'], function (_ref) {
                var currency = _ref.currency,
                    eosio = _ref.eosio;

                eosio.transfer('inita', 'initd', '1 EOS', ''); // make sure {account: 'eosio', ..} remains first
                currency.transfer('inita', 'initd', '1 CUR', ''); // {account: 'currency', ..} remains second
              }, opts));

            case 4:
              tx = _context2.sent;

              assert.equal(tx.transaction.transaction.actions[0].account, 'eosio');
              assert.equal(tx.transaction.transaction.actions[1].account, 'currency');

            case 7:
            case 'end':
              return _context2.stop();
          }
        }
      }, null, this);
    });

    function deploy(name) {
      it('Deploy ' + name, function _callee3() {
        var config, eos, wast, abi;
        return regeneratorRuntime.async(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                this.timeout(4000);
                config = { binaryen: require("binaryen"), keyProvider: wif };
                eos = Eos.Localnet(config);

                // When this test is ran multiple times, avoids same contract
                // version re-deploy error.  TODO: undeploy contract instead
                // const tmpWast = fs.readFileSync(`docker/contracts/proxy/proxy.wast`)
                // await eos.setcode('inita', 0, 0, tmpWast)

                wast = fs.readFileSync('docker/contracts/' + name + '/' + name + '.wast');
                abi = fs.readFileSync('docker/contracts/' + name + '/' + name + '.abi');
                _context3.next = 7;
                return regeneratorRuntime.awrap(eos.setcode('inita', 0, 0, wast));

              case 7:
                _context3.next = 9;
                return regeneratorRuntime.awrap(eos.setabi('inita', JSON.parse(abi)));

              case 9:
              case 'end':
                return _context3.stop();
            }
          }
        }, null, this);
      });
    }
    deploy('eosio.token');
    deploy('eosio.bios');
    // deploy('exchange') // exceeds: max_transaction_net_usage
  });

  describe('transactions', function () {
    var signProvider = function signProvider(_ref2) {
      var sign = _ref2.sign,
          buf = _ref2.buf;
      return sign(buf, wif);
    };
    var promiseSigner = function promiseSigner(args) {
      return Promise.resolve(signProvider(args));
    };

    it('usage', function () {
      var eos = Eos.Localnet({ signProvider: signProvider });
      eos.transfer();
    });

    // A keyProvider can return private keys directly..
    it('keyProvider private key', function () {

      // keyProvider should return an array of keys
      var keyProvider = function keyProvider() {
        return [wif];
      };

      var eos = Eos.Localnet({ keyProvider: keyProvider });

      return eos.transfer('inita', 'initb', '1 EOS', '', false).then(function (tr) {
        assert.equal(tr.transaction.signatures.length, 1);
        assert.equal(_typeof(tr.transaction.signatures[0]), 'string');
      });
    });

    it('keyProvider multiple private keys (get_required_keys)', function () {

      // keyProvider should return an array of keys
      var keyProvider = function keyProvider() {
        return ['5K84n2nzRpHMBdJf95mKnPrsqhZq7bhUvrzHyvoGwceBHq8FEPZ', wif];
      };

      var eos = Eos.Localnet({ keyProvider: keyProvider });

      return eos.transfer('inita', 'initb', '1.274 EOS', '', false).then(function (tr) {
        assert.equal(tr.transaction.signatures.length, 1);
        assert.equal(_typeof(tr.transaction.signatures[0]), 'string');
      });
    });

    // If a keystore is used, the keyProvider should return available
    // public keys first then respond with private keys next.
    it('keyProvider public keys then private key', function () {
      var pubkey = ecc.privateToPublic(wif);

      // keyProvider should return a string or array of keys.
      var keyProvider = function keyProvider(_ref3) {
        var transaction = _ref3.transaction,
            pubkeys = _ref3.pubkeys;

        if (!pubkeys) {
          assert.equal(transaction.actions[0].name, 'transfer');
          return [pubkey];
        }

        if (pubkeys) {
          assert.deepEqual(pubkeys, [pubkey]);
          return [wif];
        }
        assert(false, 'unexpected keyProvider callback');
      };

      var eos = Eos.Localnet({ keyProvider: keyProvider });

      return eos.transfer('inita', 'initb', '9 EOS', '', false).then(function (tr) {
        assert.equal(tr.transaction.signatures.length, 1);
        assert.equal(_typeof(tr.transaction.signatures[0]), 'string');
      });
    });

    it('keyProvider from eosjs-keygen', function () {
      var keystore = Keystore('uid');
      keystore.deriveKeys({ parent: wif });
      var eos = Eos.Localnet({ keyProvider: keystore.keyProvider });
      return eos.transfer('inita', 'initb', '12 EOS', '', true);
    });

    it('signProvider', function () {
      var customSignProvider = function customSignProvider(_ref4) {
        var buf = _ref4.buf,
            sign = _ref4.sign,
            transaction = _ref4.transaction;


        // All potential keys (EOS6MRy.. is the pubkey for 'wif')
        var pubkeys = ['EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV'];

        return eos.getRequiredKeys(transaction, pubkeys).then(function (res) {
          // Just the required_keys need to sign 
          assert.deepEqual(res.required_keys, pubkeys);
          return sign(buf, wif); // return hex string signature or array of signatures
        });
      };
      var eos = Eos.Localnet({ signProvider: customSignProvider });
      return eos.transfer('inita', 'initb', '2 EOS', '', false);
    });

    it('newaccount (broadcast)', function () {
      var eos = Eos.Localnet({ signProvider: signProvider });
      var pubkey = 'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV';
      // const auth = {threshold: 1, keys: [{key: pubkey, weight: 1}], accounts: []}
      var name = randomName();

      return eos.newaccount({
        creator: 'inita',
        name: name,
        owner: pubkey,
        active: pubkey,
        recovery: 'inita'
      });
    });

    it('mockTransactions pass', function () {
      var eos = Eos.Localnet({ signProvider: signProvider, mockTransactions: 'pass' });
      return eos.transfer('inita', 'initb', '1 EOS', '').then(function (transfer) {
        assert(transfer.mockTransaction, 'transfer.mockTransaction');
      });
    });

    it('mockTransactions fail', function () {
      var eos = Eos.Localnet({ signProvider: signProvider, mockTransactions: 'fail' });
      return eos.transfer('inita', 'initb', '1 EOS', '').catch(function (error) {
        assert(error.indexOf('fake error') !== -1, 'expecting: fake error');
      });
    });

    it('transfer (broadcast)', function () {
      var eos = Eos.Localnet({ signProvider: signProvider });
      return eos.transfer('inita', 'initb', '1 EOS', '');
    });

    it('transfer custom authorization (broadcast)', function () {
      var eos = Eos.Localnet({ signProvider: signProvider });
      return eos.transfer('inita', 'initb', '1 EOS', '', { authorization: 'inita@owner' });
    });

    it('transfer custom authorization sorting (no broadcast)', function () {
      var eos = Eos.Localnet({ signProvider: signProvider });
      return eos.transfer('inita', 'initb', '1 EOS', '', { authorization: ['initb@owner', 'inita@owner'], broadcast: false }).then(function (_ref5) {
        var transaction = _ref5.transaction;

        var ans = [{ actor: 'inita', permission: 'owner' }, { actor: 'initb', permission: 'owner' }];
        assert.deepEqual(transaction.transaction.actions[0].authorization, ans);
      });
    });

    it('transfer (no broadcast)', function () {
      var eos = Eos.Localnet({ signProvider: signProvider });
      return eos.transfer('inita', 'initb', '1 EOS', '', { broadcast: false });
    });

    it('transfer (no broadcast, no sign)', function () {
      var eos = Eos.Localnet({ signProvider: signProvider });
      var opts = { broadcast: false, sign: false };
      return eos.transfer('inita', 'initb', '1 EOS', '', opts).then(function (tr) {
        return assert.deepEqual(tr.transaction.signatures, []);
      });
    });

    it('transfer sign promise (no broadcast)', function () {
      var eos = Eos.Localnet({ signProvider: promiseSigner });
      return eos.transfer('inita', 'initb', '1 EOS', '', false);
    });

    it('action to unknown contract', function () {
      var name = 'acdef513521';
      return Eos.Localnet({ signProvider: signProvider }).contract(name).then(function () {
        throw 'expecting error';
      }).catch(function (error) {
        assert(/unknown key/.test(error.toString()), 'expecting "unknown key" error action, instead got: ' + error);
      });
    });

    it('action to contract', function () {
      // initaPrivate = '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'
      // eos is a bad test case, but it was the only native contract
      var name = 'currency';
      return Eos.Localnet({ signProvider: signProvider }).contract(name).then(function (contract) {
        return contract.transfer('inita', 'initb', '1 CUR', '')
        // transaction sent on each command
        .then(function (tr) {
          assert.equal(1, tr.transaction.transaction.actions.length);

          return contract.transfer('initb', 'inita', '1 CUR', '').then(function (tr) {
            assert.equal(1, tr.transaction.transaction.actions.length);
          });
        });
      }).then(function (r) {
        assert(r == undefined);
      });
    });

    it('action to contract atomic', function _callee4() {
      var amt, testnet, trTest, assertTr;
      return regeneratorRuntime.async(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              amt = 1; // for unique transactions

              testnet = Eos.Localnet({ signProvider: signProvider });

              trTest = function trTest(currency) {
                assert(currency.transfer('inita', 'initb', amt + ' CUR', '') == null);
                assert(currency.transfer('initb', 'inita', amt++ + ' CUR', '') == null);
              };

              assertTr = function assertTr(tr) {
                assert.equal(2, tr.transaction.transaction.actions.length);
              };

              //  contracts can be a string or array


              _context4.t0 = regeneratorRuntime;
              _context4.t1 = assertTr;
              _context4.next = 8;
              return regeneratorRuntime.awrap(testnet.transaction(['currency'], function (_ref6) {
                var currency = _ref6.currency;
                return trTest(currency);
              }));

            case 8:
              _context4.t2 = _context4.sent;
              _context4.t3 = (0, _context4.t1)(_context4.t2);
              _context4.next = 12;
              return _context4.t0.awrap.call(_context4.t0, _context4.t3);

            case 12:
              _context4.t4 = regeneratorRuntime;
              _context4.t5 = assertTr;
              _context4.next = 16;
              return regeneratorRuntime.awrap(testnet.transaction('currency', function (currency) {
                return trTest(currency);
              }));

            case 16:
              _context4.t6 = _context4.sent;
              _context4.t7 = (0, _context4.t5)(_context4.t6);
              _context4.next = 20;
              return _context4.t4.awrap.call(_context4.t4, _context4.t7);

            case 20:
            case 'end':
              return _context4.stop();
          }
        }
      }, null, this);
    });

    it('action to contract (contract tr nesting)', function () {
      this.timeout(4000);
      var tn = Eos.Localnet({ signProvider: signProvider });
      return tn.contract('currency').then(function (currency) {
        return currency.transaction(function (tr) {
          tr.transfer('inita', 'initb', '1 CUR', '');
          tr.transfer('inita', 'initc', '2 CUR', '');
        }).then(function () {
          return currency.transfer('inita', 'initb', '3 CUR', '');
        });
      });
    });

    it('multi-action transaction (broadcast)', function () {
      var eos = Eos.Localnet({ signProvider: signProvider });
      return eos.transaction(function (tr) {
        assert(tr.transfer('inita', 'initb', '1 EOS', '') == null);
        assert(tr.transfer({ from: 'inita', to: 'initc', quantity: '1 EOS', memo: '' }) == null);
      }).then(function (tr) {
        assert.equal(2, tr.transaction.transaction.actions.length);
      });
    });

    it('multi-action transaction no inner callback', function () {
      var eos = Eos.Localnet({ signProvider: signProvider });
      return eos.transaction(function (tr) {
        tr.transfer('inita', 'inita', '1 EOS', '', function (cb) {});
      }).then(function () {
        throw 'expecting rollback';
      }).catch(function (error) {
        assert(/Callback during a transaction/.test(error), error);
      });
    });

    it('multi-action transaction error rollback', function () {
      var eos = Eos.Localnet({ signProvider: signProvider });
      return eos.transaction(function (tr) {
        throw 'rollback';
      }).then(function () {
        throw 'expecting rollback';
      }).catch(function (error) {
        assert(/rollback/.test(error), error);
      });
    });

    it('multi-action transaction Promise.reject rollback', function () {
      var eos = Eos.Localnet({ signProvider: signProvider });
      return eos.transaction(function (tr) {
        return Promise.reject('rollback');
      }).then(function () {
        throw 'expecting rollback';
      }).catch(function (error) {
        assert(/rollback/.test(error), error);
      });
    });

    it('custom transfer', function () {
      var eos = Eos.Localnet({ signProvider: signProvider });
      return eos.transaction({
        actions: [{
          account: 'eosio',
          name: 'transfer',
          data: {
            from: 'inita',
            to: 'initb',
            quantity: '13 EOS',
            memo: '爱'
          },
          authorization: [{
            actor: 'inita',
            permission: 'active'
          }]
        }]
      }, { broadcast: false });
    });
  });

  // ./eosioc set contract currency build/contracts/currency/currency.wast build/contracts/currency/currency.abi
  it('Transaction ABI lookup', function _callee5() {
    var eos, tx;
    return regeneratorRuntime.async(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            eos = Eos.Localnet();
            _context5.next = 3;
            return regeneratorRuntime.awrap(eos.transaction({
              actions: [{
                account: 'currency',
                name: 'transfer',
                data: {
                  from: 'inita',
                  to: 'initb',
                  quantity: '13 CUR',
                  memo: ''
                },
                authorization: [{
                  actor: 'inita',
                  permission: 'active'
                }]
              }]
            }, { sign: false, broadcast: false }));

          case 3:
            tx = _context5.sent;

            assert.equal(tx.transaction.transaction.actions[0].account, 'currency');

          case 5:
          case 'end':
            return _context5.stop();
        }
      }
    }, null, this);
  });
} // if development

var randomName = function randomName() {
  return 'a' + String(Math.round(Math.random() * 1000000000)).replace(/[0,6-9]/g, '');
};