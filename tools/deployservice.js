#!/usr/bin/env node

"use strict";
const path = require("path");
const Web3 = require("web3");

const contractFirstStem = "SecretStore";
const contractDKeyShadowRetrieval = "SecretStoreDocumentKeyShadowRetrievalService";
const contractDKeyStore = "SecretStoreDocumentKeyStoreService";
const contractSKeyRetrieval= "SecretStoreServerKeyRetrievalService";
const contractSKeyGeneration = "SecretStoreServerKeyGenerationService";

async function deployService(args) {
    let argselector = {};
    argselector[contractDKeyShadowRetrieval] = [args.serverSet];
    argselector[contractDKeyStore] = [args.serverSet];
    argselector[contractSKeyRetrieval] = [args.serverSet];;
    argselector[contractSKeyGeneration] = [args.serverSet];

    const web3 = new Web3(args.rpc);
    
    let contractName;

    let from = args.from;
    if (undefined === from) {
        let localAccounts = await web3.eth.getAccounts();
        if (localAccounts !== undefined && localAccounts.length !== 0) {
            web3.eth.defaultAccount = localAccounts[0];
            from = web3.eth.defaultAccount;
        }
    }

    if (args.contract !== undefined) {
        if (args.contract.startsWith(contractFirstStem)) {
            contractName = args.contract;
        } else {
            contractName = contractFirstStem + args.contract;
        }
        const ContractJSON = require(path.join(__dirname, "../build/contracts/" + contractName + ".json"));
        let Contract = new web3.eth.Contract(ContractJSON.abi, {data: ContractJSON.bytecode});
        let contract = await Contract.deploy({arguments: argselector[ContractJSON.contractName]})
            .send({from: from, gas: 5000000});
        
        console.log(contractName + " deployed at: " + contract.options.address);
        return contract;
    } else {
        let contracts = [];
        Object.keys(argselector).forEach(async function(key) {
            let ContractJSON = require(path.join(__dirname, "../build/contracts/" + key + ".json"));
            let Contract = new web3.eth.Contract(ContractJSON.abi, {data: ContractJSON.bytecode});
            let c = await Contract.deploy({arguments: argselector[ContractJSON.contractName]})
                .send({from: from, gas: 5000000});
            console.log(key + " deployed at: " + c.options.address);
            contracts.push(c);
        });
        return contracts;
    }
}

module.exports = deployService;
