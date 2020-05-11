const ERC165Query = artifacts.require("./ERC165Query.sol");
const PermissioningRegistry = artifacts.require("./PermissioningRegistry.sol");
const PermissioningRelay = artifacts.require("./PermissioningRelay.sol");

const SecretStoreDocumentKeyShadowRetrievalService = artifacts.require("./SecretStoreDocumentKeyShadowRetrievalService.sol");
const SecretStoreDocumentKeyStoreService = artifacts.require("./SecretStoreDocumentKeyStoreService.sol");
const SecretStoreServerKeyGenerationService = artifacts.require("./SecretStoreServerKeyGenerationService.sol");
const SecretStoreServerKeyRetrievalService = artifacts.require("./SecretStoreServerKeyRetrievalService.sol");

const OwnedKeyServerSetWithMigration = artifacts.require("./OwnedKeyServerSetWithMigration.sol");

const config = require('../deployment-config.js');


module.exports = async function(deployer, network, accounts) {
    await (await PermissioningRegistry.deployed()).transferOwnership(accounts[1], {from: accounts[0]});
    await (await PermissioningRelay.deployed()).transferOwnership(accounts[1], {from: accounts[0]});
    
    if (config.SERVER_SET_CONTRACT_ON || config.SERVICE_CONTRACTS_ON) {
        await (await OwnedKeyServerSetWithMigration.deployed()).transferOwnership(accounts[1], {from: accounts[0]});
    }

    if (config.SERVICE_CONTRACTS_ON) {
        await (await SecretStoreDocumentKeyShadowRetrievalService.deployed()).transferOwnership(accounts[1], {from: accounts[0]});
        await (await SecretStoreDocumentKeyStoreService.deployed()).transferOwnership(accounts[1], {from: accounts[0]});
        await (await SecretStoreServerKeyGenerationService.deployed()).transferOwnership(accounts[1], {from: accounts[0]});
        await (await SecretStoreServerKeyRetrievalService.deployed()).transferOwnership(accounts[1], {from: accounts[0]});
    }

    console.log("--summary--")
    console.log("ERC165Query", ERC165Query.address)
    console.log("PermissioningRegistry", PermissioningRegistry.address)
    console.log("PermissioningRelay", PermissioningRelay.address)
    console.log("OwnedKeyServerSetWithMigration", OwnedKeyServerSetWithMigration.address)
    console.log("SecretStoreDocumentKeyShadowRetrievalService", SecretStoreDocumentKeyShadowRetrievalService.address)
    console.log("SecretStoreDocumentKeyStoreService", SecretStoreDocumentKeyStoreService.address)
    console.log("SecretStoreServerKeyGenerationService", SecretStoreServerKeyGenerationService.address)
    console.log("SecretStoreServerKeyRetrievalService", SecretStoreServerKeyRetrievalService.address)
};
