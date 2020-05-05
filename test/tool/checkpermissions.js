"use strict";

const defaultDocID = "0x45ce99addb0f8385bd24f30da619ddcc0cadadab73e2a4ffb7801083086b3fc2";
const defaultDID = "0xfefefefe";

const path = require('path');

const assert = require('chai').assert;
const expect = require('chai').expect;

const checker = require(path.join(__dirname, "../../tools/checkpermissions.js"));
const deployer = require(path.join(__dirname, "../../tools/deploypermission.js"));


let contract;
let basicInput;
let accounts;
let alice, bob, charlie;
describe("Permission checker", async function() {

    before(async function() {

        accounts = await require(path.join(__dirname, "../utils.js")).accounts("http://localhost:8545");
        alice = accounts[0];
        bob = accounts[1];
        charlie = accounts[2];
        
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
        assert.isTrue(finalres[alice]);
        assert.isTrue(finalres[bob]);
        assert.isFalse(finalres[charlie]);
    });

    it('should check permissions correctly batched', async function() {
        let vargs = {...basicInput};
        let res = await checker(vargs);
        assert.isTrue(res[alice]);
        assert.isTrue(res[bob]);
        assert.isFalse(res[charlie]);
    });
});