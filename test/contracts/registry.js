const path = require("path");
const ERC165Query = artifacts.require("../../contracts/ERC165Query.sol");
const PermissioningRegistry = artifacts.require("../../contracts/PermissioningRegistry.sol");
const NonERC165Contract = artifacts.require("../../contracts/simplepermissioning/PermissioningDynamic.sol");

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bn')(web3.utils.BN))
    .should();

const {
    EMPTY_ADDRESS
} = require(path.join(__dirname, "../utils.js"));

const testDoc = "0xfefefefe00000000000000000000000000000000000000000000000000000000";

contract("Permissioning registry", function (accounts) {
    let erc165query;
    let registry;
    let owner;

    before(async function() {
        erc165query = await ERC165Query.new();
    });

    beforeEach(async function() {
        owner = accounts[0];
        registry = await PermissioningRegistry.new({ from: owner }).should.be.fulfilled;
    });

    describe('constructor', async function () {
        it('should deploy successfully', async function() {
            registry.address.should.exist;
        });
    });


    describe('permission management', async function () {
        it('should add permission successfully', async function() {
            let rec = await registry.permission(testDoc, [accounts[1], accounts[2]], {from: owner})
                .should.be.fulfilled;
            let allowed = await registry.checkPermissions(accounts[1], testDoc);
            allowed.should.be.true;
            allowed = await registry.checkPermissions(accounts[2], testDoc);
            allowed.should.be.true;
            allowed = await registry.checkPermissions(accounts[3], testDoc);
            allowed.should.be.false;
        });

        it('should emit event on permisson add', async function() {
            let rec = await registry.permission(testDoc, [accounts[1], accounts[2]], {from: owner})
                .should.be.fulfilled;
            const currentBlocknumber = (await web3.eth.getBlockNumber());
            const events = await registry.getPastEvents(
                "Permission",
                {
                    "fromBlock": currentBlocknumber,
                    "toBlock": currentBlocknumber
                }
            );
            events.length.should.equal(1);
            events[0].args.document.should.be.deep.equal(testDoc);
        });

        it('should allow only admin to modify', async function() {
            let rec = await registry.permission(testDoc, [accounts[1], accounts[2]], {from: accounts[1]})
                .should.be.fulfilled;
            await registry.permission(testDoc, [accounts[3], accounts[2]], {from: accounts[2]})
                .should.be.rejectedWith();
        });

        it('should allow owner to modify anything', async function() {
            await registry.permission(testDoc, [accounts[3]], {from: accounts[1]})
                .should.be.fulfilled;
            let allowed = await registry.checkPermissions(accounts[1], testDoc);
            allowed.should.be.false;
            allowed = await registry.checkPermissions(accounts[2], testDoc);
            allowed.should.be.false;
            allowed = await registry.checkPermissions(accounts[3], testDoc);
            allowed.should.be.true;
            
            await registry.permission(testDoc, [accounts[1], accounts[2]], {from: owner})
                .should.be.fulfilled;
            allowed = await registry.checkPermissions(accounts[1], testDoc);
            allowed.should.be.true;
            allowed = await registry.checkPermissions(accounts[2], testDoc);
            allowed.should.be.true;
            allowed = await registry.checkPermissions(accounts[3], testDoc);
            allowed.should.be.false;
        });

        it('should allow admin to delete permission', async function() {
            await registry.permission(testDoc, [accounts[1], accounts[2]], {from: accounts[1]})
                .should.be.fulfilled;
            await registry.removePermission(testDoc, {from: accounts[1]})
                .should.be.fulfilled;
            (await registry.getAdmin(testDoc)).should.be.equal(EMPTY_ADDRESS);
            (await registry.getUsers(testDoc)).should.be.deep.equal([]);
        });

        it('should emit event on permission delete', async function() {
            await registry.permission(testDoc, [accounts[1], accounts[2]], {from: accounts[1]})
                .should.be.fulfilled;
            let rec = await registry.removePermission(testDoc, {from: accounts[1]})
                .should.be.fulfilled;
            const currentBlocknumber = (await web3.eth.getBlockNumber());
            const events = await registry.getPastEvents(
                "Permission",
                {
                    "fromBlock": currentBlocknumber,
                    "toBlock": currentBlocknumber
                }
            );
            events.length.should.equal(1);
            events[0].args.document.should.be.deep.equal(testDoc);
        });

        it('should allow owner to delete permission', async function() {
            await registry.permission(testDoc, [accounts[1], accounts[2]], {from: accounts[1]})
                .should.be.fulfilled;
            await registry.removePermission(testDoc, {from: owner})
                .should.be.fulfilled;
            (await registry.getAdmin(testDoc)).should.be.equal(EMPTY_ADDRESS);
            (await registry.getUsers(testDoc)).should.be.deep.equal([]);
        });

        it('should not allow unauthorized user to delete permission', async function() {
            await registry.permission(testDoc, [accounts[1], accounts[2]], {from: accounts[1]})
                .should.be.fulfilled;
            await registry.removePermission(testDoc, {from: accounts[2]})
                .should.be.rejectedWith();
        });
    });

    describe('admin', async function () {
        it('should change admin successfully', async function() {
            await registry.permission(testDoc, [accounts[3]], {from: accounts[1]}).should.be.fulfilled;
            await registry.setAdmin(testDoc, accounts[2], {from: accounts[1]}).should.be.fulfilled;
            web3.utils.toChecksumAddress(accounts[2]).should.be.deep.equal(await registry.getAdmin(testDoc));
        });

        it('should emit event on admin change', async function() {
            await registry.permission(testDoc, [accounts[3]], {from: accounts[1]});
            let rec = await registry.setAdmin(testDoc, accounts[2], {from: accounts[1]});
            const currentBlocknumber = (await web3.eth.getBlockNumber());
            const events = await registry.getPastEvents(
                "NewAdmin",
                {
                    "fromBlock": currentBlocknumber,
                    "toBlock": currentBlocknumber
                }
            );
            events.length.should.equal(1);
            events[0].args.document.should.be.deep.equal(testDoc);
        });

        it('should not allow new admin to be 0x0', async function() {
            await registry.permission(testDoc, [accounts[3]], {from: owner}).should.be.fulfilled;
            await registry.setAdmin(testDoc, EMPTY_ADDRESS, {from: owner})
                .should.be.rejectedWith();
        });

        it('should not allow unathorized person to change admin', async function() {
            await registry.permission(testDoc, [accounts[3]], {from: accounts[1]}).should.be.fulfilled;
            await registry.setAdmin(testDoc, accounts[2], {from: accounts[2]})
                .should.be.rejectedWith();
        });

        it('should allow owner to change admin', async function() {
            await registry.permission(testDoc, [accounts[3]], {from: accounts[1]})
                .should.be.fulfilled;
            await registry.setAdmin(testDoc, accounts[2], {from: owner})
                .should.be.fulfilled;
            web3.utils.toChecksumAddress(accounts[2]).should.be.equal(await registry.getAdmin(testDoc));
        });
    });

    
    describe('exposed', async function () {
        it('should not be exposed uninitialized', async function() {
            let exposed = await registry.isExposed(testDoc);
            exposed.should.be.false;
        });

        it('should not be exposed by default', async function() {
            await registry.permission(testDoc, [accounts[3]], {from: accounts[1]})
                .should.be.fulfilled;
            let exposed = await registry.isExposed(testDoc);
            exposed.should.be.false;
        });

        it('should allow owner to change exposed', async function() {
            await registry.permission(testDoc, [accounts[3]], {from: accounts[1]})
                .should.be.fulfilled;
            await registry.setExposed(testDoc, true, {from: accounts[1]})
                .should.be.fulfilled;
            let exposed = await registry.isExposed(testDoc);
            exposed.should.be.true;
        });

        it('should not allow not-owner to change exposed', async function() {
            await registry.permission(testDoc, [accounts[3]], {from: accounts[1]});
            await registry.setExposed(testDoc, true, {from: accounts[2]})
                .should.be.rejectedWith();
        });

        it('should always return true on an initialized exposed entry', async function() {
            await registry.permission(testDoc, [accounts[3]], {from: accounts[1]})
                .should.be.fulfilled;
            await registry.setExposed(testDoc, true, {from: accounts[1]})
                .should.be.fulfilled;
            let exposed = await registry.isExposed(testDoc);
            exposed.should.be.true;
            let allowed = await registry.checkPermissions(accounts[1], testDoc);
            allowed.should.be.true;
            allowed = await registry.checkPermissions(accounts[2], testDoc);
            allowed.should.be.true;
            allowed = await registry.checkPermissions(accounts[3], testDoc);
            allowed.should.be.true;
        });
    });
    
    describe('permission check', async function () {
        it('should not allow uninitialized permission to return true', async function() {
            let allowed = await registry.checkPermissions(accounts[3], testDoc);
            allowed.should.be.false;
        });

        it('should not allow default permission to return true on unexposed entry', async function() {
            await registry.permission(testDoc, [accounts[3]], {from: accounts[1]})
                .should.be.fulfilled;
            let allowed = await registry.checkPermissions(accounts[2], testDoc);
            allowed.should.be.false;
        });
    });

    describe('user change', async function () {
        it('should change users successfully', async function() {
            await registry.permission(testDoc, [accounts[3]], {from: accounts[1]})
                .should.be.fulfilled;
            await registry.setUsers(testDoc, [accounts[1], accounts[2]], {from: accounts[1]})
                .should.be.fulfilled;
            [web3.utils.toChecksumAddress(accounts[1]), web3.utils.toChecksumAddress(accounts[2])]
                .should.be.deep.equal(await registry.getUsers(testDoc));
        });

        it('should change users successfully to empty', async function() {
            await registry.permission(testDoc, [accounts[3]], {from: accounts[1]})
                .should.be.fulfilled;
            await registry.setUsers(testDoc, [], {from: accounts[1]})
                .should.be.fulfilled;
            (await registry.getUsers(testDoc)).should.be.deep.equal([]);
        });

        it('should emit event on users change', async function() {
            await registry.permission(testDoc, [accounts[3]], {from: accounts[1]})
                .should.be.fulfilled;
            let rec = await registry.setUsers(testDoc, [accounts[1], accounts[2]], {from: accounts[1]})
                .should.be.fulfilled;
            const currentBlocknumber = (await web3.eth.getBlockNumber());
            const events = await registry.getPastEvents(
                "Permission",
                {
                    "fromBlock": currentBlocknumber,
                    "toBlock": currentBlocknumber
                }
            );
            events.length.should.equal(1);
            events[0].args.document.should.be.deep.equal(testDoc);
        });

        it('should not allow unathorized person to change users', async function() {
            await registry.permission(testDoc, [accounts[3]], {from: accounts[1]})
                .should.be.fulfilled;
            await registry.setUsers(testDoc, [accounts[1], accounts[2]], {from: accounts[2]})
                .should.be.rejectedWith();
        });

        it('should allow owner to change users', async function() {
            await registry.permission(testDoc, [accounts[3]], {from: accounts[1]})
                .should.be.fulfilled;
            await registry.setUsers(testDoc, [accounts[1], accounts[2]], {from: owner})
                .should.be.fulfilled;
            (await registry.getUsers(testDoc)).should.be.deep.equal([web3.utils.toChecksumAddress(accounts[1]), web3.utils.toChecksumAddress(accounts[2])]);
        });

        it('should allow admin to add users', async function() {
            await registry.permission(testDoc, [accounts[1]], {from: accounts[1]})
                .should.be.fulfilled;
            await registry.addUser(testDoc, accounts[2], {from: accounts[1]})
                .should.be.fulfilled;
            (await registry.getUsers(testDoc)).should.be.deep.equal([web3.utils.toChecksumAddress(accounts[1]), web3.utils.toChecksumAddress(accounts[2])]);
        });

        it('should allow owner to add users', async function() {
            await registry.permission(testDoc, [accounts[1]], {from: accounts[1]})
                .should.be.fulfilled;
            await registry.addUser(testDoc, accounts[2], {from: owner})
                .should.be.fulfilled;
            (await registry.getUsers(testDoc)).should.be.deep.equal([web3.utils.toChecksumAddress(accounts[1]), web3.utils.toChecksumAddress(accounts[2])]);
        });

        it('should emit event on user add', async function() {
            await registry.permission(testDoc, [accounts[1]], {from: accounts[1]})
                .should.be.fulfilled;
            let rec = await registry.addUser(testDoc, accounts[2], {from: accounts[1]})
                .should.be.fulfilled;
            const currentBlocknumber = (await web3.eth.getBlockNumber());
            const events = await registry.getPastEvents(
                "Permission",
                {
                    "fromBlock": currentBlocknumber,
                    "toBlock": currentBlocknumber
                }
            );
            events.length.should.equal(1);
            events[0].args.document.should.be.deep.equal(testDoc);
        });
    });
    
    describe('erc1645', async function () {
        it('should support the erc165 interface', async function() {
            (await registry.supportsInterface("0x01ffc9a7")).should.be.true;
        });

        it('should not support the 0xffffffff interface', async function() {
            (await registry.supportsInterface("0xffffffff")).should.be.false;
        });

        it('should support the secret store permissioning interface', async function() {
            (await registry.supportsInterface("0xb36a9a7c")).should.be.true;
        });
    });
});