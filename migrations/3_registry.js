var PermissioningRegistry = artifacts.require("./PermissioningRegistry.sol");

module.exports = function(deployer) {
    deployer.deploy(PermissioningRegistry);
};
