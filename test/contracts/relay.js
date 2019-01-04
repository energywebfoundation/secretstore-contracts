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
const ContractRelayJSON = require(path.join(__dirname, "../../build/contracts/PermissioningRelay.json"));
const ContractRegistryJSON = require(path.join(__dirname, "../../build/contracts/PermissioningRegistry.json"));
const nullAddress = "0x0000000000000000000000000000000000000000";
const testDoc = "0xfefefefe";

let from;
let accounts;
web3.eth.getAccounts().then((accs) => {
    accounts = accs;
    from = accs[0];
});

async function checkPermissionsTrue(contract) {
    let allowed = await contract.methods.checkPermissions(alice, testDoc).call();
    assert.isTrue(allowed);
    allowed = await contract.methods.checkPermissions(bob, testDoc).call();
    assert.isTrue(allowed);
    allowed = await contract.methods.checkPermissions(charlie, testDoc).call();
    assert.isFalse(allowed);
}

let address;

describe("Permissioning relay contract", async function() {
    this.timeout(25000);

    before(async function() {
        address = await tutils.addresses(web3);
    });

    it('should deploy successfully', async function() {
        let instance = await tutils.deployRelay(web3, [address.query, address.registry], {from:from});
        assert.exists(instance.options.address);
        assert.isNotEmpty(instance.options.address);
    });

    it('should emit event upon deployment', async function() {
        tutils.deployRelay(web3, [address.query, address.registry], {from:from})
        .on('confirmation', function(confirmationNumber, receipt){
            assert.isTrue(receipt.events.hasOwnProperty("NewPermissioningContract"));
        })
        .then(function(instance){
            assert.exists(instance.options.address);
            assert.isNotEmpty(instance.options.address);
        });
    });

    it('should not allow to deploy with permissioning contract address 0x0', async function() {
        await expect(tutils.deployRelay(web3, [address.query, nullAddress], {from:from}))
            .to.be.rejectedWith(Error);
    });

    it('should not allow to deploy with erc165 query contract with address 0x0', async function() {
        await expect(tutils.deployRelay(web3, [nullAddress, address.registry], {from:from}))
            .to.be.rejectedWith(Error);
    });

    it('should not allow to deploy with permissioning contract which does not implement the interface', async function() {
        await expect(tutils.deployRelay(web3, [address.query, "0x0000000000000000000000000000000000000005"], {from:from}))
            .to.be.rejectedWith(Error);
    });

    it('should not allow not-owners to change permissioning contract address', async function() {
        let contract = await tutils.deployRelay(web3, [address.query, address.registry], {from: from});
        await expect(contract.methods.setPermissioningContract("0x7c495Cc4f2c4B0bfb2dc64EE04c7D7004B7c434F").send({from: accounts[1]}))
            .to.be.rejectedWith(Error);
    });

    it('should not allow owners to set permissioning address to the relay address', async function() {
        let contract = await tutils.deployRelay(web3, [address.query, address.registry], {from: from});
        await expect(contract.methods.setPermissioningContract(contract.options.address).send({from: from}))
            .to.be.rejectedWith(Error);
    });

    it('should not allow owners to set permissioning address to the same current registry address', async function() {
        let contract = await tutils.deployRelay(web3, [address.query, address.registry], {from: from});
        await expect(contract.methods.setPermissioningContract(address.registry).send({from: from}))
            .to.be.rejectedWith(Error);
    });

    it('should allow owners to change permissioning contract address', async function() {
        let contract = await tutils.deployRelay(web3, [address.query, address.registry], {from: from});
        let registry = await tutils.deployRegistry(web3, [], {from: from});
        let res = await contract.methods.setPermissioningContract(registry.options.address).send({from: from});
        assert.isTrue(res.status);
    });

    it('should emit event on permissioning contract address change', async function() {
        let contract = await tutils.deployRelay(web3, [address.query, address.registry], {from: from});
        let registry = await tutils.deployRegistry(web3, [], {from: from});
        let res = await contract.methods.setPermissioningContract(registry.options.address).send({from: from});
        assert.isTrue(res.events.hasOwnProperty("NewPermissioningContract"));
    });

    it('should add old permisssioning contract address to the array', async function() {
        let contract = await tutils.deployRelay(web3, [address.query, address.registry], {from: from});
        let registry = await tutils.deployRegistry(web3, [], {from: from});
        let res = await contract.methods.setPermissioningContract(registry.options.address).send({from: from});
        let old = await contract.methods.oldPermissioningContracts(0).call();
        assert.equal(web3.utils.toChecksumAddress(address.registry), old);
    });

    it('should query permissions correctly', async function() {
        let contract = await tutils.deployRelay(web3, [address.query, address.registry], {from: from});
        let registry = new web3.eth.Contract(ContractRegistryJSON.abi, address.registry);
        await registry.methods.permission(testDoc, [alice, bob]).send({from: from});
        checkPermissionsTrue(contract);
        assert.isFalse(await contract.methods.checkPermissions(alice, testDoc).call());
    });

    it('should set new query contract', async function() {
        let contract = await tutils.deployRelay(web3, [address.query, address.registry], {from: from});
        // this is just a dummy address
        let result = await contract.methods.setERC165Query(charlie).send({from: from});
        assert.isTrue(result.status);
        assert.equal(web3.utils.toChecksumAddress(charlie), await contract.methods.erc165Query().call());

    });

    it('should not set invalid query contract', async function() {
        let contract = await tutils.deployRelay(web3, [address.query, address.registry], {from: from});
        // this is just a dummy address
        await expect(contract.methods.setERC165Query(nullAddress).send({from: from}))
            .to.be.rejectedWith(Error);
    });

    it('should not set query contract if non-owner', async function() {
        let contract = await tutils.deployRelay(web3, [address.query, address.registry], {from: from});
        // this is just a dummy address
        await expect(contract.methods.setERC165Query(charlie).send({from: accounts[1]}))
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
