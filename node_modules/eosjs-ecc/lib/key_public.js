'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var BigInteger = require('bigi');
var ecurve = require('ecurve');
var secp256k1 = ecurve.getCurveByName('secp256k1');
var base58 = require('bs58');
var hash = require('./hash');
var config = require('./config');
var assert = require('assert');

var G = secp256k1.G;
var n = secp256k1.n;

module.exports = PublicKey;

/** @param {ecurve.Point} public key */
function PublicKey(Q) {

    if (typeof Q === 'string') {
        var publicKey = PublicKey.fromString(Q);
        assert(publicKey != null, 'Invalid public key');
        return publicKey;
    } else if (Buffer.isBuffer(Q)) {
        return PublicKey.fromBuffer(Q);
    } else if ((typeof Q === 'undefined' ? 'undefined' : _typeof(Q)) === 'object' && Q.Q) {
        return PublicKey(Q.Q);
    }

    if ((typeof Q === 'undefined' ? 'undefined' : _typeof(Q)) !== 'object' || typeof Q.compressed !== 'boolean') {
        throw new TypeError('Invalid public key');
    }

    function toBuffer() {
        var compressed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Q.compressed;

        return Q.getEncoded(compressed);
    }

    var pubdata = void 0; // cache

    /**
        Full public key
        @return {string} EOSKey..
    */
    function toString() {
        var address_prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : config.address_prefix;

        if (pubdata) {
            return address_prefix + pubdata;
        }
        var pub_buf = toBuffer();
        var checksum = hash.ripemd160(pub_buf);
        var addy = Buffer.concat([pub_buf, checksum.slice(0, 4)]);
        pubdata = base58.encode(addy);
        return address_prefix + pubdata;
    }

    function toUncompressed() {
        var buf = Q.getEncoded(false);
        var point = ecurve.Point.decodeFrom(secp256k1, buf);
        return PublicKey.fromPoint(point);
    }

    /** @deprecated */
    function child(offset) {
        console.error('Deprecated warning: PublicKey.child');

        assert(Buffer.isBuffer(offset), "Buffer required: offset");
        assert.equal(offset.length, 32, "offset length");

        offset = Buffer.concat([toBuffer(), offset]);
        offset = hash.sha256(offset);

        var c = BigInteger.fromBuffer(offset);

        if (c.compareTo(n) >= 0) throw new Error("Child offset went out of bounds, try again");

        var cG = G.multiply(c);
        var Qprime = Q.add(cG);

        if (secp256k1.isInfinity(Qprime)) throw new Error("Child offset derived to an invalid key, try again");

        return PublicKey.fromPoint(Qprime);
    }

    // toByteBuffer() {
    //     var b = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN);
    //     appendByteBuffer(b);
    //     return b.copy(0, b.offset);
    // }

    function toHex() {
        return toBuffer().toString('hex');
    }

    return {
        Q: Q,
        toString: toString,
        toUncompressed: toUncompressed,
        toBuffer: toBuffer,
        child: child,
        toHex: toHex
    };
}

PublicKey.isValid = function (text) {
    try {
        PublicKey(text);
        return true;
    } catch (e) {
        return false;
    }
};

PublicKey.fromBinary = function (bin) {
    return PublicKey.fromBuffer(new Buffer(bin, 'binary'));
};

PublicKey.fromBuffer = function (buffer) {
    return PublicKey(ecurve.Point.decodeFrom(secp256k1, buffer));
};

PublicKey.fromPoint = function (point) {
    return PublicKey(point);
};

/**
    @arg {string} public_key - like STMXyz...
    @arg {string} address_prefix - like STM
    @return PublicKey or `null` (if the public_key string is invalid)
*/
PublicKey.fromString = function (public_key) {
    var address_prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : config.address_prefix;

    try {
        return PublicKey.fromStringOrThrow(public_key, address_prefix);
    } catch (e) {
        return null;
    }
};

/**
    @arg {string} public_key - like EOSKey..
    @arg {string} address_prefix - like EOS
    @throws {Error} if public key is invalid
    @return PublicKey
*/
PublicKey.fromStringOrThrow = function (public_key) {
    var address_prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : config.address_prefix;

    var prefix = public_key.slice(0, address_prefix.length);
    assert.equal(address_prefix, prefix, 'Expecting key to begin with ' + address_prefix + ', instead got ' + prefix);
    public_key = public_key.slice(address_prefix.length);

    public_key = new Buffer(base58.decode(public_key), 'binary');
    var checksum = public_key.slice(-4).toString('hex');
    public_key = public_key.slice(0, -4);
    var new_checksum = hash.ripemd160(public_key);
    new_checksum = new_checksum.slice(0, 4).toString('hex');
    assert.equal(checksum, new_checksum, 'Checksum did not match, ' + (checksum + ' != ' + new_checksum));
    return PublicKey.fromBuffer(public_key);
};

PublicKey.fromHex = function (hex) {
    return PublicKey.fromBuffer(new Buffer(hex, 'hex'));
};

PublicKey.fromStringHex = function (hex) {
    return PublicKey.fromString(new Buffer(hex, 'hex'));
};