var ERC165Query = artifacts.require("./ERC165Query.sol");
var ERC165Checker = artifacts.require("./ERC165Checker.sol");

module.exports = function(deployer) {
    deployer.deploy(ERC165Checker)
    .then(function() {
        return deployer.link(ERC165Checker, ERC165Query);
    })
    .then(function() {
        return deployer.deploy(ERC165Query);
    });
};
