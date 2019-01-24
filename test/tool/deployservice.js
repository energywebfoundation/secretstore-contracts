"use strict";

const path = require('path');

const assert = require('chai').assert;
const expect = require('chai').expect;
const web3 = new (require('web3'))("http://127.0.0.1:8545");

const deployer = require(path.join(__dirname, "../../tools/deployservice.js"));

const alice = "0x3144de21da6de18061f818836fa3db8f3d6b6989";
const bob = "0x6c4b8b199a41b721e0a95df9860cf0a18732e76d";
const charlie = "0x8b2c16e09bfb011c5e4883cedb105124ccf01af7";

describe("SecretStoreDocumentKeyShadowRetrievalService contract", async function() {
    this.timeout(25000);
    let from;

    before(async function () {
        let accounts = await web3.eth.getAccounts();
        from = accounts[0];
    });

    const basicInput = {
        _: [ 'permission' ],
        c: 'SecretStoreDocumentKeyShadowRetrievalService',
        contract: 'SecretStoreDocumentKeyShadowRetrievalService',
        serverSet: '0x46A30515cd13cc2862c2b9e8557633F9ECbA07aa',
        from: undefined,
        f: undefined,
        rpc: 'http://localhost:8545',
        r: 'http://localhost:8545',
        '$0': 'deploypermission.js',
    };
    
    it('should deploy 1', async function() {
        let vargs = basicInput;
        let contract = await deployer(vargs);
        assert.exists(contract.options.address);
        assert.isNotEmpty(contract.options.address);
    });

    it('should deploy 2', async function() {
        let vargs = basicInput;
        vargs.c = vargs.contract = "DocumentKeyShadowRetrievalService";
        let contract = await deployer(vargs);
        assert.exists(contract.options.address);
        assert.isNotEmpty(contract.options.address);
    });
});

describe("SecretStoreDocumentKeyStoreService contract", async function() {
    this.timeout(25000);
    let from;

    before(async function () {
        let accounts = await web3.eth.getAccounts();
        from = accounts[0];
    });

    const basicInput = {
        _: [ 'permission' ],
        c: 'SecretStoreDocumentKeyStoreService',
        contract: 'SecretStoreDocumentKeyStoreService',
        serverSet: '0x46A30515cd13cc2862c2b9e8557633F9ECbA07aa',
        from: undefined,
        f: undefined,
        rpc: 'http://localhost:8545',
        r: 'http://localhost:8545',
        '$0': 'deploypermission.js',
    };
    
    it('should deploy 1', async function() {
        let vargs = basicInput;
        let contract = await deployer(vargs);
        assert.exists(contract.options.address);
        assert.isNotEmpty(contract.options.address);
    });

    it('should deploy 2', async function() {
        let vargs = basicInput;
        vargs.c = vargs.contract = "DocumentKeyStoreService";
        let contract = await deployer(vargs);
        assert.exists(contract.options.address);
        assert.isNotEmpty(contract.options.address);
    });
});

describe("SecretStoreServerKeyRetrievalService contract", async function() {
    this.timeout(25000);
    let from;

    before(async function () {
        let accounts = await web3.eth.getAccounts();
        from = accounts[0];
    });

    const basicInput = {
        _: [ 'permission' ],
        c: 'SecretStoreServerKeyRetrievalService',
        contract: 'SecretStoreServerKeyRetrievalService',
        serverSet: '0x46A30515cd13cc2862c2b9e8557633F9ECbA07aa',
        from: undefined,
        f: undefined,
        rpc: 'http://localhost:8545',
        r: 'http://localhost:8545',
        '$0': 'deploypermission.js',
    };
    
    it('should deploy 1', async function() {
        let vargs = basicInput;
        let contract = await deployer(vargs);
        assert.exists(contract.options.address);
        assert.isNotEmpty(contract.options.address);
    });

    it('should deploy 2', async function() {
        let vargs = basicInput;
        vargs.c = vargs.contract = "ServerKeyRetrievalService";
        let contract = await deployer(vargs);
        assert.exists(contract.options.address);
        assert.isNotEmpty(contract.options.address);
    });
});

describe("SecretStoreServerKeyGenerationService contract", async function() {
    this.timeout(25000);
    let from;

    before(async function () {
        let accounts = await web3.eth.getAccounts();
        from = accounts[0];
    });

    const basicInput = {
        _: [ 'permission' ],
        c: 'SecretStoreServerKeyGenerationService',
        contract: 'SecretStoreServerKeyGenerationService',
        serverSet: '0x46A30515cd13cc2862c2b9e8557633F9ECbA07aa',
        from: undefined,
        f: undefined,
        rpc: 'http://localhost:8545',
        r: 'http://localhost:8545',
        '$0': 'deploypermission.js',
    };
    
    it('should deploy 1', async function() {
        let vargs = basicInput;
        let contract = await deployer(vargs);
        assert.exists(contract.options.address);
        assert.isNotEmpty(contract.options.address);
    });

    it('should deploy 2', async function() {
        let vargs = basicInput;
        vargs.c = vargs.contract = "ServerKeyGenerationService";
        let contract = await deployer(vargs);
        assert.exists(contract.options.address);
        assert.isNotEmpty(contract.options.address);
    });
});

describe("All contracts", async function() {
    this.timeout(25000);
    let from;

    before(async function () {
        let accounts = await web3.eth.getAccounts();
        from = accounts[0];
    });

    const basicInput = {
        _: [ 'permission' ],
        c: undefined,
        contract: undefined,
        serverSet: '0x46A30515cd13cc2862c2b9e8557633F9ECbA07aa',
        from: undefined,
        f: undefined,
        rpc: 'http://localhost:8545',
        r: 'http://localhost:8545',
        '$0': 'deploypermission.js',
    };
    
    it('should deploy', async function() {
        let vargs = basicInput;
        let contracts = await deployer(vargs);
        for (let c of contracts) {
            assert.exists(c.options.address);
            assert.isNotEmpty(c.options.address);
        }
    });
});
