const OwnedKeyServerSetWithMigration = artifacts.require("./OwnedKeyServerSetWithMigration.sol");

const config = require('../deployment-config.js');


const ensure0x = (_input) => {
    return _input.startsWith("0x") ? _input : "0x" + _input;
}

module.exports = async function(deployer, network, accounts) {
    if (config.SERVER_SET_CONTRACT_ON || config.SERVICE_CONTRACTS_ON) {
        await deployer.deploy(OwnedKeyServerSetWithMigration);
        let _set = await OwnedKeyServerSetWithMigration.deployed();
        let y;
        for (x of config.SERVER_LIST) {
            y = x.split("@");
            await _set.addKeyServer(ensure0x(y[0].split("//").slice(-1)[0]), y[1], {from: accounts[0]});
        }
        await _set.completeInitialization({from: accounts[0]});
    }
};
