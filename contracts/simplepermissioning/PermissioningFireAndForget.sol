pragma solidity ^0.6.0;

import "../interfaces/ISecretStorePermissioning.sol";


// FIre-and-forget permissioning contract for one document key
// Allows you to specify a doc key and permitted addresses in the constructor
contract PermissioningFireAndForget is ISecretStorePermissioning {
    bytes32 public documentKeyId;
    address[] public addresses;

    constructor(bytes32 docKeyId, address[] memory _addresses)
        public
    {
        documentKeyId = docKeyId;
        addresses = _addresses;
    }

    function checkPermissions(address user, bytes32 document)
        public
        view
        override
        returns (bool) 
    {
        if (document != documentKeyId)
            return false;

        for (uint i = 0; i < addresses.length; i++) {
            if (addresses[i] == user)
                return true;
        }

        return false;
    }
}
