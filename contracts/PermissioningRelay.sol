pragma solidity ^0.4.24;

import "./ERC165Query.sol";
import "./interfaces/ISecretStorePermissioning.sol";
import "./interfaces/IERC165Query.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/introspection/ERC165.sol";


contract PermissioningRelay is ISecretStorePermissioning, Ownable, ERC165 {

    ISecretStorePermissioning public permissioningContract;
    address[] public oldPermissioningContracts;

    IERC165Query public erc165Query;

    event NewPermissioningContract(address indexed newPermissioningContract);

    constructor(address _erc165Query, address _permissioningContract) public {
        require(_erc165Query != address(0), "ERC 165 Query contract address cannot be 0x0.");
        
        erc165Query = IERC165Query(_erc165Query);

        require(
            _isValidPermissioning(_permissioningContract),
            "Provided contract does not implement the 'checkPermissions' function, or does not support ERC-165."
        );

        // ERC 165 support
        _registerInterface(this.checkPermissions.selector);
        _registerInterface(
            this.owner.selector
            ^ this.isOwner.selector
            ^ this.renounceOwnership.selector
            ^ this.transferOwnership.selector
        );
        
        permissioningContract = ISecretStorePermissioning(_permissioningContract);
        emit NewPermissioningContract(_permissioningContract);
    }

    function checkPermissions(address user, bytes32 document) public view returns (bool) {
        return permissioningContract.checkPermissions(user, document);
    }

    function setPermissioningContract(address _newContract) public onlyOwner returns (address) {
        require(address(permissioningContract) != _newContract, "New permissioning contract address is the same as the old one.");
        require(address(this) != _newContract, "New permissioning contract cannot be this one.");
        require(
            _isValidPermissioning(_newContract),
            "Provided contract does not implement the 'checkPermissions' function, or does not support ERC-165."
        );

        oldPermissioningContracts.push(address(permissioningContract));
        permissioningContract = ISecretStorePermissioning(_newContract);

        emit NewPermissioningContract(_newContract);
        
        return oldPermissioningContracts[oldPermissioningContracts.length-1];
    }

    function setERC165Query(address _newContract) public onlyOwner returns (address) {
        require(_newContract != address(0), "ERC 165 Query contract address cannot be 0x0.");
        address _old = address(erc165Query);
        erc165Query = IERC165Query(_newContract);
        return _old;
    }

    function _isValidPermissioning(address _contract) internal view returns (bool) {
        return erc165Query.doesContractImplementInterface(
            _contract,
            this.checkPermissions.selector
        );
    }
}
