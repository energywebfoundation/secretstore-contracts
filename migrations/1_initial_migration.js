const Migrations = artifacts.require("./Migrations.sol");


module.exports = function(deployer, network, accounts) {
    if (!accounts[0] || !accounts[1]) {
        throw("Need at least 2 acounts");
    }
    deployer.deploy(Migrations, {from: accounts[0]});
};
