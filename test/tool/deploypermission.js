"use strict";

const path = require('path');

const assert = require('chai').assert;
const expect = require('chai').expect;
const web3 = new (require('web3'))("http://127.0.0.1:8545");

const deployer = require(path.join(__dirname, "../../tools/deploypermission.js"));


describe("Dynamic permissioning contract", async () => {
    let accounts, basicInput;
    let from, alice, bob, charlie;

    before(async () => {
        accounts = await require(path.join(__dirname, "../utils.js")).accounts("http://localhost:8545");
        from = accounts[0];
        alice = accounts[1];
        bob = accounts[2];
        charlie = accounts[3];

        basicInput = {
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
            '$0': 'deploypermission.js',
        };
    });

    it('should deploy', async () => {
        let contract = await deployer(basicInput);
        assert.exists(contract.options.address);
        assert.isNotEmpty(contract.options.address);
    });

    it('should add new permission correctly', async () => {
        let vargs = basicInput;
        let contract = await deployer(vargs);
        await contract.methods.addPermission("0xfefefefe", [alice, bob]).send({from: from});
        let allowed = await contract.methods.checkPermissions(alice, "0xfefefefe").call();
        assert.isTrue(allowed);
        allowed = await contract.methods.checkPermissions(bob, "0xfefefefe").call();
        assert.isTrue(allowed);
        allowed = await contract.methods.checkPermissions(charlie, "0xfefefefe").call();
        assert.isFalse(allowed);
    });

    it('should not add already existing document key permission', async () => {
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

    it('should not permit not existing doc ids', async () => {
        let vargs = basicInput;
        let contract = await deployer(vargs);
        await contract.methods.addPermission("0xfefefefe", [alice, bob]).send({from: from});
        assert.isFalse(await contract.methods.checkPermissions(alice, "0xfefefefa").call({from: from}));
        assert.isFalse(await contract.methods.checkPermissions(bob, "0xfefbfefa").call({from: from}));
    });
});

describe("Fire and forget contract", async () => {

    let accounts, basicInput;
    let from, alice, bob, charlie;

    before(async () => {
        accounts = await require(path.join(__dirname, "../utils.js")).accounts("http://localhost:8545");
        from = accounts[0];
        alice = accounts[1];
        bob = accounts[2];
        charlie = accounts[3];
        
        basicInput = {
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
            '$0': 'deploypermission.js',
        };
    });
    
    it('should deploy', async () => {
        let contract = await deployer(basicInput);
        assert.exists(contract.options.address);
        assert.isNotEmpty(contract.options.address);
    });

    it('should permit correctly', async () => {
        let contract = await deployer(basicInput);
        let allowed = await contract.methods.checkPermissions(alice, "0xfefefefe").call();
        assert.isTrue(allowed);
        allowed = await contract.methods.checkPermissions(bob, "0xfefefefe").call();
        assert.isTrue(allowed);
        allowed = await contract.methods.checkPermissions(charlie, "0xfefefefe").call();
        assert.isFalse(allowed);
    });

    it('should not permit not existing doc ids', async () => {
        let contract = await deployer(basicInput);
        assert.isFalse(await contract.methods.checkPermissions(alice, "0xfefefefa").call({from: from}));
        assert.isFalse(await contract.methods.checkPermissions(bob, "0xfefbfefa").call({from: from}));
    });
});

describe("No doc contract", async () => {

    let accounts, basicInput;
    let from, alice, bob, charlie;

    before(async () => {
        accounts = await require(path.join(__dirname, "../utils.js")).accounts("http://localhost:8545");
        from = accounts[0];
        alice = accounts[1];
        bob = accounts[2];
        charlie = accounts[3];

        basicInput = {
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
            '$0': 'deploypermission.js',
        };
    });
    
    it('should deploy', async () => {
        let contract = await deployer(basicInput);
        assert.exists(contract.options.address);
        assert.isNotEmpty(contract.options.address);
    });

    it('should permit correctly', async () => {
        let contract = await deployer(basicInput);
        let allowed = await contract.methods.checkPermissions(alice, "0xfefefefe").call();
        assert.isTrue(allowed);
        allowed = await contract.methods.checkPermissions(bob, "0xfefefefe").call();
        assert.isTrue(allowed);
        allowed = await contract.methods.checkPermissions(charlie, "0xfefefefe").call();
        assert.isFalse(allowed);
    });

});

describe("Static contract", async () => {

    let accounts, basicInput;
    let from, alice, bob, charlie;

    before(async () => {
        accounts = await require(path.join(__dirname, "../utils.js")).accounts("http://localhost:8545");
        from = accounts[0];
        alice = accounts[1];
        bob = accounts[2];
        charlie = accounts[3];

        basicInput = {
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
            '$0': 'deploypermission.js',
        };
    });

    
    
    it('should deploy', async () => {
        let contract = await deployer(basicInput);
        assert.exists(contract.options.address);
        assert.isNotEmpty(contract.options.address);
    });

    it('should permit correctly', async () => {
        let contract = await deployer(basicInput);

        let allowed = await contract.methods.checkPermissions(alice, "0x45ce99addb0f8385bd24f30da619ddcc0cadadab73e2a4ffb7801083086b3fc2").call();
        assert.isFalse(allowed);
        allowed = await contract.methods.checkPermissions(bob, "0x45ce99addb0f8385bd24f30da619ddcc0cadadab73e2a4ffb7801083086b3fc2").call();
        assert.isFalse(allowed);
        allowed = await contract.methods.checkPermissions(charlie, "0x45ce99addb0f8385bd24f30da619ddcc0cadadab73e2a4ffb7801083086b3fc2").call();
        assert.isFalse(allowed);
    });
});
