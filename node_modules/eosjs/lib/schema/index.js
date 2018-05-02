'use strict';

var chainTypes = require('./chain_types.json');
var eosio = require('./eosio_system.json');

module.exports = Object.assign({}, chainTypes, eosio);