const PermissioningRelay = artifacts.require("./PermissioningRelay.sol");
const PermissioningRegistry = artifacts.require("./PermissioningRegistry.sol");
const ERC165Query = artifacts.require("./ERC165Query.sol");


module.exports = function(deployer, network, accounts) {
    deployer.deploy(PermissioningRelay, ERC165Query.address, PermissioningRegistry.address, {from: accounts[0]});
};
