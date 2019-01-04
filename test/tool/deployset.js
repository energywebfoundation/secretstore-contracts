"use strict";

const path = require('path');

const assert = require('chai').assert;
const expect = require('chai').expect;
const web3 = new (require('web3'))("http://127.0.0.1:8545");

const deployer = require(path.join(__dirname, "../../tools/deployset.js"));

describe("Server set contract", async function() {
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