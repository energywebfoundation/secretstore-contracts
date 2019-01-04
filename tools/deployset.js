#!/usr/bin/env node

"use strict";
const path = require("path");
const Web3 = require("web3");

const contractName = "OwnedKeyServerSetWithMigration";
const ContractJSON = require(path.join(__dirname, "../build/contracts/"+ contractName + ".json"));

async function deploySet(args) {

    const web3 = new Web3(args.rpc);
    let Contract = new web3.eth.Contract(ContractJSON.abi, {data: ContractJSON.bytecode});

    let from = args.from;
    if (undefined === from) {
        let localAccounts = await web3.eth.getAccounts();
        if (localAccounts !== undefined && localAccounts.length !== 0) {
            web3.eth.defaultAccount = localAccounts[0];
            from = web3.eth.defaultAccount;
        }
    }
    let contract = await Contract.deploy({arguments: []}).send({from: from, gas: 3000000});
    
    console.log(contractName + " deployed at: " + contract.options.address);
    return contract;
}

module.exports = deploySet;
