pragma solidity ^0.6.0;

import "../interfaces/ISecretStorePermissioning.sol";


// Another fire-and-forget permissioning contract that gives
// access to any address specified irrespective of the document key
// Note: this was used in the original Private Transactions tutorial, but not really life-like
contract PermissioningNoDoc is ISecretStorePermissioning {
    address[] public addresses;

    constructor(address[] memory _addresses) public {
        addresses = _addresses;
    }

    // We only check users
    function checkPermissions(address user, bytes32 document)
        public
        view
        override
        returns (bool)
    {
        for (uint i = 0; i < addresses.length; i++) {
            if (addresses[i] == user) {
                return true;
            }
        }
        return false;
    }
}
