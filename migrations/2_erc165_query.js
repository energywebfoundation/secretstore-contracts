const ERC165Query = artifacts.require("./ERC165Query.sol");
const ERC165Checker = artifacts.require("./ERC165Checker.sol");


module.exports = function(deployer, network, accounts) {
    deployer.deploy(ERC165Checker, {from: accounts[0]})
    .then(function() {
        return deployer.link(ERC165Checker, ERC165Query);
    })
    .then(function() {
        return deployer.deploy(ERC165Query, {from: accounts[0]});
    });
};
