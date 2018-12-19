"use strict";

const path = require("path");

const ContractQueryJSON = require(path.join(__dirname, "../build/contracts/ERC165Query.json"));
const ContractRelayJSON = require(path.join(__dirname, "../build/contracts/PermissioningRelay.json"));
const ContractRegistryJSON = require(path.join(__dirname, "../build/contracts/PermissioningRegistry.json"));




async function addresses(web3) {

    let id = await web3.eth.net.getId();

    return {
        query: ContractQueryJSON["networks"][id]["address"],
        relay: ContractRelayJSON["networks"][id]["address"],
        registry: ContractRegistryJSON["networks"][id]["address"]
    };
}


function deploy(contract, dargs, transactionparams) {
    return contract.deploy({arguments: dargs}).send(transactionparams);
};


function deployRelay(web3, dargs, transactionparams) {
    let c =new web3.eth.Contract(ContractRegistryJSON.abi, {data: ContractRegistryJSON.bytecode});
    return deploy(new web3.eth.Contract(ContractRelayJSON.abi, {data: ContractRelayJSON.bytecode}), dargs, transactionparams);
};

function deployRegistry(web3, dargs, transactionparams) {
    return deploy(new web3.eth.Contract(ContractRegistryJSON.abi, {data: ContractRegistryJSON.bytecode}), dargs, transactionparams);
};

module.exports = {
    deploy,
    deployRelay,
    deployRegistry,
    addresses
}
