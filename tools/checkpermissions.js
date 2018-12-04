#!/usr/bin/env node

"use strict";
const Web3 = require("web3");

const checkPermissionsAbi = {
    "constant": true,
    "inputs": [
      {
        "name": "user",
        "type": "address"
      },
      {
        "name": "document",
        "type": "bytes32"
      }
    ],
    "name": "checkPermissions",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
};

async function checkPermissions(args) {
    const web3 = new Web3(args.rpc);

    let from = args.from;
    if (undefined === from) {
        let localAccounts = await web3.eth.getAccounts();
        if (localAccounts !== undefined && localAccounts.length !== 0) {
            web3.eth.defaultAccount = localAccounts[0];
            from = web3.eth.defaultAccount;
        }
    }
    
    console.log("Checking permissions at contract: " + args.address);
    let res = {};
    for (let i = 0; i < args.accounts.length; i++) {
        let acc = args.accounts[i];
        let data = await web3.eth.abi.encodeFunctionCall(checkPermissionsAbi, [acc, args.docid]);
        let result = await web3.eth.call({
            to: args.address,
            data: data
        });
        res[acc] = (web3.utils.hexToNumber(result) === 1);
        console.log(acc + ": " + res[acc]);
    };
    return res;
}

module.exports = checkPermissions;
