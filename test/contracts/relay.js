const path = require("path");
const ERC165Query = artifacts.require("../../contracts/ERC165Query.sol");
const PermissioningRelay = artifacts.require("../../contracts/PermissioningRelay.sol");
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

const ERR_ZERO_ADDRESS_ERC165 = "ERC 165 Query contract address cannot be 0x0";
const ERR_ZER_ADDRESS_REGISTRY = "Permissioning contract address cannot be 0x0";
const ERR_NO_INTERFACE = "Provided contract does not implement the 'checkPermissions' function, or does not support ERC-165";
const ERR_RELAY = "New permissioning contract cannot be this relay";
const ERR_REG_OLD = "New permissioning contract address cannot be the same as the old one";
const ERR_NOT_OWNER = "Ownable: caller is not the owner";

contract("Permissioning relay", function (accounts) {
    let erc165query;
    let relay;
    let registry;
    let owner;

    before(async function() {
        erc165query = await ERC165Query.new().should.be.fulfilled;
    });

    beforeEach(async function() {
        owner = accounts[0];
        registry = await PermissioningRegistry.new({ from: owner }).should.be.fulfilled;
        relay = await PermissioningRelay.new(erc165query.address, registry.address, { from: owner }).should.be.fulfilled;
    });

    describe('constructor', async function () {
        
        it('should deploy successfully', async function() {
            relay.address.should.exist;
            relay.address.should.not.be.equal(EMPTY_ADDRESS);
        });

        it('should emit event upon deployment', async function() {
            const currentBlocknumber = (await web3.eth.getBlockNumber());
            const events = await relay.getPastEvents(
                "NewPermissioningContract",
                {
                    "fromBlock": currentBlocknumber,
                    "toBlock": currentBlocknumber
                }
            );
            events.length.should.equal(1);
            events[0].args.newContractAddress.should.be.deep.equal(registry.address);
        });

        it('should not allow to deploy with permissioning contract address 0x0', async function() {
            await PermissioningRelay.new(accounts[0], EMPTY_ADDRESS, { from: owner })
                .should.be.rejectedWith(ERR_ZER_ADDRESS_REGISTRY);
        });

        it('should not allow to deploy with erc165 query contract with address 0x0', async function() {
            await PermissioningRelay.new(EMPTY_ADDRESS, accounts[0], { from: owner })
                .should.be.rejectedWith(ERR_ZERO_ADDRESS_ERC165);
        });

        it('should not allow to deploy with permissioning contract which does not implement the interface', async function() {
            await PermissioningRelay.new(erc165query.address, "0x0000000000000000000000000000000000000005", {from: owner})
                .should.be.rejectedWith(ERR_NO_INTERFACE)
        });
    })


    describe('setPermissioningContract', async function () {
        it('should not allow not-owners to change permissioning contract address v1', async function() {
            let instace = await NonERC165Contract.new()
            await relay.setPermissioningContract(instace.address).should.be.rejectedWith(ERR_NO_INTERFACE)
        });

        it('should not allow not-owners to change permissioning contract address v2', async function() {
            let instace = await ERC165Query.new()
            await relay.setPermissioningContract(instace.address).should.be.rejectedWith(ERR_NO_INTERFACE)
        });

        it('should not allow owners to set permissioning address to the relay address', async function() {
            await relay.setPermissioningContract(relay.address, { from: owner })
                .should.be.rejectedWith(ERR_RELAY);
        });

        it('should not allow owners to set permissioning address to the same current registry address', async function() {
            await relay.setPermissioningContract(registry.address, {from: owner})
                .should.be.rejectedWith(ERR_REG_OLD);
        });

        it('should allow owners to change permissioning contract address', async function() {
            let tempregistry = await PermissioningRegistry.new({ from: owner }).should.be.fulfilled;
            let res = await relay.setPermissioningContract(tempregistry.address, { from: owner }).should.be.fulfilled;
        });

        it('should emit event on permissioning contract address change', async function() {
            let tempregistry = await PermissioningRegistry.new({ from: owner }).should.be.fulfilled;
            let res = await relay.setPermissioningContract(tempregistry.address, { from: owner }).should.be.fulfilled;
            const currentBlocknumber = await web3.eth.getBlockNumber();
            const events = await relay.getPastEvents(
                "NewPermissioningContract",
                {
                    "fromBlock": currentBlocknumber,
                    "toBlock": currentBlocknumber
                }
            );
            events.length.should.equal(1);
            events[0].args.newContractAddress.should.be.deep.equal(tempregistry.address);
        });

        it('should add old permisssioning contract address to the array', async function() {
            let tempregistry = await PermissioningRegistry.new({ from: owner }).should.be.fulfilled;
            let res = await relay.setPermissioningContract(tempregistry.address, { from: owner }).should.be.fulfilled;
            let old = await relay.oldPermissioningContracts(0);
            registry.address.should.be.equal(old);
        });
    })

    describe('erc165 support', async function () {

        it('should set new query contract', async function() {
            // this is just a dummy address
            await relay.setERC165Query(accounts[3], {from: owner}).should.be.fulfilled;
            (await relay.erc165Query()).should.be.equal(web3.utils.toChecksumAddress(accounts[3]));
        });

        it('should not set invalid query contract', async function() {
            // this is just a dummy address
            await relay.setERC165Query(EMPTY_ADDRESS, {from: owner})
                .should.be.rejectedWith(ERR_ZERO_ADDRESS_ERC165);
        });

        it('should not set query contract if non-owner', async function() {
            // this is just a dummy address
            await relay.setERC165Query(accounts[3], {from: accounts[1]})
                .should.be.rejectedWith(ERR_NOT_OWNER);
        });

        it('should support the erc165 interface', async function() {
            (await relay.supportsInterface("0x01ffc9a7")).should.be.true;
        });

        it('should not support the 0xffffffff interface', async function() {
            (await relay.supportsInterface("0xffffffff")).should.be.false;
        });

        it('should support the secret store permissioning interface', async function() {
            (await relay.supportsInterface("0xb36a9a7c")).should.be.true;
        });
    });

    describe('permission check', async function () {

        it('should query permissions correctly', async function() {
            await registry.permission(testDoc, [accounts[1], accounts[2]], {from: owner});
            let allowed = await relay.checkPermissions(accounts[1], testDoc);
            allowed.should.be.true;
            allowed = await relay.checkPermissions(accounts[2], testDoc);
            allowed.should.be.true;
            allowed = await relay.checkPermissions(accounts[3], testDoc);
            allowed.should.be.false;
        });
    });

});
