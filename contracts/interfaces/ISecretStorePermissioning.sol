pragma solidity ^0.4.21;


contract ISecretStorePermissioning {

    // Must return true if user has permission to get the specified key, false otherwise
    function checkPermissions(address user, bytes32 document) public view returns (bool);
}