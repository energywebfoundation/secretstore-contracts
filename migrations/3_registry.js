const PermissioningRegistry = artifacts.require("./PermissioningRegistry.sol");


module.exports = function(deployer, network, accounts) {
    deployer.deploy(PermissioningRegistry, {from: accounts[0]});
};
