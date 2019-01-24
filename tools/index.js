"use strict";
const deployPermission = require("./deploypermission.js");
const deployService = require("./deployservice.js");
const checkPermissions = require("./checkpermissions.js");
const deploySet = require("./deployset.js");

module.exports = {
    deployPermission,
    deployService,
    checkPermissions,
    deploySet
}