#!/usr/bin/env node
"use strict";

const {deployPermission, checkPermissions, deploySet} = require("./tools");

const clargs = require("yargs")
    .usage('Usage: $0 <command> [options]')
    .command("deploypermission", "Deploy simple Secret Store permissioning contracts", (yargs) => {
        return yargs
        .option('contract', {
            type: 'string',
            desc: "Which contract to deploy. Please refer to it by name. E.g.: \"PermissioningDynamic\", or just simply \"Dynamic\". Case sensitive. It is used for JSON ABI file lookup.",
            choices: ['PermissioningDynamic', 'Dynamic', 'PermissioningNoDoc', 'NoDoc', 'PermissioningStatic', 'Static', 'PermissioningFireAndForget', 'FireAndForget'],
            demandOption: true,
            alias: "c"
        })
        .option('docid', {
            type: 'string',
            desc: "The document's ID to passed to the permissioning contract constructor, if it has any. It should be a exadec address starting with 0x",
            demandOption: false,
            alias: "d",
            default: undefined
        })
        .option('accounts', {
            type: 'array',
            desc: "Permissioned accounts to pass to the permissioning contract constructor.",
            demandOption: false,
            alias: "acc",
            default: []
        })
        .option('from', {
            type: 'string',
            desc: "Deployer account. Defaults to the first account of the local accounts list.",
            demandOption: false,
            alias: "f",
            default: undefined
        })
        .option('rpc', {
            type: 'string',
            desc: "HTTP RPC API endpoint.",
            demandOption: false,
            alias: "r",
            default: "http://localhost:8545" 
        })
    }, (vargs) => {
        deployPermission(vargs);
    })
    .command("deployset", "Deploy Secret Store node-set contract", (yargs) => {
        return yargs.option('from', {
            type: 'string',
            desc: "Deployer account. Defaults to the first account of the local accounts list.",
            demandOption: false,
            alias: "f",
            default: undefined
        })
        .option('rpc', {
            type: 'string',
            desc: "HTTP RPC API endpoint.",
            demandOption: false,
            alias: "r",
            default: "http://localhost:8545" 
        })
    }, (vargs) => {
        deploySet(vargs);
    })
    .command("checkpermissions", "Check permission of accounts for deployed contracts.", (yargs) => {
        return yargs.option('address', {
            type: 'string',
            desc: "The address of the permissioning contract.",
            demandOption: true,
            alias: "a"
        })
        .option('docid', {
            type: 'string',
            desc: "The document's ID to check permissions for.",
            demandOption: true,
            alias: "d"
        })
        .option('accounts', {
            type: 'array',
            desc: "Accounts to check for the given document ID. Multiple can be given which are checked individually.",
            demandOption: true,
            alias: "acc"
        })
        .option('rpc', {
            type: 'string',
            desc: "HTTP RPC API endpoint. Defaults to http://localhost:8545",
            demandOption: false,
            alias: "r",
            default: "http://localhost:8545" 
        })
    }, (vargs) => {
        checkPermissions(vargs);
    })
    .demandCommand(1, 'You need to give at least a command.')
    .argv;
