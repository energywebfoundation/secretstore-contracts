pragma solidity ^0.6.0;


interface ISecretStorePermissioning {

    // Must return true if user has permission to get the specified key, false otherwise
    function checkPermissions(address user, bytes32 document)
        external
        view
        returns (bool);
}

interface ISecretStorePermissioningExtended is ISecretStorePermissioning {

    // Returns all available keys for the user
    function availableKeys(address user)
        external
        view
        returns (bytes32[] memory);
}
