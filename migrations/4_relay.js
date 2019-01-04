var PermissioningRelay = artifacts.require("./PermissioningRelay.sol");
var PermissioningRegistry = artifacts.require("./PermissioningRegistry.sol");
var ERC165Query = artifacts.require("./ERC165Query.sol");

module.exports = function(deployer) {
    deployer.deploy(PermissioningRelay, ERC165Query.address, PermissioningRegistry.address);
};
