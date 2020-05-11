const SecretStoreDocumentKeyShadowRetrievalService = artifacts.require("./SecretStoreDocumentKeyShadowRetrievalService.sol");
const SecretStoreDocumentKeyStoreService = artifacts.require("./SecretStoreDocumentKeyStoreService.sol");
const SecretStoreServerKeyGenerationService = artifacts.require("./SecretStoreServerKeyGenerationService.sol");
const SecretStoreServerKeyRetrievalService = artifacts.require("./SecretStoreServerKeyRetrievalService.sol");

const OwnedKeyServerSetWithMigration = artifacts.require("./OwnedKeyServerSetWithMigration.sol");

const config = require('../deployment-config.js');


module.exports = async function(deployer, network, accounts) {
    if (config.SERVICE_CONTRACTS_ON) {
        await deployer.deploy(SecretStoreDocumentKeyShadowRetrievalService, OwnedKeyServerSetWithMigration.address, {from: accounts[0]});
        await deployer.deploy(SecretStoreDocumentKeyStoreService, OwnedKeyServerSetWithMigration.address, {from: accounts[0]});
        await deployer.deploy(SecretStoreServerKeyGenerationService, OwnedKeyServerSetWithMigration.address, {from: accounts[0]});
        await deployer.deploy(SecretStoreServerKeyRetrievalService, OwnedKeyServerSetWithMigration.address, {from: accounts[0]});
    }
};
