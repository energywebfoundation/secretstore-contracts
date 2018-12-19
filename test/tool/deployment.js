"use strict";

const path = require('path');

const assert = require('chai').assert;
const expect = require('chai').expect;
const web3 = new (require('web3'))("http://127.0.0.1:8545");

const deployer = require(path.join(__dirname, "../../tools/deploy.js"));

const alice = "0x3144de21da6de18061f818836fa3db8f3d6b6989";
const bob = "0x6c4b8b199a41b721e0a95df9860cf0a18732e76d";
const charlie = "0x8b2c16e09bfb011c5e4883cedb105124ccf01af7";

let from;
web3.eth.getAccounts().then((accounts) => {
    from = accounts[0];
});

async function checkPermissionsTrue(contract) {
    let allowed = await contract.methods.checkPermissions(alice, "0xfefefefe").call();
    assert.isTrue(allowed);
    allowed = await contract.methods.checkPermissions(bob, "0xfefefefe").call();
    assert.isTrue(allowed);
    allowed = await contract.methods.checkPermissions(charlie, "0xfefefefe").call();
    assert.isFalse(allowed);
}

describe("Dynamic permissioning contract", async function() {
    this.timeout(25000);

    const basicInput = {
        _: [ 'permission' ],
        c: 'PermissioningDynamic',
        contract: 'PermissioningDynamic',
        docid: undefined,
        d: undefined,
        accounts: [],
        acc: [],
        from: undefined,
        f: undefined,
        rpc: 'http://localhost:8545',
        r: 'http://localhost:8545',
        '$0': 'deploy.js',
    };
    
    it('should deploy', async function() {
        let vargs = basicInput;
        let contract = await deployer(vargs);
        assert.exists(contract.options.address);
        assert.isNotEmpty(contract.options.address);
    });

    it('should add new permission correctly', async function() {
        let vargs = basicInput;
        let contract = await deployer(vargs);
        await contract.methods.addPermission("0xfefefefe", [alice, bob]).send({from: from});
        await checkPermissionsTrue(contract);
    });

    it('should not add already existing document key permission', async function() {
        let vargs = basicInput;
        let contract = await deployer(vargs);
        await contract.methods.addPermission("0xfefefefe", [alice, bob]).send({from: from});
        let flag = false;
        try {
            await contract.methods.addPermission("0xfefefefe", [alice, bob]).send({from: from});
            flag = true;
        } catch (error) {
        }
        if (flag) {
            throw("Should fail.")
        }
    });

    it('should not permit not existing doc ids', async function() {
        let vargs = basicInput;
        let contract = await deployer(vargs);
        await contract.methods.addPermission("0xfefefefe", [alice, bob]).send({from: from});
        assert.isFalse(await contract.methods.checkPermissions(alice, "0xfefefefa").call({from: from}));
        assert.isFalse(await contract.methods.checkPermissions(bob, "0xfefbfefa").call({from: from}));
    });
});

describe("Fire and forget contract", async function() {
    this.timeout(25000);

    const basicInput = {
        _: [ 'permission' ],
        c: 'PermissioningFireAndForget',
        contract: 'PermissioningFireAndForget',
        docid: "0xfefefefe",
        d: "0xfefefefe",
        accounts: [alice, bob],
        acc: [alice, bob],
        from: undefined,
        f: undefined,
        rpc: 'http://localhost:8545',
        r: 'http://localhost:8545',
        '$0': 'deploy.js',
    };
    
    it('should deploy', async function() {
        let vargs = basicInput;
        let contract = await deployer(vargs);
        assert.exists(contract.options.address);
        assert.isNotEmpty(contract.options.address);
    });

    it('should permit correctly', async function() {
        let vargs = basicInput;
        let contract = await deployer(vargs);
        await checkPermissionsTrue(contract);
    });

    it('should not permit not existing doc ids', async function() {
        let vargs = basicInput;
        let contract = await deployer(vargs);
        assert.isFalse(await contract.methods.checkPermissions(alice, "0xfefefefa").call({from: from}));
        assert.isFalse(await contract.methods.checkPermissions(bob, "0xfefbfefa").call({from: from}));
    });
});

describe("No doc contract", async function() {
    this.timeout(25000);

    const basicInput = {
        _: [ 'permission' ],
        c: 'PermissioningNoDoc',
        contract: 'PermissioningNoDoc',
        docid: undefined,
        d: undefined,
        accounts: [alice, bob],
        acc: [alice, bob],
        from: undefined,
        f: undefined,
        rpc: 'http://localhost:8545',
        r: 'http://localhost:8545',
        '$0': 'deploy.js',
    };
    
    it('should deploy', async function() {
        let vargs = basicInput;
        let contract = await deployer(vargs);
        assert.exists(contract.options.address);
        assert.isNotEmpty(contract.options.address);
    });

    it('should permit correctly', async function() {
        let vargs = basicInput;
        let contract = await deployer(vargs);
        await checkPermissionsTrue(contract);
    });

});

describe("Static contract", async function() {
    this.timeout(25000);

    const basicInput = {
        _: [ 'permission' ],
        c: 'PermissioningStatic',
        contract: 'PermissioningStatic',
        docid: undefined,
        d: undefined,
        accounts: [],
        acc: [],
        from: undefined,
        f: undefined,
        rpc: 'http://localhost:8545',
        r: 'http://localhost:8545',
        '$0': 'deploy.js',
    };
    
    it('should deploy', async function() {
        let vargs = basicInput;
        let contract = await deployer(vargs);
        assert.exists(contract.options.address);
        assert.isNotEmpty(contract.options.address);
    });

    it('should permit correctly', async function() {
        let vargs = basicInput;
        let contract = await deployer(vargs);

        let allowed = await contract.methods.checkPermissions(alice, "0x45ce99addb0f8385bd24f30da619ddcc0cadadab73e2a4ffb7801083086b3fc2").call();
        assert.isTrue(allowed);
        allowed = await contract.methods.checkPermissions(bob, "0x45ce99addb0f8385bd24f30da619ddcc0cadadab73e2a4ffb7801083086b3fc2").call();
        assert.isTrue(allowed);
        allowed = await contract.methods.checkPermissions(charlie, "0x45ce99addb0f8385bd24f30da619ddcc0cadadab73e2a4ffb7801083086b3fc2").call();
        assert.isFalse(allowed);
    });
});