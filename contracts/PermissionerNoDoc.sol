pragma solidity ^0.4.24;

import "./SecretStorePermissioner.sol";

// Another fire-and-forget permissioning contract that gives
// access to any address specified irrespective of the document key
// Note: this was used in the original Private Transactions tutorial, but not really life-like
contract PermissionerNoDoc is SecretStorePermissioner {
    address[] public addresses;

    constructor(address[] _addresses) public {
        addresses = _addresses;
    }

    // We only check users
    function checkPermissions(address user, bytes32 document) public view returns (bool) {
        for (uint i = 0; i < addresses.length; i++) {
            if (addresses[i] == user) return true;
        }
        return false;
    }
}
