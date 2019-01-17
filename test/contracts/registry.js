"use strict";

const path = require('path');

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const assert = chai.assert;
const expect = chai.expect;

const web3 = new (require('web3'))("http://127.0.0.1:8545");

const alice = "0x3144de21da6de18061f818836fa3db8f3d6b6989";
const bob = "0x6c4b8b199a41b721e0a95df9860cf0a18732e76d";
const charlie = "0x8b2c16e09bfb011c5e4883cedb105124ccf01af7";

const tutils = require(path.join(__dirname, "../testutils.js"));

const ContractQueryJSON = require(path.join(__dirname, "../../build/contracts/ERC165Query.json"));
const ContractRegistryJSON = require(path.join(__dirname, "../../build/contracts/PermissioningRegistry.json"));
const nullAddress = "0x0000000000000000000000000000000000000000";
const testDoc = "0xfefefefe";

async function checkPermissionsTrue(contract) {
    let allowed = await contract.methods.checkPermissions(alice, testDoc).call();
    assert.isTrue(allowed);
    allowed = await contract.methods.checkPermissions(bob, testDoc).call();
    assert.isTrue(allowed);
    allowed = await contract.methods.checkPermissions(charlie, testDoc).call();
    assert.isFalse(allowed);
}

describe("Permissioning registry contract", async function() {
    this.timeout(25000);

    let from;
    let accounts;

    before(async function() {
        accounts = await web3.eth.getAccounts();
        from = accounts[0];
    });

    it('should deploy successfully', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        assert.exists(instance.options.address);
        assert.isNotEmpty(instance.options.address);
    });

    it('should add permission successfully', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        
        let rec = await instance.methods.permission(testDoc, [alice, bob]).send({from: from});
        checkPermissionsTrue(instance);
    });

    it('should emit event on permisson add', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        
        let rec = await instance.methods.permission(testDoc, [alice, bob]).send({from: from});
        assert.isTrue(rec.events.hasOwnProperty("Permission"));
    });

    it('should allow only admin to modify', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        let rec = await instance.methods.permission(testDoc, [alice, bob]).send({from: accounts[1]});
        assert.isTrue(rec.status);
        await expect(instance.methods.permission(testDoc, [charlie, bob]).send({from: accounts[2]}))
            .to.be.rejectedWith(Error);
    });

    it('should allow owner to modify anything', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        await instance.methods.permission(testDoc, [charlie]).send({from: accounts[1]});
        await instance.methods.permission(testDoc, [alice, bob]).send({from: from});
        checkPermissionsTrue(instance);
    });

    it('should change admin successfully', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        await instance.methods.permission(testDoc, [charlie]).send({from: accounts[1]});
        await instance.methods.setAdmin(testDoc, accounts[2]).send({from: accounts[1]});
        assert.equal(await instance.methods.getAdmin(testDoc).call(), web3.utils.toChecksumAddress(accounts[2]));
    });

    it('should emit event on admin change', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        await instance.methods.permission(testDoc, [charlie]).send({from: accounts[1]});
        let rec = await instance.methods.setAdmin(testDoc, accounts[2]).send({from: accounts[1]});
        assert.isTrue(rec.events.hasOwnProperty("NewAdmin"));
    });

    it('should not allow new admin to be 0x0', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        await instance.methods.permission(testDoc, [charlie]).send({from: from});
        await expect(instance.methods.setAdmin(testDoc, nullAddress).send({from: from}))
            .to.be.rejectedWith(Error);
    });

    it('should not allow unathorized person to change admin', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        await instance.methods.permission(testDoc, [charlie]).send({from: accounts[1]});
        await expect(instance.methods.setAdmin(testDoc, accounts[2]).send({from: accounts[2]}))
            .to.be.rejectedWith(Error);
    });

    it('should allow owner to change admin', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        await instance.methods.permission(testDoc, [charlie]).send({from: accounts[1]});
        await instance.methods.setAdmin(testDoc, accounts[2]).send({from: from});
        assert.equal(await instance.methods.getAdmin(testDoc).call(), web3.utils.toChecksumAddress(accounts[2]));
    });

    it('should not be exposed uninitialized', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        let exposed = await instance.methods.isExposed(testDoc).call();
        assert.isFalse(exposed);
    });

    it('should not be exposed by default', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        await instance.methods.permission(testDoc, [charlie]).send({from: accounts[1]});
        let exposed = await instance.methods.isExposed(testDoc).call();
        assert.isFalse(exposed);
    });

    it('should not allow uninitialized permission to return true', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        let allowed = await instance.methods.checkPermissions(charlie, testDoc).call();
        assert.isFalse(allowed);
    });

    it('should not allow default permission to return true on unexposed entry', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        await instance.methods.permission(testDoc, [charlie]).send({from: accounts[1]});
        let allowed = await instance.methods.checkPermissions(bob, testDoc).call();
        assert.isFalse(allowed);
    });
    
    it('should allow owner to change exposed', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        await instance.methods.permission(testDoc, [charlie]).send({from: accounts[1]});
        await instance.methods.setExposed(testDoc, true).send({from: accounts[1]});
        let exposed = await instance.methods.isExposed(testDoc).call();
        assert.isTrue(exposed);
    });

    it('should not allow not-owner to change exposed', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        await instance.methods.permission(testDoc, [charlie]).send({from: accounts[1]});
        await expect(instance.methods.setExposed(testDoc, true).send({from: accounts[2]}))
            .to.be.rejectedWith(Error);
    });

    it('should always return true on an initialized exposed entry', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        await instance.methods.permission(testDoc, [charlie]).send({from: accounts[1]});
        await instance.methods.setExposed(testDoc, true).send({from: accounts[1]});
        let exposed = await instance.methods.isExposed(testDoc).call();
        assert.isTrue(exposed);
        let allowed = await instance.methods.checkPermissions(alice, testDoc).call();
        assert.isTrue(allowed);
        allowed = await instance.methods.checkPermissions(bob, testDoc).call();
        assert.isTrue(allowed);
        allowed = await instance.methods.checkPermissions(charlie, testDoc).call();
        assert.isTrue(allowed);
    });

    it('should change users successfully', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        await instance.methods.permission(testDoc, [charlie]).send({from: accounts[1]});
        await instance.methods.setUsers(testDoc, [alice, bob]).send({from: accounts[1]});
        assert.deepEqual(await instance.methods.getUsers(testDoc).call(), [web3.utils.toChecksumAddress(alice), web3.utils.toChecksumAddress(bob)]);
    });

    it('should change users successfully to empty', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        await instance.methods.permission(testDoc, [charlie]).send({from: accounts[1]});
        await instance.methods.setUsers(testDoc, []).send({from: accounts[1]});
        assert.deepEqual(await instance.methods.getUsers(testDoc).call(), []);
    });

    it('should emit event on users change', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        await instance.methods.permission(testDoc, [charlie]).send({from: accounts[1]});
        let rec = await instance.methods.setUsers(testDoc, [alice, bob]).send({from: accounts[1]});
        assert.isTrue(rec.events.hasOwnProperty("Permission"));
    });

    it('should not allow unathorized person to change users', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        await instance.methods.permission(testDoc, [charlie]).send({from: accounts[1]});
        await expect(instance.methods.setUsers(testDoc, [alice, bob]).send({from: accounts[2]}))
            .to.be.rejectedWith(Error);
    });

    it('should allow owner to change users', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        await instance.methods.permission(testDoc, [charlie]).send({from: accounts[1]});
        await instance.methods.setUsers(testDoc, [alice, bob]).send({from: from});
        assert.deepEqual(await instance.methods.getUsers(testDoc).call(), [web3.utils.toChecksumAddress(alice), web3.utils.toChecksumAddress(bob)]);
    });

    it('should allow admin to add users', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        await instance.methods.permission(testDoc, [alice]).send({from: accounts[1]});
        await instance.methods.addUser(testDoc, bob).send({from: accounts[1]});
        assert.deepEqual(await instance.methods.getUsers(testDoc).call(), [web3.utils.toChecksumAddress(alice), web3.utils.toChecksumAddress(bob)]);
    });

    it('should allow owner to add users', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        await instance.methods.permission(testDoc, [alice]).send({from: accounts[1]});
        await instance.methods.addUser(testDoc, bob).send({from: from});
        assert.deepEqual(await instance.methods.getUsers(testDoc).call(), [web3.utils.toChecksumAddress(alice), web3.utils.toChecksumAddress(bob)]);
    });

    it('should emit event on user add', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        await instance.methods.permission(testDoc, [alice]).send({from: accounts[1]});
        let rec = await instance.methods.addUser(testDoc, bob).send({from: accounts[1]});
        assert.isTrue(rec.events.hasOwnProperty("Permission"));
    });

    it('should allow admin to delete permission', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        await instance.methods.permission(testDoc, [alice, bob]).send({from: accounts[1]});
        await instance.methods.removePermission(testDoc).send({from: accounts[1]});
        assert.equal(await instance.methods.getAdmin(testDoc).call(), nullAddress);
        assert.deepEqual(await instance.methods.getUsers(testDoc).call(), []);
    });

    it('should emit event on permission delete', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        await instance.methods.permission(testDoc, [alice, bob]).send({from: accounts[1]});
        let rec = await instance.methods.removePermission(testDoc).send({from: accounts[1]});
        assert.isTrue(rec.events.hasOwnProperty("Permission"));
    });

    it('should allow owner to delete permission', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        await instance.methods.permission(testDoc, [alice, bob]).send({from: accounts[1]});
        await instance.methods.removePermission(testDoc).send({from: from});
        assert.equal(await instance.methods.getAdmin(testDoc).call(), nullAddress);
        assert.deepEqual(await instance.methods.getUsers(testDoc).call(), []);
    });

    it('should not allow unauthorized user to delete permission', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        await instance.methods.permission(testDoc, [alice, bob]).send({from: accounts[1]});
        await expect(instance.methods.removePermission(testDoc).send({from: accounts[2]}))
            .to.be.rejectedWith(Error);
    });

    it('should support the erc165 interface', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        assert.isTrue(await instance.methods.supportsInterface("0x01ffc9a7").call());
    });

    it('should not support the 0xffffffff interface', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        assert.isFalse(await instance.methods.supportsInterface("0xffffffff").call());
    });

    it('should support the secret store permissioning interface', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        assert.isTrue(await instance.methods.supportsInterface("0xb36a9a7c").call());
    });

    it('should support the ownable interface', async function() {
        let instance = await tutils.deployRegistry(web3, [], {from: from});
        assert.isTrue(await instance.methods.supportsInterface("0x813ae5ed").call());
    });

});
