'use strict';

/* eslint-env mocha */
var assert = require('assert');
var config = require('./config');

var ecc = require('.');

var PublicKey = ecc.PublicKey,
    PrivateKey = ecc.PrivateKey,
    Signature = ecc.Signature;


describe('Object API', function () {
  it('PrivateKey constructor', function () {
    return PrivateKey.randomKey().then(function (privateKey) {
      assert(privateKey.toWif() === PrivateKey(privateKey.toWif()).toWif());
      assert(privateKey.toWif() === PrivateKey(privateKey.toBuffer()).toWif());
      assert(privateKey.toWif() === PrivateKey(privateKey).toWif());
      assert.throws(function () {
        return PrivateKey();
      }, /Invalid private key/);
    });
  });

  it('PublicKey constructor', function () {
    return PrivateKey.randomKey().then(function (privateKey) {
      var publicKey = privateKey.toPublic();
      assert(publicKey.toString() === PublicKey(publicKey.toString()).toString());
      assert(publicKey.toString() === PublicKey(publicKey.toBuffer()).toString());
      assert(publicKey.toString() === PublicKey(publicKey).toString());
      assert.throws(function () {
        return PublicKey();
      }, /Invalid public key/);
    });
  });
  it('Signature', function () {
    return PrivateKey.randomKey().then(function (privateKey) {
      var signature = Signature.sign('data', privateKey);
      var sigstr = signature.toString();
      assert(sigstr.indexOf(config.address_prefix) === 0, 'signature string format');
      assert(sigstr.length > 90, 'signature string is too short');
      assert(Signature.from(sigstr), 'signature from string');
    });
  });
});