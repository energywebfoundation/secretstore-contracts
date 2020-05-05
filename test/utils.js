"use strict";

const path = require("path");
const ContractQueryJSON = require(path.join(__dirname, "../build/contracts/ERC165Query.json"));
const ContractRelayJSON = require(path.join(__dirname, "../build/contracts/PermissioningRelay.json"));
const ContractRegistryJSON = require(path.join(__dirname, "../build/contracts/PermissioningRegistry.json"));

const Web3 = require('web3')


const REVERT_ERROR_MSG = "VM Exception while processing transaction: revert";
const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";
const SYSTEM_ADDRESS = "0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE";
const EMPTY_BYTES_32 = "0x0000000000000000000000000000000000000000000000000000000000000000";


async function accounts(url) {
    let web3 = new Web3(url);
    return await web3.eth.getAccounts();
}

module.exports = {
    accounts,
    REVERT_ERROR_MSG,
    EMPTY_ADDRESS,
    EMPTY_BYTES_32,
    SYSTEM_ADDRESS
}
