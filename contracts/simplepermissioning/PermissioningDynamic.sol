pragma solidity ^0.6.0;

import "../interfaces/ISecretStorePermissioning.sol";


// Permissioning contract to add an arbitrary number of doc keys and users
contract PermissioningDynamic is ISecretStorePermissioning {

    mapping(bytes32 => address[]) public permissions;

    event Permission(bytes32 docID);

    // Utility function to return users of a key
    function users(bytes32 document)
        external
        view
        returns (address[] memory)
    {
        return permissions[document];
    }

    function addPermission(bytes32 _docID, address[] memory _users)
        public
    {
        // if doc ID is already in use, we do not allow to add/modify
        if (permissions[_docID].length != 0)
            revert("Document key ID is already in use.");
        permissions[_docID] = _users;
        emit Permission(_docID);
    }

    function checkPermissions(address user, bytes32 document)
        public
        view
        override
        returns (bool)
    {
        address[] storage addresses = permissions[document];
        for (uint i = 0; i < addresses.length; i++) {
            if (addresses[i] == user)
                return true;
        }
        return false;
    }
}
