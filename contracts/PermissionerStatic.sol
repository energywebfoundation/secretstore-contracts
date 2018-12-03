pragma solidity ^0.4.21;

import "./SecretStorePermissioner.sol";

// Needed if you want burned-in values that cannot be changed afterwards
// and have a closed set of users/doc keys. Feel free to replace or add new fields.
// Note: this is not really life-like
contract PermissionerStatic is SecretStorePermissioner {
    bytes32 documentKeyId = 0x45ce99addb0f8385bd24f30da619ddcc0cadadab73e2a4ffb7801083086b3fc2;
    address alice = 0x3144de21dA6De18061f818836Fa3db8F3D6b6989;
    address bob = 0x6C4B8B199A41B721e0a95dF9860CF0A18732e76D;

    /// Both Alice and Bob can access the specified document
    function checkPermissions(address user, bytes32 document) public view returns (bool) {
        if (document == documentKeyId && (user == alice || user == bob) ) return true;
        return false; 
    }
}