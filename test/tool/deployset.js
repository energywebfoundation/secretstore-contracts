"use strict";

const path = require('path');

const assert = require('chai').assert;
const expect = require('chai').expect;
const web3 = new (require('web3'))("http://127.0.0.1:8545");

const deployer = require(path.join(__dirname, "../../tools/deployset.js"));

const alice = "0x3144de21da6de18061f818836fa3db8f3d6b6989";
const bob = "0x6c4b8b199a41b721e0a95df9860cf0a18732e76d";
const charlie = "0x8b2c16e09bfb011c5e4883cedb105124ccf01af7";

let from;
web3.eth.getAccounts().then((accounts) => {
    from = accounts[0];
});

describe("Dynamic server set contract", async function() {
    this.timeout(25000);

    const basicInput = {
        _: [ 'deployset' ],
        from: undefined,
        f: undefined,
        rpc: 'http://localhost:8545',
        r: 'http://localhost:8545',
        '$0': 'deployset.js',
    };
    
    it('should deploy', async function() {
        let vargs = basicInput;
        let contract = await deployer(vargs);
        assert.exists(contract.options.address);
        assert.isNotEmpty(contract.options.address);
    });
});