"use strict";

const defaultDocID = "0x45ce99addb0f8385bd24f30da619ddcc0cadadab73e2a4ffb7801083086b3fc2";
const defaultDID = "0xfefefefe";

const path = require('path');

const assert = require('chai').assert;
const expect = require('chai').expect;

const checker = require(path.join(__dirname, "../tools/checkpermissions.js"));

const alice = "0x3144de21da6de18061f818836fa3db8f3d6b6989";
const bob = "0x6c4b8b199a41b721e0a95df9860cf0a18732e76d";
const charlie = "0x8b2c16e09bfb011c5e4883cedb105124ccf01af7";

const contract = "0x7c495Cc4f2c4B0bfb2dc64EE04c7D7004B7c434F";


function checkPermissionsTrue(permissions) {
    assert.isTrue(permissions[alice]);
    assert.isTrue(permissions[bob]);
    assert.isFalse(permissions[charlie]);
}

describe("Permissiong checker", async function() {
    this.timeout(25000);

    const basicInput = {
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
    
    it('should check permissions correctly one by one', async () => {
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

    it('should check permissions correctly batched', async () => {
        let vargs = {...basicInput};
        let res = await checker(vargs);
        checkPermissionsTrue(res);
    });
});