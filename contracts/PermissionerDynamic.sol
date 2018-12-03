pragma solidity ^0.4.24;

import "./SecretStorePermissioner.sol";


// Permissioning contract to add an arbitrary number of doc keys and users
contract PermissionerDynamic is SecretStorePermissioner {

    mapping(bytes32 => address[]) public permissions;

    event Permission(bytes32 docID);

    function addPermission(bytes32 _docID, address[] users) public {
        // if doc ID is already in use, we do not allow to add/modify
        if (permissions[_docID].length != 0) revert("Document key ID is already in use.");
        permissions[_docID] = users;
        emit Permission(_docID);
    }

    function checkPermissions(address user, bytes32 document) public view returns (bool) {
        address[] storage addresses = permissions[document];
        for (uint i = 0; i < addresses.length; i++) {
            if (addresses[i] == user) return true;
        }
        return false;
    }

    // Utility function to return users of a key
    function users(bytes32 document) external view returns (address[]) {
        return permissions[document];
    }
}
