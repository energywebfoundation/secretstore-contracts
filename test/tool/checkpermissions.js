"use strict";

const defaultDocID = "0x45ce99addb0f8385bd24f30da619ddcc0cadadab73e2a4ffb7801083086b3fc2";
const defaultDID = "0xfefefefe";

const path = require('path');

const assert = require('chai').assert;
const expect = require('chai').expect;

const checker = require(path.join(__dirname, "../../tools/checkpermissions.js"));
const deployer = require(path.join(__dirname, "../../tools/deploypermission.js"));

const alice = "0x3144de21da6de18061f818836fa3db8f3d6b6989";
const bob = "0x6c4b8b199a41b721e0a95df9860cf0a18732e76d";
const charlie = "0x8b2c16e09bfb011c5e4883cedb105124ccf01af7";


function checkPermissionsTrue(permissions) {
    assert.isTrue(permissions[alice]);
    assert.isTrue(permissions[bob]);
    assert.isFalse(permissions[charlie]);
}

let contract;
let basicInput;
describe("Permissiong checker", async function() {
    this.timeout(25000);

    before(async function() {
        
        let deployInput = {
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
        let instance = await deployer(deployInput);
        contract = instance.options.address;

        basicInput = {
            _: [ 'checkpermissions' ],
            address: contract,
            a: contract,
            docid: defaultDID,
            d: defaultDID,
            accounts: [alice, bob, charlie],
            acc: [alice, bob, charlie],
            from: undefined,
            f: undefined,
            rpc: 'http://localhost:8545',
            r: 'http://localhost:8545',
            '$0': 'deploy.js',
        };
    });
    
    it('should check permissions correctly one by one', async function() {
        let vargs = {...basicInput};
        let finalres = {}
        const ar = [alice, bob, charlie];

        for (let i = 0; i < ar.length; i++) {
            vargs.accounts = [ar[i]];
            vargs.acc = [ar[i]];
            let res = await checker(vargs);
            finalres[ar[i]] = res[ar[i]];
        }
        checkPermissionsTrue(finalres);
    });

    it('should check permissions correctly batched', async function() {
        let vargs = {...basicInput};
        let res = await checker(vargs);
        checkPermissionsTrue(res);
    });
});