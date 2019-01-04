#!/usr/bin/env node

"use strict";
const path = require("path");
const Web3 = require("web3");

const contractFirstStem = "Permissioning";
const contractFirstStemLower = contractFirstStem.toLowerCase();
const contractDynamic = "PermissioningDynamic";
const contractFireAndForget = "PermissioningFireAndForget";
const contractNoDoc = "PermissioningNoDoc";
const contractStatic = "PermissioningStatic";

async function deployPermission(args) {
    let argselector = {};
    argselector[contractDynamic] = [];
    argselector[contractFireAndForget] = [args.docid, args.accounts];
    argselector[contractNoDoc] = [args.accounts];
    argselector[contractStatic] = [];

    const web3 = new Web3(args.rpc);
    
    let contractName;

    // case sensitive..
    if (args.contract.startsWith(contractFirstStem)) {
        contractName = args.contract;
    } else {
        contractName = contractFirstStem + args.contract.charAt(0) + args.contract.substr(1);
    }

    const ContractJSON = require(path.join(__dirname, "../build/contracts/" + contractName + ".json"));
    
    let Contract = new web3.eth.Contract(ContractJSON.abi, {data: ContractJSON.bytecode});

    let from = args.from;
    if (undefined === from) {
        let localAccounts = await web3.eth.getAccounts();
        if (localAccounts !== undefined && localAccounts.length !== 0) {
            web3.eth.defaultAccount = localAccounts[0];
            from = web3.eth.defaultAccount;
        }
    }
    let contract = await Contract.deploy({arguments: argselector[ContractJSON.contractName]})
        .send({from: from});
    
    console.log(contractName + " deployed at: " + contract.options.address);
    return contract;
}

module.exports = deployPermission;
